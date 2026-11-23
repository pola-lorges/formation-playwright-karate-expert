import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyFailure } from './failure-classifier.mjs';

const resultsUrl = new URL('../test-results/playwright-results.json', import.meta.url);
const reportJsonUrl = new URL('../test-results/failure-triage.json', import.meta.url);
const reportMarkdownUrl = new URL('../test-results/failure-triage.md', import.meta.url);
const results = JSON.parse(readFileSync(resultsUrl, 'utf8'));
const failures = [];

function sanitize(value) {
  return String(value ?? '')
    .replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '')
    .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
    .replace(/((?:password|passwd|token|secret|authorization)\s*[:=]\s*)[^\s,;"']+/gi, '$1[REDACTED]')
    .replace(/([?&](?:access_token|refresh_token|token|key|password)=)[^&\s]+/gi, '$1[REDACTED]')
    .slice(0, 1600);
}

function collectSuite(suite) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const attempts = test.results ?? [];
      const status = test.status ?? attempts.at(-1)?.status;
      if (!['unexpected', 'flaky', 'failed', 'timedOut', 'interrupted'].includes(status)) continue;

      const errorText = attempts
        .flatMap(attempt => [attempt.error?.message, ...(attempt.errors ?? []).map(error => error.message)])
        .filter(Boolean)
        .join('\n');
      const classification = classifyFailure(`${spec.title}\n${errorText}`, { status, results: attempts });
      const attachments = attempts.flatMap(attempt => attempt.attachments ?? [])
        .filter(attachment => /trace|screenshot|video/i.test(attachment.name ?? ''))
        .map(attachment => ({
          name: sanitize(attachment.name),
          path: attachment.path ? sanitize(relative(process.cwd(), attachment.path)) : null,
        }));

      failures.push({
        title: sanitize(spec.title),
        file: sanitize(spec.file ?? suite.file),
        line: spec.line ?? null,
        project: sanitize(test.projectName),
        status,
        attempts: attempts.length,
        classification,
        error: sanitize(errorText || 'Aucun message d’erreur disponible dans le rapport JSON.'),
        evidence: attachments,
      });
    }
  }

  for (const child of suite.suites ?? []) collectSuite(child);
}

for (const suite of results.suites ?? []) collectSuite(suite);

const report = {
  generatedAt: new Date().toISOString(),
  pipelineUrl: process.env.CI_PIPELINE_URL ?? null,
  totalFailures: failures.length,
  triageTargetMinutes: 30,
  failures,
};

const markdown = [
  '# Playwright Failure Triage',
  '',
  `Généré le : ${report.generatedAt}`,
  `Échecs à trier : ${report.totalFailures}`,
  'Délai cible de triage : 30 minutes après pipeline rouge.',
  report.pipelineUrl ? `Pipeline : ${report.pipelineUrl}` : '',
  '',
  failures.length ? '## Échecs et actions suggérées' : '## Aucun échec Playwright détecté',
  '',
  ...failures.flatMap((failure, index) => [
    `### ${index + 1}. ${failure.title}`,
    `- Fichier : ${failure.file}${failure.line ? `:${failure.line}` : ''}`,
    `- Projet / statut : ${failure.project} / ${failure.status} (${failure.attempts} tentative(s))`,
    `- Cause probable : **${failure.classification.category}** (confiance ${failure.classification.confidence})`,
    `- Propriétaire suggéré : ${failure.classification.owner}`,
    `- Prochaine action : ${failure.classification.action}`,
    `- Erreur : \`${failure.error.replace(/`/g, "'").replace(/\n/g, ' ')}\``,
    `- Preuves : ${failure.evidence.length ? failure.evidence.map(item => item.path ? `[${item.name}](${item.path})` : item.name).join(', ') : 'voir les artefacts du test dans le rapport Playwright'}`,
    '',
  ]),
  '## Limite du triage automatique',
  '',
  'La catégorie est une hypothèse basée sur les messages Playwright. Confirmer la cause dans la trace, le réseau, la console et les données avant d’assigner définitivement un ticket.',
  '',
].filter(Boolean).join('\n');

mkdirSync(new URL('../test-results/', import.meta.url), { recursive: true });
writeFileSync(reportJsonUrl, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(reportMarkdownUrl, markdown);

console.log(`Échecs analysés : ${failures.length}`);
for (const failure of failures) {
  console.log(`- [${failure.classification.category}] ${failure.title} -> ${failure.classification.owner}`);
}
console.log(`Rapport Markdown : ${fileURLToPath(reportMarkdownUrl)}`);
console.log(`Rapport JSON : ${fileURLToPath(reportJsonUrl)}`);