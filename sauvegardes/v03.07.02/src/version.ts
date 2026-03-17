/**
 * App version — injected at build time from package.json via Vite define.
 * Single source of truth: only package.json needs to be updated.
 */
export const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) ?? '0.0.0';
