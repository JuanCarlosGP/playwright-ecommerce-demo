/**
 * Terminal UI — simulated script by default; optional LIVE (CI) via proxy + LiveRunner.
 */
(function () {
  let running = false;
  let abort = false;
  let replayPending = false;
  let lastRunTriggerAt = 0;
  const RUN_CLICK_GUARD_MS = 700;

  function liveModeEnabled() {
    return window.LiveRunner?.isEnabled?.() === true;
  }

  function getScript() {
    return window.DemoOrchestrator?.FULL_SCRIPT || [];
  }

  function getOutputEl() {
    return document.getElementById('terminal-output');
  }

  function scrollToBottom(el) {
    el.scrollTop = el.scrollHeight;
  }

  function appendLine(el, text, className) {
    const line = document.createElement('p');
    line.className = `terminal-line ${className || ''}`.trim();
    line.textContent = text;
    el.appendChild(line);
    scrollToBottom(el);
    return line;
  }

  function appendLogLines(lines, applyMilestonesFromLive) {
    const el = getOutputEl();
    if (!el) return;
    for (const text of lines) {
      const className = applyMilestonesFromLive && window.LiveRunner
        ? window.LiveRunner.classifyLine(text)
        : text.startsWith('#')
          ? 'dim'
          : 'dim';
      appendLine(el, text, className);
    }
  }

  async function typeLine(el, text, className, charDelay) {
    const line = document.createElement('p');
    line.className = `terminal-line ${className || ''}`.trim();
    el.appendChild(line);
    for (let i = 0; i < text.length; i++) {
      if (abort) return;
      line.textContent += text[i];
      scrollToBottom(el);
      await sleep(charDelay);
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function setIdleChip() {
    const chip = document.getElementById('terminal-status-chip');
    if (!chip) return;
    chip.classList.remove('is-live', 'is-running');
    if (liveModeEnabled()) {
      chip.textContent = 'LIVE (CI)';
      chip.classList.add('is-live');
    } else {
      chip.textContent = 'SIMULATED';
    }
  }

  function setRunState(active) {
    const wrap = document.querySelector('.terminal-wrap');
    const chip = document.getElementById('terminal-status-chip');
    if (wrap) wrap.classList.toggle('terminal-running', active);
    if (chip) {
      if (active) {
        chip.textContent = liveModeEnabled() ? 'LIVE (CI)' : 'RUNNING';
        chip.classList.add('is-running');
        if (liveModeEnabled()) chip.classList.add('is-live');
      } else {
        setIdleChip();
      }
    }
  }

  async function runScript(script) {
    const el = getOutputEl();
    if (!el) return;

    for (const step of script) {
      if (abort) break;

      if (step.shop && window.DemoOrchestrator) {
        void window.DemoOrchestrator.runShopAction(step.shop);
      }

      const delay = step.delay ?? 30;
      if (step.className === 'cmd' || step.text.startsWith('  ✓')) {
        await typeLine(el, step.text, step.className, Math.max(8, delay / 20));
      } else if (step.text === '') {
        appendLine(el, '', step.className);
        await sleep(delay);
      } else {
        await typeLine(el, step.text, step.className, Math.max(6, delay / 25));
        await sleep(delay * 0.3);
      }
    }

    if (!abort) {
      const cursor = document.createElement('span');
      cursor.className = 'terminal-cursor';
      cursor.setAttribute('aria-hidden', 'true');
      const last = el.lastElementChild;
      if (last) last.appendChild(cursor);
    }
  }

  async function runSimulated() {
    await runScript(getScript());
  }

  async function runLive() {
    try {
      await window.LiveRunner.run({
        shouldAbort: () => abort,
        appendLogLines: (lines, fromCi) => {
          appendLogLines(lines, fromCi);
        },
        onComplete: () => {},
      });
    } catch (err) {
      const el = getOutputEl();
      const msg = err.message || 'Live CI run failed';
      if (el) {
        appendLine(el, '', 'dim');
        appendLine(el, `✘ ${msg}`, 'fail');
        if (err.status === 401) {
          appendLine(el, '# Proxy rejected the request (check worker GITHUB_TOKEN).', 'dim');
        } else if (err.status === 403) {
          appendLine(el, '# Forbidden — token may lack actions:write on this repo.', 'dim');
        } else if (err.status === 429) {
          appendLine(el, '# GitHub rate limit — try again later or reduce poll frequency.', 'dim');
        }
        appendLine(el, '# Falling back to simulated output…', 'dim');
        appendLine(el, '', 'dim');
      }
      if (!abort) {
        await runSimulated();
      }
    }
  }

  function canTriggerRun() {
    if (running || replayPending) return false;
    const now = Date.now();
    if (now - lastRunTriggerAt < RUN_CLICK_GUARD_MS) return false;
    lastRunTriggerAt = now;
    return true;
  }

  async function startRun() {
    if (running) return;
    running = true;
    abort = false;

    const startBtn = document.getElementById('terminal-start');
    const replayBtn = document.getElementById('terminal-replay');
    if (startBtn) startBtn.disabled = true;
    if (replayBtn) replayBtn.disabled = true;

    const el = getOutputEl();
    if (el) el.innerHTML = '';

    setRunState(true);
    if (window.DemoOrchestrator) {
      await window.DemoOrchestrator.onRunStart();
    }

    if (liveModeEnabled() && !abort) {
      await runLive();
    } else if (!abort) {
      await runSimulated();
    }

    if (window.DemoOrchestrator) {
      await window.DemoOrchestrator.onRunEnd();
    }
    setRunState(false);

    running = false;
    if (startBtn) startBtn.disabled = false;
    if (replayBtn) replayBtn.disabled = false;
  }

  function replay() {
    replayPending = true;
    abort = true;
    running = false;
    setTimeout(() => {
      abort = false;
      replayPending = false;
      startRun();
    }, 80);
  }

  function bindRunButton(btn, handler) {
    if (!btn) return;
    const onActivate = (e) => {
      if (!canTriggerRun()) {
        e.preventDefault();
        return;
      }
      handler();
    };
    btn.addEventListener('click', onActivate);
    btn.addEventListener(
      'touchend',
      (e) => {
        if (!canTriggerRun()) {
          e.preventDefault();
        }
      },
      { passive: false },
    );
  }

  function initPlaceholderLines() {
    const el = getOutputEl();
    if (!el) return;
    if (liveModeEnabled()) {
      appendLine(
        el,
        '# LIVE (CI) — Start dispatches Playwright on GitHub Actions; logs stream via proxy',
        'dim',
      );
      appendLine(
        el,
        '# Shop motion follows parsed log milestones (Playwright does not run in your browser)',
        'dim',
      );
    } else {
      appendLine(el, '# Playwright POM showcase — terminal output is simulated', 'dim');
      appendLine(
        el,
        '# Press Start: shop UI follows the same steps as tests/smoke + tests/regression',
        'dim',
      );
    }
    appendLine(el, '', 'dim');
  }

  function init() {
    setIdleChip();
    const startBtn = document.getElementById('terminal-start');
    const replayBtn = document.getElementById('terminal-replay');
    bindRunButton(startBtn, () => {
      void startRun();
    });
    bindRunButton(replayBtn, replay);
    if (replayBtn) replayBtn.disabled = false;
    initPlaceholderLines();
  }

  window.TerminalSimulator = { startRun, replay, init, appendLogLines, setIdleChip };
  document.addEventListener('DOMContentLoaded', init);
})();
