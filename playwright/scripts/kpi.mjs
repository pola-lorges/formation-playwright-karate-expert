import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const resultsUrl = new URL('../test-results/playwright-results.json', import.meta.url);
const failureTriageUrl = new URL('../test-results/failure-triage.json', import.meta.url);
const dashboardUrl = new URL('../test-results/quality-kpis.json', import.meta.url);
const publicDirectoryUrl = new URL('../public/', import.meta.url);
const htmlDashboardUrl = new URL('../public/index.html', import.meta.url);
const reportDirectoryUrl = new URL('../playwright-report/', import.meta.url);
const reportIndexUrl = new URL('../playwright-report/index.html', import.meta.url);
const reportDetailsUrl = new URL('../playwright-report/playwright-details.html', import.meta.url);
const results = JSON.parse(readFileSync(resultsUrl, 'utf8'));
const failureTriage = existsSync(failureTriageUrl)
  ? JSON.parse(readFileSync(failureTriageUrl, 'utf8'))
  : null;
const stats = results.stats;
const performanceMetrics = [];

function collectPerformanceMetrics(suite) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      for (const annotation of test.annotations ?? []) {
        if (annotation.type !== 'performance') continue;
        try {
          performanceMetrics.push({
            test: spec.title,
            project: test.projectName,
            ...JSON.parse(annotation.description),
          });
        } catch {
          console.warn(`Invalid performance annotation in test: ${spec.title}`);
        }
      }
    }
  }
  for (const child of suite.suites ?? []) collectPerformanceMetrics(child);
}

for (const suite of results.suites ?? []) collectPerformanceMetrics(suite);

const passed = stats.expected ?? 0;
const failed = stats.unexpected ?? 0;
const flaky = stats.flaky ?? 0;
const skipped = stats.skipped ?? 0;
const executed = passed + failed + flaky;
const cleanPassRate = executed ? Number(((passed / executed) * 100).toFixed(1)) : 0;
const durationMinutes = Number((stats.duration / 60_000).toFixed(2));

const dashboard = {
  generatedAt: new Date().toISOString(),
  source: 'Playwright JSON reporter',
  pipelineUrl: process.env.CI_PIPELINE_URL ?? null,
  totals: { executed, passed, failed, flaky, skipped },
  kpis: {
    cleanPassRatePercent: cleanPassRate,
    flakyRatePercent: executed ? Number(((flaky / executed) * 100).toFixed(1)) : 0,
    durationMinutes,
    performance: performanceMetrics,
  },
};

const cleanPassStatus = cleanPassRate >= 98 ? 'good' : cleanPassRate >= 95 ? 'watch' : 'bad';
const flakyStatus = dashboard.kpis.flakyRatePercent === 0
  ? 'good'
  : dashboard.kpis.flakyRatePercent <= 2 ? 'watch' : 'bad';
const durationStatus = durationMinutes <= 5 ? 'good' : durationMinutes <= 10 ? 'watch' : 'bad';
const overallStatus = failed > 0 || cleanPassStatus === 'bad' || flakyStatus === 'bad'
  ? 'bad'
  : cleanPassStatus === 'watch' || flakyStatus === 'watch' || durationStatus === 'watch'
    ? 'watch'
    : 'good';
const statusLabel = { good: 'Dans les seuils', watch: 'À surveiller', bad: 'Action requise' };
const generatedDate = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'long',
  timeStyle: 'short',
}).format(new Date(dashboard.generatedAt));
const pipelineLink = dashboard.pipelineUrl
  ? `<a class="pipeline-link" href="${dashboard.pipelineUrl}">Ouvrir la pipeline GitLab</a>`
  : '';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));
