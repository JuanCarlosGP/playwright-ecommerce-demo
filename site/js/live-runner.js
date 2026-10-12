/**
 * Polls the CI proxy for real GitHub Actions logs and drives shop milestones.
 * Playwright runs on GitHub runners — not in the browser.
 */
(function () {
  function getConfig() {
    return window.LiveConfig || {};
  }

  function isEnabled() {
    const base = (getConfig().proxyBaseUrl || '').trim();
    return base.length > 0;
  }

  function proxyUrl(path) {
    const base = (getConfig().proxyBaseUrl || '').trim().replace(/\/+$/, '');
    return `${base}${path}`;
  }

  function classifyLine(text) {
    if (!text) return 'dim';
    if (text.startsWith('$')) return 'cmd';
    if (/^\s*✓/.test(text) || /\bpassed\b/i.test(text)) return 'pass';
    if (/\bfailed\b/i.test(text) || /✘|×/.test(text)) return 'fail';
    if (/^## Job:/.test(text) || /^\[step /.test(text)) return 'suite';
    return 'dim';
  }

  async function startRun() {
    const res = await fetch(proxyUrl('/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Proxy start failed (${res.status})`);
      err.status = res.status;
      err.details = data;
      throw err;
    }
    return data;
  }

  async function fetchRun(runId) {
    const res = await fetch(proxyUrl(`/runs/${runId}`));
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || `Proxy poll failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function run(options = {}) {
    const {
      appendLogLines,
      onComplete,
      onError,
      shouldAbort,
    } = options;

    const cfg = getConfig();
    const pollMs = cfg.pollIntervalMs || 2000;
    const timeoutMs = cfg.pollTimeoutMs || 20 * 60 * 1000;
    const firedKeys = new Set();
    let seenLog = '';
    const startedAt = Date.now();

    const startPayload = await startRun();
    const runId = startPayload.runId;
    if (!runId) {
      throw new Error('Proxy did not return a run id');
    }

    appendLogLines(
      [
        `# LIVE (CI) — workflow run ${runId}`,
        startPayload.htmlUrl ? `# ${startPayload.htmlUrl}` : '# Polling GitHub Actions logs via proxy…',
        '',
      ],
      false,
    );

    let lastStatus = startPayload.status || 'queued';

    while (!shouldAbort()) {
      if (Date.now() - startedAt > timeoutMs) {
        throw new Error('Timed out waiting for CI run to finish');
      }

      await sleep(pollMs);
      const payload = await fetchRun(runId);
      lastStatus = payload.status;

      if (payload.logText && payload.logText !== seenLog) {
        const newChunk = payload.logText.slice(seenLog.length);
        seenLog = payload.logText;
        const lines = newChunk.split(/\r?\n/);
        appendLogLines(lines, true);

        for (const line of lines) {
          const shops = window.DemoOrchestrator?.matchLogMilestones?.(line, firedKeys) || [];
          for (const shop of shops) {
            void window.DemoOrchestrator.runShopAction(shop);
          }
        }
      }

      if (payload.status === 'completed') {
        if (payload.conclusion === 'success') {
          appendLogLines(['', `CI finished: ${payload.conclusion}`, ''], false);
        } else {
          appendLogLines(
            [
              '',
              `CI finished: ${payload.conclusion || 'unknown'}`,
              payload.htmlUrl ? `See: ${payload.htmlUrl}` : '',
              '',
            ],
            false,
          );
        }
        onComplete?.({ runId, conclusion: payload.conclusion, htmlUrl: payload.htmlUrl });
        return { runId, conclusion: payload.conclusion, status: payload.status };
      }
    }

    return { runId, status: lastStatus, aborted: true };
  }

  window.LiveRunner = {
    isEnabled,
    classifyLine,
    run,
  };
})();
