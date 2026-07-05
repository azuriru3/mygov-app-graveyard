const STATUS_LABELS = {
  shutdown: 'Shut down',
  'active-fresh': 'Actively maintained',
  'active-stale': 'Stale (1-3 years)',
  'active-abandoned': 'Abandoned (3+ years)',
};

async function loadDataset() {
  const res = await fetch('./data.json');
  if (!res.ok) throw new Error(`Failed to load data.json: ${res.status}`);
  return res.json();
}

function renderSummary(summary, generatedAt) {
  const el = document.getElementById('summary');
  const pct = (n) => Math.round((n / summary.totalApps) * 100);
  el.innerHTML = `
    <p class="headline">${summary.totalApps} official apps tracked</p>
    <ul class="stat-list">
      <li><strong>${summary.abandonedCount}</strong> (${pct(summary.abandonedCount)}%) untouched 3+ years</li>
      <li><strong>${summary.staleCount}</strong> (${pct(summary.staleCount)}%) untouched 1-3 years</li>
      <li><strong>${summary.freshCount}</strong> (${pct(summary.freshCount)}%) updated within a year</li>
      <li><strong>${summary.shutdownCount}</strong> formally shut down</li>
    </ul>
    <p class="generated-at">Last refreshed: ${new Date(generatedAt).toLocaleString('en-MY')}</p>
  `;
}

function renderHallOfShame(hallOfShame) {
  const el = document.getElementById('hall-of-shame');
  if (hallOfShame.length === 0) {
    el.innerHTML = '<p>No critical apps currently qualify. Good news, for once.</p>';
    return;
  }
  el.innerHTML = hallOfShame
    .map((app) => {
      const years = app.lastUpdated
        ? ((Date.now() - new Date(app.lastUpdated)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1)
        : 'unknown';
      const rating = app.itunes?.averageUserRating
        ? `${app.itunes.averageUserRating.toFixed(1)}★ (${app.itunes.userRatingCount} ratings)`
        : 'no App Store rating on record';
      return `
        <div class="shame-card">
          <h3>${app.appName}</h3>
          <p class="agency">${app.agency}</p>
          <p>${years} years since last update &middot; ${rating}</p>
        </div>
      `;
    })
    .join('');
}

function renderTable(apps) {
  const tbody = document.querySelector('#app-table tbody');
  tbody.innerHTML = apps
    .map(
      (app) => `
        <tr>
          <td>${app.appName}</td>
          <td>${app.agency}</td>
          <td>${STATUS_LABELS[app.status]}</td>
          <td>${app.lastUpdated ?? 'unknown'}</td>
        </tr>
      `
    )
    .join('');
}

function renderChart(summary) {
  const ctx = document.getElementById('age-chart');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Fresh (<1yr)', 'Stale (1-3yr)', 'Abandoned (3+yr)', 'Shut down'],
      datasets: [
        {
          label: 'Number of apps',
          data: [summary.freshCount, summary.staleCount, summary.abandonedCount, summary.shutdownCount],
          backgroundColor: ['#3fb950', '#d29922', '#f85149', '#8b949e'],
        },
      ],
    },
    options: { plugins: { legend: { display: false } } },
  });
}

async function main() {
  const dataset = await loadDataset();
  renderSummary(dataset.summary, dataset.generatedAt);
  renderHallOfShame(dataset.hallOfShame);
  renderTable(dataset.apps);
  renderChart(dataset.summary);
}

main().catch((err) => {
  document.getElementById('summary').textContent = 'Failed to load data: ' + err.message;
  console.error(err);
});
