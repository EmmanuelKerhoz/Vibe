// Runtime version: package.json → vite.config.ts → here (v3.25.9.2)
// Bump package.json and keep this runtime version bridge aligned.
const raw = import.meta.env.VITE_APP_VERSION ?? 'dev';
export const APP_VERSION = `v${raw}`;
export const APP_VERSION_LABEL = `β v${raw}`;
