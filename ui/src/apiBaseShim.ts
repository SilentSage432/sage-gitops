// SAGE API base shim
// Ensures window.SAGE_API_BASE and global getApiBase() exist
// before any other modules use them.

(function () {
  try {
    const w = window as any;

    const viteEnv =
      typeof import.meta !== 'undefined' &&
      (import.meta as any).env &&
      (import.meta as any).env.VITE_API_BASE;

    let rawBase = (w.SAGE_API_BASE || viteEnv || '/api').toString();

    // normalize: remove trailing slashes
    rawBase = rawBase.replace(/\/+$/, '');

    // If it's an absolute URL (starts with http), keep it as-is
    // If it's relative, treat it as path (e.g. "/api")
    // Store the normalized base (no trailing slash)
    w.SAGE_API_BASE = rawBase;

    const fn = function getApiBase(): string {
      return rawBase;
    };

    w.getApiBase = fn;
    (globalThis as any).getApiBase = fn;
  } catch (e) {
    console.error('SAGE apiBaseShim failed', e);
  }
})();
