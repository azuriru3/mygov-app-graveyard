import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsvLine, parseGovAppsCsv, dedupeApps, fetchGovAppsCsv, CSV_URL } from '../scripts/lib/csv.js';

test('parseCsvLine splits the first 6 commas and lumps the rest into the 7th field', () => {
  const fields = parseCsvLine('35,myHRMIS Mobile,Android,2014-12-18,2026-02-24,,Aplikasi, with, commas');
  assert.deepEqual(fields, ['35', 'myHRMIS Mobile', 'Android', '2014-12-18', '2026-02-24', '', 'Aplikasi, with, commas']);
});

test('parseGovAppsCsv skips the header and parses rows into raw row objects', () => {
  const csv = [
    'app_id,app_name,app_os_platform,released,last_updated,shutdown,purpose',
    '35,myCuaca,Android,2015-04-21,2024-10-11,,myCuaca oleh JMM',
    '35,myCuaca,iOS,2015-04-21,2024-10-11,,myCuaca oleh JMM',
  ].join('\n');

  const rows = parseGovAppsCsv(csv);

  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], {
    app_id: '35',
    app_name: 'myCuaca',
    app_os_platform: 'Android',
    released: '2015-04-21',
    last_updated: '2024-10-11',
    shutdown: null,
  });
});

test('dedupeApps merges rows for the same app_id across platforms, keeping the latest lastUpdated', () => {
  const rows = [
    { app_id: '35', app_name: 'myCuaca', app_os_platform: 'Android', released: '2015-04-21', last_updated: '2020-01-01', shutdown: null },
    { app_id: '35', app_name: 'myCuaca', app_os_platform: 'iOS', released: '2015-04-21', last_updated: '2024-10-11', shutdown: null },
  ];

  const apps = dedupeApps(rows);

  assert.equal(apps.length, 1);
  assert.deepEqual(apps[0], {
    appId: '35',
    appName: 'myCuaca',
    platforms: ['Android', 'iOS'],
    released: '2015-04-21',
    lastUpdated: '2024-10-11',
    shutdown: null,
  });
});

test('dedupeApps keeps the shutdown date once any platform row reports one', () => {
  const rows = [
    { app_id: '119', app_name: 'MARDI Tek. Kambing Pedaging', app_os_platform: 'Android', released: '2015-12-22', last_updated: '2023-08-15', shutdown: null },
    { app_id: '119', app_name: 'MARDI Tek. Kambing Pedaging', app_os_platform: 'iOS', released: '2015-12-22', last_updated: '2023-08-15', shutdown: '2023-08-15' },
  ];

  const apps = dedupeApps(rows);

  assert.equal(apps[0].shutdown, '2023-08-15');
});

test('fetchGovAppsCsv requests the official CSV_URL and returns the body text', async () => {
  let requestedUrl;
  const fakeFetch = async (url) => {
    requestedUrl = url;
    return { ok: true, text: async () => 'app_id,app_name\n1,Test' };
  };

  const text = await fetchGovAppsCsv(fakeFetch);

  assert.equal(requestedUrl, CSV_URL);
  assert.equal(text, 'app_id,app_name\n1,Test');
});

test('fetchGovAppsCsv throws when the response is not ok', async () => {
  const fakeFetch = async () => ({ ok: false, status: 500 });
  await assert.rejects(() => fetchGovAppsCsv(fakeFetch), /HTTP 500/);
});
