// Single source of truth: package.json → vite.config.ts → here
// To bump version: edit only package.json
const raw = import.meta.env.VITE_APP_VERSION ?? 'dev';
export const APP_VERSION = `v${raw}`;
export const APP_VERSION_LABEL = `β v${raw}`;