const failureItems = failureTriage?.failures ?? [];
const confidenceLabel = { high: 'élevée', medium: 'moyenne', low: 'faible' };
const triageContent = failureTriage
  ? failureItems.length
    ? failureItems.map(failure => `
        <article class="failure-item">
          <div class="failure-topline">
            <h3>${escapeHtml(failure.title)}</h3>
            <span class="category">${escapeHtml(failure.classification.category)}</span>
          </div>
          <p class="failure-location">${escapeHtml(failure.file)}${failure.line ? `:${failure.line}` : ''} · ${escapeHtml(failure.project)} · ${escapeHtml(failure.status)}</p>
          <dl class="failure-details">
            <div><dt>Confiance</dt><dd>${escapeHtml(confidenceLabel[failure.classification.confidence] ?? failure.classification.confidence)}</dd></div>
            <div><dt>Responsable suggéré</dt><dd>${escapeHtml(failure.classification.owner)}</dd></div>
          </dl>
          <p class="failure-action"><strong>Action proposée :</strong> ${escapeHtml(failure.classification.action)}</p>
          <details>
            <summary>Voir le message d’erreur et les preuves</summary>
            <pre>${escapeHtml(failure.error)}</pre>
            <div class="evidence-links">${failure.evidence.length
    ? failure.evidence.map(item => item.path
      ? `<a href="../${escapeHtml(item.path)}">${escapeHtml(item.name)}</a>`
      : `<span>${escapeHtml(item.name)}</span>`).join('')
    : '<span>Voir les artefacts du test dans le rapport Playwright</span>'}</div>
          </details>
        </article>`).join('')
    : '<p class="no-failures">Aucun échec détecté dans ce run.</p>'
  : '<p class="no-failures">Le triage n’a pas encore été généré. Lance <code>npm run report:failures</code>, puis régénère le rapport.</p>';
const triageReportLink = failureTriage
  ? '<a class="text-link" href="../test-results/failure-triage.md">Ouvrir le rapport Markdown complet</a>'
  : '';
const performanceContent = performanceMetrics.length
  ? performanceMetrics.map(metric => `
      <article class="metric performance-metric ${metric.navigation?.loadEventMs > (metric.budgets?.pageLoadMs ?? Infinity) || metric.customersApi?.durationMs > (metric.budgets?.customersApiMs ?? Infinity) ? 'watch' : 'good'}">
        <p class="metric-label">${escapeHtml(metric.page)} · ${escapeHtml(metric.project)}</p>
        <p class="metric-value">${metric.navigation?.loadEventMs ?? 'N/D'}<span style="font-size:16px"> ms</span></p>
        <p class="metric-note">Chargement page · budget indicatif ${metric.budgets?.pageLoadMs ?? 'N/D'} ms${metric.navigation?.loadEventMs > (metric.budgets?.pageLoadMs ?? Infinity) ? ' · À surveiller' : ' · OK'}</p>
        <p class="metric-note">TTFB ${metric.navigation?.ttfbMs ?? 'N/D'} ms · DOM ready ${metric.navigation?.domContentLoadedMs ?? 'N/D'} ms</p>
        <p class="metric-note">API Clients ${metric.customersApi ? `${escapeHtml(metric.customersApi.endpoint)} · ${metric.customersApi.durationMs} ms · HTTP ${metric.customersApi.status}${metric.customersApi.durationMs > (metric.budgets?.customersApiMs ?? Infinity) ? ' · À surveiller' : ' · OK'}` : 'non observée pendant ce parcours'}</p>
        <details>
          <summary>${metric.apiResponses?.length ?? 0} requête(s) fetch/XHR observée(s)</summary>
          <ul>${(metric.apiResponses ?? []).map(response => `<li>${escapeHtml(response.endpoint)} · ${response.durationMs} ms · HTTP ${response.status}</li>`).join('') || '<li>Aucune requête fetch/XHR</li>'}</ul>
        </details>
        <p class="metric-note">Budget API indicatif ${metric.budgets?.customersApiMs ?? 'N/D'} ms; signal seulement</p>
      </article>`).join('')
  : '<p class="no-failures">Aucune mesure de performance dans ce run. Lance <code>npm run test:perf</code> pour mesurer le parcours Clients.</p>';

