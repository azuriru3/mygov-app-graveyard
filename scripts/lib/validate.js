import { STATUS } from './classify.js';

const VALID_STATUSES = new Set(Object.values(STATUS));
const REQUIRED_SUMMARY_FIELDS = ['totalApps', 'shutdownCount', 'freshCount', 'staleCount', 'abandonedCount'];

export function validateDataset(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['dataset must be an object'] };
  }
  if (typeof data.generatedAt !== 'string' || Number.isNaN(Date.parse(data.generatedAt))) {
    errors.push('generatedAt must be a valid ISO date string');
  }
  if (!data.summary || typeof data.summary !== 'object') {
    errors.push('summary must be an object');
  } else {
    for (const field of REQUIRED_SUMMARY_FIELDS) {
      if (typeof data.summary[field] !== 'number') {
        errors.push(`summary.${field} must be a number`);
      }
    }
  }
  if (!Array.isArray(data.apps) || data.apps.length === 0) {
    errors.push('apps must be a non-empty array');
  } else {
    data.apps.forEach((app, i) => {
      if (!app || typeof app !== 'object') {
        errors.push(`apps[${i}] must be an object`);
        return;
      }
      if (!app.appId || !app.appName) {
        errors.push(`apps[${i}] is missing appId or appName`);
      }
      if (!VALID_STATUSES.has(app.status)) {
        errors.push(`apps[${i}] has an invalid status: ${app.status}`);
      }
    });
  }
  if (!Array.isArray(data.hallOfShame)) {
    errors.push('hallOfShame must be an array');
  }

  return { valid: errors.length === 0, errors };
}
