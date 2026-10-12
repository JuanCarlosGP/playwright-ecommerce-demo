/**
 * Self-contained mini ecommerce demo (Sauce Demo–inspired, no external iframe).
 */
(function () {
  const PRODUCTS = [
    { id: 'backpack', name: 'Sauce Labs Backpack', price: 29.99, emoji: '🎒' },
    { id: 'bike-light', name: 'Sauce Labs Bike Light', price: 9.99, emoji: '💡' },
    { id: 'bolt-tshirt', name: 'Sauce Labs Bolt T-Shirt', price: 15.99, emoji: '👕' },
    { id: 'fleece-jacket', name: 'Sauce Labs Fleece Jacket', price: 49.99, emoji: '🧥' },
    { id: 'onesie', name: 'Sauce Labs Onesie', price: 7.99, emoji: '👶' },
    { id: 'red-tshirt', name: 'Test.allTheThings() T-Shirt', price: 15.99, emoji: '👔' },
  ];

  const DEMO_USER = { username: 'standard_user', password: 'secret_sauce' };

  const state = {
    view: 'login',
    cart: [],
    sort: 'az',
    checkout: { firstName: '', lastName: '', postalCode: '' },
  };

  let interactionLocked = false;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function formatPrice(n) {
    return `$${n.toFixed(2)}`;
  }

  function cartCount() {
    return state.cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function cartTotal() {
    return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function sortedProducts() {
    const list = [...PRODUCTS];
    if (state.sort === 'za') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (state.sort === 'lohi') {
      list.sort((a, b) => a.price - b.price);
    } else if (state.sort === 'hilo') {
      list.sort((a, b) => b.price - a.price);
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }

  function setInteractionLocked(locked) {
    interactionLocked = locked;
    const root = document.getElementById('shop-app');
    if (root) root.classList.toggle('shop-locked', locked);
  }

  function guardManual() {
    return interactionLocked;
  }

  function reset() {
    state.view = 'login';
    state.cart = [];
    state.sort = 'az';
    state.checkout = { firstName: '', lastName: '', postalCode: '' };
    clearHighlights();
    render();
  }

  function addToCart(productId, skipRender) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    const existing = state.cart.find((c) => c.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({ ...product, qty: 1 });
    }
    if (!skipRender) render();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter((c) => c.id !== productId);
    render();
  }

  async function typeIntoInput(input, value, charDelay = 28) {
    if (!input) return;
    input.value = '';
    input.classList.add('demo-typing');
    for (const ch of value) {
      input.value += ch;
      await sleep(charDelay);
    }
    input.classList.remove('demo-typing');
  }

  async function highlight(selector, duration = 1400) {
    clearHighlights();
    const root = document.getElementById('shop-app');
    if (!root) return;
    const el = root.querySelector(selector);
    if (!el) return;
    el.classList.add('demo-highlight');
    await sleep(duration);
    el.classList.remove('demo-highlight');
  }

  function clearHighlights() {
    document.querySelectorAll('.demo-highlight').forEach((el) => el.classList.remove('demo-highlight'));
  }

  async function pulseClick(el) {
    if (!el) return;
    el.classList.add('demo-pulse');
    await sleep(180);
    el.click();
    await sleep(220);
    el.classList.remove('demo-pulse');
  }

  function attemptLogin(username, password) {
    const errEl = document.getElementById('login-error');
    if (username === 'locked_out_user') {
      if (errEl) {
        errEl.textContent = 'Sorry, this user has been locked out.';
        errEl.hidden = false;
      }
      return false;
    }
    if (username === DEMO_USER.username && password === DEMO_USER.password) {
      state.view = 'inventory';
      if (errEl) errEl.hidden = true;
      render();
      return true;
    }
    if (errEl) {
      errEl.textContent = 'Username and password do not match any user in this service.';
      errEl.hidden = false;
    }
    return false;
  }

  async function loginAnimated(options = {}) {
    const username = options.username ?? DEMO_USER.username;
    const password = options.password ?? DEMO_USER.password;
    const expectError = options.expectError ?? false;
    const highlightInventory = options.highlightInventory ?? true;

    state.view = 'login';
    render();
    await sleep(200);

    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    const submit = document.querySelector('#login-form button[type="submit"]');

    await highlight('#username', 500);
    await typeIntoInput(userInput, username);
    await sleep(120);
    await highlight('#password', 500);
    await typeIntoInput(passInput, password);
    await sleep(150);
    if (submit) submit.classList.add('demo-pulse');
    attemptLogin(username, password);
    await sleep(220);
    if (submit) submit.classList.remove('demo-pulse');

    if (expectError) {
      await highlight('#login-error', 1200);
      return false;
    }

    if (state.view === 'inventory' && highlightInventory) {
      await sleep(280);
      await highlight('[data-demo="product-grid"]', 1600);
    }
    return state.view === 'inventory';
  }

  function clearLoginError() {
    const errEl = document.getElementById('login-error');
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = '';
    }
    const userInput = document.getElementById('username');
    const passInput = document.getElementById('password');
    if (userInput) userInput.value = DEMO_USER.username;
    if (passInput) passInput.value = DEMO_USER.password;
  }

  async function navigateAnimated(view) {
    state.view = view;
    render();
    await sleep(350);
  }

  async function addToCartAnimated(productId) {
    if (state.view !== 'inventory') {
      state.view = 'inventory';
      render();
      await sleep(300);
    }
    const btn = document.querySelector(`[data-add="${productId}"]`);
    await highlight(`[data-add="${productId}"]`, 600);
    if (btn) btn.classList.add('demo-pulse');
    addToCart(productId);
    await sleep(280);
    if (btn) btn.classList.remove('demo-pulse');
    await highlight('.cart-badge', 800);
  }

  async function fillCheckoutAnimated(data) {
    state.checkout = { ...state.checkout, ...data };
    if (state.view !== 'checkout') {
      state.view = 'checkout';
      render();
      await sleep(350);
    }
    const fields = [
      ['#firstName', data.firstName],
      ['#lastName', data.lastName],
      ['#postalCode', data.postalCode],
    ];
    for (const [sel, val] of fields) {
      const input = document.querySelector(sel);
      await highlight(sel, 450);
      await typeIntoInput(input, val || '');
      await sleep(100);
    }
  }

  async function completeCheckoutAnimated() {
    const form = document.getElementById('checkout-form');
    const submit = form?.querySelector('button[type="submit"]');
    if (submit) submit.classList.add('demo-pulse');
    state.checkout = {
      firstName: document.querySelector('#firstName')?.value.trim() || state.checkout.firstName,
      lastName: document.querySelector('#lastName')?.value.trim() || state.checkout.lastName,
      postalCode: document.querySelector('#postalCode')?.value.trim() || state.checkout.postalCode,
    };
    state.view = 'success';
    state.cart = [];
    render();
    await sleep(280);
    if (submit) submit.classList.remove('demo-pulse');
    await highlight('.success-panel', 1500);
  }

  async function logoutAnimated() {
    const logoutBtn = document.querySelector('[data-action="logout"]');
    if (!logoutBtn) {
      state.view = 'login';
      state.cart = [];
      render();
      return;
    }
    await highlight('[data-action="logout"]', 500);
    if (logoutBtn) logoutBtn.classList.add('demo-pulse');
    state.view = 'login';
    state.cart = [];
    render();
    await sleep(320);
    if (logoutBtn) logoutBtn.classList.remove('demo-pulse');
    await sleep(80);
    await highlight('.shop-login', 1000);
  }

  async function setSortAnimated(value) {
    if (state.view !== 'inventory') {
      state.view = 'inventory';
      render();
      await sleep(300);
    }
    const select = document.getElementById('sort');
    if (!select) return;
    await highlight('#sort', 600);
    select.classList.add('demo-pulse');
    state.sort = value;
    select.value = value;
    render();
    await sleep(400);
    select?.classList.remove('demo-pulse');
  }

  function renderLogin(root) {
    root.innerHTML = `
      <div class="shop-screen shop-login" data-demo="login">
        <p class="shop-eyebrow">Instrumented UI</p>
        <h2>Swag Labs</h2>
        <p class="hint">Demo credentials: <code>${DEMO_USER.username}</code> / <code>${DEMO_USER.password}</code></p>
        <form id="login-form">
          <div class="field">
            <label for="username">Username</label>
            <input id="username" name="username" autocomplete="username" value="${DEMO_USER.username}" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input id="password" name="password" type="password" autocomplete="current-password" value="${DEMO_USER.password}" />
          </div>
          <button type="submit" class="btn btn-primary btn-block">Login</button>
          <p class="shop-error" id="login-error" role="alert" hidden></p>
        </form>
      </div>
    `;
    root.querySelector('#login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (guardManual()) return;
      const username = root.querySelector('#username').value.trim();
      const password = root.querySelector('#password').value;
      attemptLogin(username, password);
      if (state.view === 'inventory') render();
    });
  }

  function headerBar() {
    const count = cartCount();
    return `
      <div class="shop-header-bar">
        <span class="logo">Swag Labs</span>
        <span class="user-meta">Hi, ${DEMO_USER.username}</span>
        <div class="shop-header-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-nav="inventory">Products</button>
          <button type="button" class="btn btn-secondary btn-sm" data-nav="cart" aria-label="Cart">
            Cart<span class="cart-badge" ${count ? '' : 'hidden'}">${count}</span>
          </button>
          <button type="button" class="btn btn-danger btn-sm" data-action="logout">Logout</button>
        </div>
      </div>
    `;
  }

  function renderInventory(root) {
    const products = sortedProducts();
    root.innerHTML = `
      ${headerBar()}
      <div class="shop-screen shop-inventory">
        <div class="inventory-toolbar">
          <label for="sort">Sort</label>
          <select id="sort" class="sort-select" aria-label="Sort products">
            <option value="az" ${state.sort === 'az' ? 'selected' : ''}>Name (A to Z)</option>
            <option value="za" ${state.sort === 'za' ? 'selected' : ''}>Name (Z to A)</option>
            <option value="lohi" ${state.sort === 'lohi' ? 'selected' : ''}>Price (low to high)</option>
            <option value="hilo" ${state.sort === 'hilo' ? 'selected' : ''}>Price (high to low)</option>
          </select>
        </div>
        <div class="product-grid" data-demo="product-grid">
          ${products
            .map(
              (p) => `
            <article class="product-card" data-product="${p.id}">
              <div class="product-img" aria-hidden="true">${p.emoji}</div>
              <div class="product-body">
                <h3>${p.name}</h3>
                <span class="product-price">${formatPrice(p.price)}</span>
                <button type="button" class="btn btn-primary" data-add="${p.id}">Add to cart</button>
              </div>
            </article>
          `,
            )
            .join('')}
        </div>
      </div>
    `;
    bindNav(root);
    root.querySelector('#sort').addEventListener('change', (e) => {
      if (guardManual()) {
        e.target.value = state.sort;
        return;
      }
      state.sort = e.target.value;
      render();
    });
    root.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (guardManual()) return;
        addToCart(btn.getAttribute('data-add'));
      });
    });
  }

  function renderCart(root) {
    if (state.cart.length === 0) {
      root.innerHTML = `
        ${headerBar()}
        <div class="shop-screen cart-empty">
          <p>Your cart is empty.</p>
          <button type="button" class="btn btn-primary" data-nav="inventory">Continue shopping</button>
        </div>
      `;
      bindNav(root);
      return;
    }

    root.innerHTML = `
      ${headerBar()}
      <div class="shop-screen shop-cart" data-demo="cart">
        <h2 class="screen-title">Your Cart</h2>
        <table class="cart-table">
          <thead>
            <tr><th scope="col">Item</th><th scope="col">Price</th><th scope="col">Qty</th><th scope="col"><span class="sr-only">Actions</span></th></tr>
          </thead>
          <tbody>
            ${state.cart
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td>${formatPrice(item.price)}</td>
                <td>${item.qty}</td>
                <td><button type="button" class="btn btn-secondary btn-sm" data-remove="${item.id}">Remove</button></td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        <p class="cart-total">Total: ${formatPrice(cartTotal())}</p>
        <button type="button" class="btn btn-primary" data-nav="checkout">Checkout</button>
      </div>
    `;
    bindNav(root);
    root.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (guardManual()) return;
        removeFromCart(btn.getAttribute('data-remove'));
      });
    });
  }

  function renderCheckout(root) {
    root.innerHTML = `
      ${headerBar()}
      <div class="shop-screen checkout-form" data-demo="checkout">
        <h2 class="screen-title">Checkout: Your Information</h2>
        <form id="checkout-form">
          <div class="field">
            <label for="firstName">First Name</label>
            <input id="firstName" required value="${state.checkout.firstName}" />
          </div>
          <div class="field">
            <label for="lastName">Last Name</label>
            <input id="lastName" required value="${state.checkout.lastName}" />
          </div>
          <div class="field">
            <label for="postalCode">Postal Code</label>
            <input id="postalCode" required value="${state.checkout.postalCode}" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Continue</button>
            <button type="button" class="btn btn-secondary" data-nav="cart">Cancel</button>
          </div>
        </form>
      </div>
    `;
    bindNav(root);
    root.querySelector('#checkout-form').addEventListener('submit', (e) => {
      e.preventDefault();
      if (guardManual()) return;
      state.checkout = {
        firstName: root.querySelector('#firstName').value.trim(),
        lastName: root.querySelector('#lastName').value.trim(),
        postalCode: root.querySelector('#postalCode').value.trim(),
      };
      state.view = 'success';
      state.cart = [];
      render();
    });
  }

  function renderSuccess(root) {
    root.innerHTML = `
      ${headerBar()}
      <div class="shop-screen success-panel">
        <h2>Thank you for your order!</h2>
        <p>Your order has been placed. This is a demo checkout — no payment was processed.</p>
        <button type="button" class="btn btn-primary" data-nav="inventory">Back to products</button>
      </div>
    `;
    bindNav(root);
  }

  function bindNav(root) {
    root.querySelectorAll('[data-nav]').forEach((el) => {
      el.addEventListener('click', () => {
        if (guardManual()) return;
        state.view = el.getAttribute('data-nav');
        render();
      });
    });
    const logout = root.querySelector('[data-action="logout"]');
    if (logout) {
      logout.addEventListener('click', () => {
        if (guardManual()) return;
        state.view = 'login';
        state.cart = [];
        render();
      });
    }
  }

  function render() {
    const root = document.getElementById('shop-app');
    if (!root) return;
    switch (state.view) {
      case 'login':
        renderLogin(root);
        break;
      case 'inventory':
        renderInventory(root);
        break;
      case 'cart':
        renderCart(root);
        break;
      case 'checkout':
        renderCheckout(root);
        break;
      case 'success':
        renderSuccess(root);
        break;
      default:
        state.view = 'login';
        renderLogin(root);
    }
  }

  window.ShopDemo = {
    render,
    addToCart,
    state,
    reset,
    sleep,
    highlight,
    loginAnimated,
    clearLoginError,
    navigateAnimated,
    addToCartAnimated,
    fillCheckoutAnimated,
    completeCheckoutAnimated,
    logoutAnimated,
    setSortAnimated,
    setInteractionLocked,
  };
  document.addEventListener('DOMContentLoaded', render);
})();
