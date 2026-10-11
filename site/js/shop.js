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

  function addToCart(productId) {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product) return;
    const existing = state.cart.find((c) => c.id === productId);
    if (existing) {
      existing.qty += 1;
    } else {
      state.cart.push({ ...product, qty: 1 });
    }
    render();
  }

  function removeFromCart(productId) {
    state.cart = state.cart.filter((c) => c.id !== productId);
    render();
  }

  function renderLogin(root) {
    root.innerHTML = `
      <div class="shop-screen shop-login">
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
          <button type="submit" class="btn btn-primary" style="width:100%">Login</button>
          <p class="shop-error" id="login-error" hidden></p>
        </form>
      </div>
    `;
    root.querySelector('#login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = root.querySelector('#username').value.trim();
      const password = root.querySelector('#password').value;
      const err = root.querySelector('#login-error');
      if (username === DEMO_USER.username && password === DEMO_USER.password) {
        state.view = 'inventory';
        err.hidden = true;
        render();
      } else {
        err.textContent = 'Username and password do not match any user in this service.';
        err.hidden = false;
      }
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
          <button type="button" class="btn btn-secondary btn-sm" data-nav="cart">
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
      <div class="shop-screen">
        <div style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:center;margin-bottom:0.5rem;padding:0 0.25rem">
          <label for="sort" style="font-size:0.85rem;font-weight:600">Sort:</label>
          <select id="sort" class="field" style="width:auto;margin:0">
            <option value="az" ${state.sort === 'az' ? 'selected' : ''}>Name (A to Z)</option>
            <option value="za" ${state.sort === 'za' ? 'selected' : ''}>Name (Z to A)</option>
            <option value="lohi" ${state.sort === 'lohi' ? 'selected' : ''}>Price (low to high)</option>
            <option value="hilo" ${state.sort === 'hilo' ? 'selected' : ''}>Price (high to low)</option>
          </select>
        </div>
        <div class="product-grid">
          ${products
            .map(
              (p) => `
            <article class="product-card">
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
      state.sort = e.target.value;
      render();
    });
    root.querySelectorAll('[data-add]').forEach((btn) => {
      btn.addEventListener('click', () => addToCart(btn.getAttribute('data-add')));
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
      <div class="shop-screen">
        <h2 style="margin-top:0">Your Cart</h2>
        <table class="cart-table">
          <thead>
            <tr><th>Item</th><th>Price</th><th>Qty</th><th></th></tr>
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
        <p style="font-weight:700;margin:1rem 0">Total: ${formatPrice(cartTotal())}</p>
        <button type="button" class="btn btn-primary" data-nav="checkout">Checkout</button>
      </div>
    `;
    bindNav(root);
    root.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', () => removeFromCart(btn.getAttribute('data-remove')));
    });
  }

  function renderCheckout(root) {
    root.innerHTML = `
      ${headerBar()}
      <div class="shop-screen checkout-form">
        <h2 style="margin-top:0">Checkout: Your Information</h2>
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
          <button type="submit" class="btn btn-primary">Continue</button>
          <button type="button" class="btn btn-secondary" data-nav="cart" style="margin-left:0.5rem">Cancel</button>
        </form>
      </div>
    `;
    bindNav(root);
    root.querySelector('#checkout-form').addEventListener('submit', (e) => {
      e.preventDefault();
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
        state.view = el.getAttribute('data-nav');
        render();
      });
    });
    const logout = root.querySelector('[data-action="logout"]');
    if (logout) {
      logout.addEventListener('click', () => {
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

  window.ShopDemo = { render, addToCart, state };
  document.addEventListener('DOMContentLoaded', render);
})();
