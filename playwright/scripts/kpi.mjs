import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const resultsUrl = new URL('../test-results/playwright-results.json', import.meta.url);
const dashboardUrl = new URL('../test-results/quality-kpis.json', import.meta.url);
const publicDirectoryUrl = new URL('../public/', import.meta.url);
const htmlDashboardUrl = new URL('../public/index.html', import.meta.url);
const reportDirectoryUrl = new URL('../playwright-report/', import.meta.url);
const reportIndexUrl = new URL('../playwright-report/index.html', import.meta.url);
const reportDetailsUrl = new URL('../playwright-report/playwright-details.html', import.meta.url);
const results = JSON.parse(readFileSync(resultsUrl, 'utf8'));
const stats = results.stats;

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