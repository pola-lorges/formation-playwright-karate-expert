const categories = {
  Flaky: {
    owner: 'QA',
    action: 'Comparer les tentatives et la trace; corriger la synchronisation ou isoler la dépendance instable.',
  },
  Network: {
    owner: 'Ops / Réseau',
    action: 'Vérifier la connectivité, DNS, proxy et disponibilité du endpoint depuis le runner.',
  },
  Environment: {
    owner: 'Ops',
    action: 'Vérifier la santé de l’environnement, ses services, sa configuration et ses ressources.',
  },
  Data: {
    owner: 'QA / Data',
    action: 'Vérifier le jeu de données, son état partagé et son isolation; rendre les données uniques si nécessaire.',
  },
  Automation: {
    owner: 'QA',
    action: 'Vérifier le locator, la synchronisation et la trace; confirmer que le sélecteur reflète le contrat UI.',
  },
  Application: {
    owner: 'Développement',
    action: 'Comparer le résultat attendu à l’état UI/API et confirmer le défaut avant de créer ou assigner un ticket.',
  },
};

export function classifyFailure(message, { status, results = [] } = {}) {
  const text = String(message ?? '');
  const failedAttempts = results.filter(result => result.status === 'failed' || result.status === 'timedOut');
  const passedAfterFailure = failedAttempts.length > 0 && results.at(-1)?.status === 'passed';

  if (status === 'flaky' || passedAfterFailure) {
    return { category: 'Flaky', confidence: 'high', ...categories.Flaky };
  }
  if (/ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ERR_NAME_NOT_RESOLVED|net::ERR_|socket hang up|network error|fetch failed/i.test(text)) {
    return { category: 'Network', confidence: 'medium', ...categories.Network };
  }
  if (/navigated to [^\n]*\/(?:login|unauthorized)|redirect(?:ed|ion)? to [^\n]*\/(?:login|unauthorized)/i.test(text)) {
    return { category: 'Environment', confidence: 'low', ...categories.Environment };
  }
  if (/\b(500|502|503|504)\b|worker process exited|browser.*(crash|closed)|out of memory/i.test(text)) {
    return { category: 'Environment', confidence: 'medium', ...categories.Environment };
  }
  if (/getByRole\(['"]row['"]\).*filter|clientRow\(|created client/i.test(text)) {
    return { category: 'Data', confidence: 'low', ...categories.Data };
  }
  if (/fixture|test data|seed|duplicate|already exists|not found in (database|list)|missing test data/i.test(text)) {
    return { category: 'Data', confidence: 'medium', ...categories.Data };
  }
  if (/strict mode violation|locator.*(not found|resolved to 0)|element\(s\) not found|no element matched|waiting for (getBy|locator\()/i.test(text)) {
    return { category: 'Automation', confidence: 'low', ...categories.Automation };
  }
  if (/timeout.*exceeded|timed out/i.test(text)) {
    return { category: 'Automation', confidence: 'low', ...categories.Automation };
  }
  if (/expect\(|expected|received|assertion|to be visible|to have text|status.*(?:expected|received)/i.test(text)) {
    return { category: 'Application', confidence: 'low', ...categories.Application };
  }
  return { category: 'Application', confidence: 'low', ...categories.Application };
}

export const failureCategories = Object.keys(categories);