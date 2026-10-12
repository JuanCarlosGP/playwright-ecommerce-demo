/**
 * Simulated Playwright test run — synced with ShopDemo via DemoOrchestrator.
 */
(function () {
  let running = false;
  let abort = false;

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

  function setRunState(active) {
    const wrap = document.querySelector('.terminal-wrap');
    const chip = document.getElementById('terminal-status-chip');
    if (wrap) wrap.classList.toggle('terminal-running', active);
    if (chip) {
      chip.textContent = active ? 'RUNNING' : 'SIMULATED';
      chip.classList.toggle('is-live', active);
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

    await runScript(getScript());

    if (window.DemoOrchestrator) {
      await window.DemoOrchestrator.onRunEnd();
    }
    setRunState(false);

    running = false;
    if (startBtn) startBtn.disabled = false;
    if (replayBtn) replayBtn.disabled = false;
  }

  function replay() {
    abort = true;
    running = false;
    setTimeout(() => {
      abort = false;
      startRun();
    }, 80);
  }

  function init() {
    const startBtn = document.getElementById('terminal-start');
    const replayBtn = document.getElementById('terminal-replay');
    if (startBtn) startBtn.addEventListener('click', startRun);
    if (replayBtn) {
      replayBtn.addEventListener('click', replay);
      replayBtn.disabled = false;
    }

    const el = getOutputEl();
    if (el) {
      appendLine(el, '# Playwright POM showcase — terminal output is simulated', 'dim');
      appendLine(el, '# Press Start: shop UI follows the same steps as tests/smoke + tests/regression', 'dim');
      appendLine(el, '', 'dim');
    }
  }

  window.TerminalSimulator = { startRun, replay, init };
  document.addEventListener('DOMContentLoaded', init);
})();
