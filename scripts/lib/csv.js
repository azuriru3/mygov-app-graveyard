export const CSV_URL = 'https://storage.data.gov.my/publicadmin/government_apps.csv';

// The CSV has exactly 7 columns and the last one ("purpose") is inconsistent
// free text that sometimes contains unescaped commas. We never read
// "purpose", so we only need the first 6 fields split correctly: split on
// the first 6 commas and lump everything after that into the 7th field.
export function parseCsvLine(line) {
  const commaPositions = [];
  for (let i = 0; i < line.length && commaPositions.length < 6; i++) {
    if (line[i] === ',') commaPositions.push(i);
  }
  const fields = [];
  let start = 0;
  for (const pos of commaPositions) {
    fields.push(line.slice(start, pos));
    start = pos + 1;
  }
  fields.push(line.slice(start));
  return fields;
}

export function parseGovAppsCsv(csvText) {
  const lines = csvText
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  const [, ...dataLines] = lines;

  return dataLines.map((line) => {
    const [app_id, app_name, app_os_platform, released, last_updated, shutdown] = parseCsvLine(line);
    return {
      app_id,
      app_name,
      app_os_platform,
      released: released || null,
      last_updated: last_updated || null,
      shutdown: shutdown || null,
    };
  });
}

export function dedupeApps(rows) {
  const byId = new Map();

  for (const row of rows) {
    const existing = byId.get(row.app_id);
    if (!existing) {
      byId.set(row.app_id, {
        appId: row.app_id,
        appName: row.app_name,
        platforms: [row.app_os_platform],
        released: row.released,
        lastUpdated: row.last_updated,
        shutdown: row.shutdown,
      });
      continue;
    }
    if (!existing.platforms.includes(row.app_os_platform)) {
      existing.platforms.push(row.app_os_platform);
    }
    if (row.last_updated && (!existing.lastUpdated || row.last_updated > existing.lastUpdated)) {
      existing.lastUpdated = row.last_updated;
    }
    if (row.shutdown && !existing.shutdown) {
      existing.shutdown = row.shutdown;
    }
  }

  return [...byId.values()];
}

export async function fetchGovAppsCsv(fetchImpl = fetch) {
  const res = await fetchImpl(CSV_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch government apps CSV: HTTP ${res.status}`);
  }
  return res.text();
}