const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Qualité des tests Playwright</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #172a2c;
      --muted: #5c6e6e;
      --paper: #f3f6f3;
      --line: #d7e0dc;
      --teal: #087f75;
      --green: #167447;
      --amber: #a66000;
      --red: #b13d37;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--paper);
      color: var(--ink);
      font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 48px 0 56px; }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      padding-bottom: 28px;
      border-bottom: 1px solid var(--line);
    }
    .eyebrow { margin: 0 0 8px; color: var(--teal); font-size: 12px; font-weight: 750; text-transform: uppercase; }
    h1 { margin: 0; font-family: Georgia, "Times New Roman", serif; font-size: clamp(30px, 5vw, 46px); font-weight: 500; line-height: 1.08; }
    .updated { margin: 12px 0 0; color: var(--muted); }
    .overall {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      flex: 0 0 auto;
      padding: 9px 12px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      font-size: 13px;
      font-weight: 700;
    }
    .dot { width: 9px; height: 9px; border-radius: 50%; background: currentColor; }
    .good { color: var(--green); }
    .watch { color: var(--amber); }
    .bad { color: var(--red); }
    .section-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; margin: 30px 0 14px; }
    h2 { margin: 0; font-size: 17px; }
    .section-heading p { margin: 0; color: var(--muted); font-size: 13px; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .metric { min-width: 0; padding: 19px; border: 1px solid var(--line); border-top: 3px solid var(--teal); border-radius: 6px; background: #fff; }
    .metric.good { border-top-color: var(--green); }
    .metric.watch { border-top-color: var(--amber); }
    .metric.bad { border-top-color: var(--red); }
    .metric-label { margin: 0; color: var(--muted); font-size: 13px; }
    .metric-value { margin: 10px 0 5px; font-size: 34px; font-weight: 750; line-height: 1; font-variant-numeric: tabular-nums; }
    .metric-note { margin: 0; color: var(--muted); font-size: 12px; }
    .summary { display: flex; flex-wrap: wrap; gap: 8px 26px; padding: 17px 19px; border: 1px solid var(--line); border-radius: 6px; background: #fff; }
    .summary span { color: var(--muted); }
    .summary strong { color: var(--ink); font-variant-numeric: tabular-nums; }
    footer { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 24px; color: var(--muted); font-size: 12px; }
    .pipeline-link { color: var(--teal); font-weight: 700; }
    .details-link {
      display: inline-flex;
      margin-top: 20px;
      padding: 11px 15px;
      border-radius: 6px;
      background: var(--ink);
      color: #fff;
      font-weight: 700;
      text-decoration: none;
    }
    .triage-list { display: grid; gap: 10px; }
    .failure-item { padding: 18px; border: 1px solid var(--line); border-left: 4px solid var(--red); border-radius: 6px; background: #fff; }
    .failure-topline { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
    .failure-topline h3 { margin: 0; font-size: 15px; overflow-wrap: anywhere; }
    .category { flex: 0 0 auto; padding: 3px 8px; border-radius: 4px; background: #f9e9e7; color: var(--red); font-size: 12px; font-weight: 700; }
    .failure-location { margin: 6px 0 12px; color: var(--muted); font-size: 12px; overflow-wrap: anywhere; }
    .failure-details { display: flex; flex-wrap: wrap; gap: 8px 26px; margin: 0 0 12px; }
    .failure-details div { display: flex; gap: 6px; }
    .failure-details dt { color: var(--muted); }
    .failure-details dd { margin: 0; font-weight: 700; }
    .failure-action { margin: 0 0 12px; }
    .failure-item details { border-top: 1px solid var(--line); padding-top: 10px; }
    .failure-item summary { color: var(--teal); cursor: pointer; font-size: 13px; font-weight: 700; }
    .failure-item pre { max-height: 230px; overflow: auto; padding: 12px; border-radius: 4px; background: #f3f6f3; color: var(--ink); font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; overflow-wrap: anywhere; }
    .evidence-links { display: flex; flex-wrap: wrap; gap: 8px 14px; font-size: 12px; }
    .evidence-links a, .text-link { color: var(--teal); font-weight: 700; }
    .no-failures { padding: 16px 18px; border: 1px solid var(--line); border-radius: 6px; background: #fff; }
    .performance-metric { border-top-color: var(--teal); }
    @media (max-width: 760px) {
      main { width: min(100% - 28px, 560px); padding-top: 28px; }
      header { flex-direction: column; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      footer { align-items: flex-start; flex-direction: column; }
    }
    @media (max-width: 390px) {
      .grid { grid-template-columns: 1fr; }
      .section-heading { align-items: flex-start; flex-direction: column; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <p class="eyebrow">Quality engineering · Playwright</p>
        <h1>Qualité du dernier run</h1>
        <p class="updated">Mis à jour le ${generatedDate}</p>
      </div>
      <div class="overall ${overallStatus}" role="status"><span class="dot"></span>${statusLabel[overallStatus]}</div>
    </header>
    <section aria-labelledby="kpi-title">
      <div class="section-heading">
        <h2 id="kpi-title">Indicateurs clés</h2>
        <p>Seuils initiaux · voir QUALITY_KPIS.md</p>
      </div>
      <div class="grid">
        <article class="metric ${cleanPassStatus}">
          <p class="metric-label">Réussite propre</p>
          <p class="metric-value">${cleanPassRate}%</p>
          <p class="metric-note">Cible verte : au moins 98%</p>
        </article>
        <article class="metric ${failed === 0 ? 'good' : 'bad'}">
          <p class="metric-label">Échecs</p>
          <p class="metric-value">${failed}</p>
          <p class="metric-note">Tests non réussis dans ce run</p>
        </article>
        <article class="metric ${flakyStatus}">
          <p class="metric-label">Taux flaky</p>
          <p class="metric-value">${dashboard.kpis.flakyRatePercent}%</p>
          <p class="metric-note">Cible verte : 0%</p>
        </article>
        <article class="metric ${durationStatus}">
          <p class="metric-label">Durée</p>
          <p class="metric-value">${durationMinutes}<span style="font-size:16px"> min</span></p>
          <p class="metric-note">Cible verte : 5 min maximum</p>
        </article>
      </div>
    </section>
    <section aria-labelledby="run-title">
      <div class="section-heading">
        <h2 id="run-title">Résumé du run</h2>
        <p>Source : ${dashboard.source}</p>
      </div>
      <div class="summary">
        <span>Exécutés <strong>${executed}</strong></span>
        <span>Réussis sans retry <strong>${passed}</strong></span>
        <span>Flaky <strong>${flaky}</strong></span>
        <span>Ignorés <strong>${skipped}</strong></span>
      </div>
    </section>
    <section aria-labelledby="performance-title">
      <div class="section-heading">
        <h2 id="performance-title">Mesures de performance · ${performanceMetrics.length}</h2>
        <p>Signaux indicatifs, non bloquants</p>
      </div>
      <div class="grid">${performanceContent}</div>
    </section>
    <section aria-labelledby="triage-title">
      <div class="section-heading">
        <h2 id="triage-title">Triage des échecs · ${failureTriage?.totalFailures ?? '—'}</h2>
        ${triageReportLink}
      </div>
      <div class="triage-list">${triageContent}</div>
    </section>
    <a class="details-link" href="playwright-details.html">Consulter le rapport détaillé Playwright</a>
    <footer>
      <span>Les seuils sont initiaux et doivent être calibrés avec l’équipe.</span>
      ${pipelineLink}
    </footer>
  </main>
</body>
</html>
`;

console.table([
  { KPI: 'Tests exécutés', Valeur: executed },
  { KPI: 'Réussis sans retry', Valeur: passed },
  { KPI: 'Échecs', Valeur: failed },
  { KPI: 'Flaky (réussis après retry)', Valeur: flaky },
  { KPI: 'Ignorés', Valeur: skipped },
  { KPI: 'Taux de réussite propre (%)', Valeur: cleanPassRate },
  { KPI: 'Taux flaky (%)', Valeur: dashboard.kpis.flakyRatePercent },
  { KPI: 'Durée (minutes)', Valeur: durationMinutes },
]);

writeFileSync(dashboardUrl, `${JSON.stringify(dashboard, null, 2)}\n`);
console.log(`Résumé KPI écrit dans ${fileURLToPath(dashboardUrl)}`);
mkdirSync(publicDirectoryUrl, { recursive: true });
writeFileSync(htmlDashboardUrl, html);
console.log(`Dashboard HTML écrit dans ${fileURLToPath(htmlDashboardUrl)}`);

mkdirSync(reportDirectoryUrl, { recursive: true });
if (existsSync(reportIndexUrl)) {
  const currentIndex = readFileSync(reportIndexUrl, 'utf8');
  if (!currentIndex.includes('data-kpi-dashboard') && existsSync(reportDetailsUrl)) {
    writeFileSync(reportDetailsUrl, currentIndex);
    writeFileSync(reportIndexUrl, html.replace('<html lang="fr">', '<html lang="fr" data-kpi-dashboard="true">'));
  } else if (!currentIndex.includes('data-kpi-dashboard')) {
    renameSync(reportIndexUrl, reportDetailsUrl);
    writeFileSync(reportIndexUrl, html.replace('<html lang="fr">', '<html lang="fr" data-kpi-dashboard="true">'));
  } else {
    writeFileSync(reportIndexUrl, html.replace('<html lang="fr">', '<html lang="fr" data-kpi-dashboard="true">'));
  }
  console.log(`Page KPI intégrée au rapport Playwright : ${fileURLToPath(reportIndexUrl)}`);
} else {
  console.warn('Rapport HTML Playwright absent ; la page KPI reste disponible dans public/index.html');
}