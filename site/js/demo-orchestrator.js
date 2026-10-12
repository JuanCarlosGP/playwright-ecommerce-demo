/**
 * Syncs simulated terminal output with ShopDemo UI actions.
 */
(function () {
  const SMOKE_SCRIPT = [
    { text: '$ npm run test:smoke', className: 'cmd', delay: 40 },
    { text: '', className: 'dim', delay: 200 },
    { text: '> playwright-ecommerce-demo@1.0.0 test:smoke', className: 'dim', delay: 25 },
    { text: '> playwright test --grep @smoke', className: 'dim', delay: 25 },
    { text: '', className: 'dim', delay: 350 },
    { text: 'Running 1 test using 1 worker', className: 'dim', delay: 30, shop: 'smokeLogin' },
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
    { text: '$ npm run test:regression', className: 'cmd', delay: 40, shop: 'focusShop' },
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
      shop: 'regressionCheckout',
    },
    { text: '', className: 'dim', delay: 180 },
    {
      text: '  ✓  2 [chromium] › tests/regression/shopping.spec.ts:34:3 › Regression: Shopping flow › user can log out and return to login (1.2s)',
      className: 'pass',
      delay: 30,
      shop: 'regressionLogout',
    },
    { text: '', className: 'dim', delay: 220 },
    {
      text: '  ✓  3 [chromium] › tests/regression/login-locked.spec.ts:5:3 › Regression: Locked user › locked out user sees error message (0.9s)',
      className: 'pass',
      delay: 30,
      shop: 'lockedUser',
    },
    { text: '', className: 'dim', delay: 200 },
    {
      text: '  ✓  4 [chromium] › tests/regression/inventory-sort.spec.ts:8:3 › Regression: Inventory sorting › sort products name Z to A (1.4s)',
      className: 'pass',
      delay: 30,
      shop: 'sortZa',
    },
    { text: '', className: 'dim', delay: 280 },
    { text: '  4 passed (8.7s)', className: 'pass', delay: 30 },
    { text: '', className: 'dim', delay: 400 },
    { text: 'To open last HTML report run:', className: 'dim', delay: 20 },
    { text: '  npx playwright show-report', className: 'suite', delay: 25 },
  ];

  const FULL_SCRIPT = [...SMOKE_SCRIPT, ...REGRESSION_SCRIPT];

  const shopActions = {
    async focusShop() {
      window.ShowcaseLayout?.focusPanel?.('shop');
    },
    async smokeLogin() {
      window.ShowcaseLayout?.focusPanel?.('shop');
      await window.ShopDemo.loginAnimated({ highlightInventory: true });
    },
    async regressionCheckout() {
      window.ShowcaseLayout?.focusPanel?.('shop');
      await window.ShopDemo.addToCartAnimated('backpack');
      await window.ShopDemo.navigateAnimated('cart');
      await window.ShopDemo.fillCheckoutAnimated({
        firstName: 'Ada',
        lastName: 'Lovelace',
        postalCode: '94016',
      });
      await window.ShopDemo.completeCheckoutAnimated();
    },
    async regressionLogout() {
      await window.ShopDemo.logoutAnimated();
    },
    async lockedUser() {
      window.ShowcaseLayout?.focusPanel?.('shop');
      await window.ShopDemo.loginAnimated({
        username: 'locked_out_user',
        password: 'secret_sauce',
        expectError: true,
      });
      await window.ShopDemo.sleep(900);
      await window.ShopDemo.clearLoginError();
    },
    async sortZa() {
      window.ShowcaseLayout?.focusPanel?.('shop');
      if (window.ShopDemo.state.view === 'login') {
        await window.ShopDemo.loginAnimated({ highlightInventory: false });
      }
      await window.ShopDemo.setSortAnimated('za');
      await window.ShopDemo.highlight('[data-demo="product-grid"]');
    },
  };

  async function runShopAction(name) {
    if (!name || !shopActions[name]) return;
    try {
      await shopActions[name]();
    } catch (err) {
      console.warn('Shop demo action failed:', name, err);
    }
  }

  async function onRunStart() {
    document.body.classList.add('demo-running');
    window.ShopDemo.reset();
    window.ShopDemo.setInteractionLocked(true);
    await window.ShopDemo.sleep(120);
  }

  async function onRunEnd() {
    window.ShopDemo.setInteractionLocked(false);
    document.body.classList.remove('demo-running');
  }

  window.DemoOrchestrator = {
    FULL_SCRIPT,
    runShopAction,
    onRunStart,
    onRunEnd,
  };
})();
