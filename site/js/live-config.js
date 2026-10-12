/**
 * Live CI mode — leave proxyBaseUrl empty for simulated-only (default on GitHub Pages).
 * Set to your deployed worker URL (no trailing slash) to enable LIVE (CI) on Start.
 */
(function () {
  window.LiveConfig = {
    /** e.g. 'https://playwright-pages-ci-proxy.example.workers.dev' */
    proxyBaseUrl: '',
    pollIntervalMs: 2000,
    pollTimeoutMs: 20 * 60 * 1000,
  };
})();
