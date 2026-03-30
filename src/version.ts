// Single source of truth: package.json → vite.config.ts → here (3.26.1)
// Version bumps still flow from package.json into this module via VITE_APP_VERSION.
const raw = import.meta.env.VITE_APP_VERSION ?? 'dev';
export const APP_VERSION = `v${raw}`;
export const APP_VERSION_LABEL = `β v${raw}`;
