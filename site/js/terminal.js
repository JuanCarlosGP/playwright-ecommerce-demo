/**
 * Simulated Playwright test run — file names match this repository.
 */
(function () {
  const SMOKE_SCRIPT = [
    { text: '$ npm run test:smoke', className: 'cmd', delay: 40 },
    { text: '', className: 'dim', delay: 200 },
    { text: '> playwright-ecommerce-demo@1.0.0 test:smoke', className: 'dim', delay: 25 },
    { text: '> playwright test --grep @smoke', className: 'dim', delay: 25 },
    { text: '', className: 'dim', delay: 350 },
    { text: 'Running 1 test using 1 worker', className: 'dim', delay: 30 },
    { text: '', className: 'dim', delay: 400 },
    {
      text: '  ✓  1 [chromium] › tests/smoke/login.spec.ts:4:3 › Smoke: Authentication › standard user can log in and view products (1.8s)',
      className: 'pass',
      delay: 35,
    },
    { text: '', className: 'dim', delay: 250 },
    { text: '  1 passed (3.2s)', className: 'pass', delay: 30 },
  ];

  const REGRESSION_SCRIPT = [
    { text: '', className: 'dim', delay: 500 },
    { text: '$ npm run test:regression', className: 'cmd', delay: 40 },
    { text: '', className: 'dim', delay: 200 },
    { text: '> playwright-ecommerce-demo@1.0.0 test:regression', className: 'dim', delay: 25 },
    { text: '> playwright test --grep @regression', className: 'dim', delay: 25 },
    { text: '', className: 'dim', delay: 350 },
    { text: 'Running 4 tests using 2 workers', className: 'dim', delay: 30 },
    { text: '', className: 'dim', delay: 300 },
    {
      text: '  ✓  1 [chromium] › tests/regression/shopping.spec.ts:8:3 › Regression: Shopping flow › add item to cart and complete checkout (4.1s)',
      className: 'pass',
      delay: 30,
    },
    { text: '', className: 'dim', delay: 180 },
    {
      text: '  ✓  2 [chromium] › tests/regression/shopping.spec.ts:34:3 › Regression: Shopping flow › user can log out and return to login (1.2s)',
      className: 'pass',
      delay: 30,
    },
    { text: '', className: 'dim', delay: 220 },
    {
      text: '  ✓  3 [chromium] › tests/regression/login-locked.spec.ts:5:3 › Regression: Locked user › locked out user sees error message (0.9s)',
      className: 'pass',
      delay: 30,
    },
    { text: '', className: 'dim', delay: 200 },
    {
      text: '  ✓  4 [chromium] › tests/regression/inventory-sort.spec.ts:8:3 › Regression: Inventory sorting › sort products name Z to A (1.4s)',
      className: 'pass',
      delay: 30,
    },
    { text: '', className: 'dim', delay: 280 },
    { text: '  4 passed (8.7s)', className: 'pass', delay: 30 },
    { text: '', className: 'dim', delay: 400 },
    { text: 'To open last HTML report run:', className: 'dim', delay: 20 },
    { text: '  npx playwright show-report', className: 'suite', delay: 25 },
  ];

  const FULL_SCRIPT = [...SMOKE_SCRIPT, ...REGRESSION_SCRIPT];

  let running = false;
  let abort = false;

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

  async function runScript(script) {
    const el = getOutputEl();
    if (!el) return;

    for (const step of script) {
      if (abort) break;
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

    await runScript(FULL_SCRIPT);

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
    if (replayBtn) replayBtn.addEventListener('click', replay);

    const el = getOutputEl();
    if (el) {
      appendLine(el, '# Simulated Playwright run — click Start or switch to this tab on desktop split view', 'dim');
      appendLine(el, '# Matches tests in tests/smoke and tests/regression', 'dim');
      appendLine(el, '', 'dim');
    }
  }

  window.TerminalSimulator = { startRun, replay, init };
  document.addEventListener('DOMContentLoaded', init);
})();
