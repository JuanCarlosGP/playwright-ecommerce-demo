# Playwright Ecommerce E2E Demo

[![Playwright E2E](https://github.com/JuanCarlosGP/playwright-ecommerce-demo/actions/workflows/playwright.yml/badge.svg)](https://github.com/JuanCarlosGP/playwright-ecommerce-demo/actions/workflows/playwright.yml)
[![GitHub Pages](https://github.com/JuanCarlosGP/playwright-ecommerce-demo/actions/workflows/pages.yml/badge.svg)](https://github.com/JuanCarlosGP/playwright-ecommerce-demo/actions/workflows/pages.yml)

Portfolio-quality end-to-end test automation for a public ecommerce demo. Built with **Playwright** and **TypeScript**, using the **Page Object Model (POM)**, tagged **smoke** vs **regression** suites, and **GitHub Actions** CI.

## Live demo

**Showcase site (GitHub Pages):** [https://juancarlosgp.github.io/playwright-ecommerce-demo/](https://juancarlosgp.github.io/playwright-ecommerce-demo/)

The static site lives in `site/` (not `pages/`, which holds the Page Object Model). It includes:

- **Shop demo** — self-contained Swag Labs–style UI: login, products, cart, and checkout success (no iframe to saucedemo.com).
- **Terminal simulator** — portfolio animation of `npm run test:smoke` and `npm run test:regression` with real spec paths from this repo. Use **Start** / **Replay**; output is simulated, not a live Playwright run.

### Enabling GitHub Pages

After this workflow is on `main`:

1. In the repo **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions** (not “Deploy from a branch”).
2. Merges to `main` run [.github/workflows/pages.yml](.github/workflows/pages.yml), which publishes the `site/` folder via `actions/deploy-pages`.
3. Pull requests run a lightweight **validate** job only; the public URL updates after deploy on `main`.

**System under test (automated tests):** [Sauce Demo](https://www.saucedemo.com) — a Swag Labs storefront used for training and demos. Credentials are public (`standard_user` / `secret_sauce`); see `config/env.ts` or environment variables.

## Quick start

```bash
npm ci
npx playwright install chromium
npm run test:smoke
```

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests |
| `npm run test:smoke` | Tests tagged `@smoke` — critical happy path |
| `npm run test:regression` | Tests tagged `@regression` — broader flows |
| `npm run test:ui` | Playwright UI mode |
| `npm run report` | Open the last HTML report |

## Tag strategy

- **`@smoke`** — Fast checks that the app is usable: login and product inventory visible.
- **`@regression`** — Checkout, cart, logout, locked user, inventory sort, and related flows.

Tags are applied per test in code, for example:

```ts
test('standard user can log in', { tag: '@smoke' }, async ({ ... }) => { ... });
```

## Page Object Model

Tests depend on page objects and fixtures, not scattered selectors.

| Page class | Responsibility |
|------------|----------------|
| `LoginPage` | Sign in, error messages |
| `InventoryPage` | Products, add to cart, sort, logout |
| `CartPage` | Cart contents, checkout entry |
| `CheckoutStepOnePage` | Customer information |
| `CheckoutStepTwoPage` | Order summary, finish |
| `CheckoutCompletePage` | Order confirmation |

Shared fixture (`fixtures/test-fixture.ts`) wires page objects into each test and exposes `loginAsStandardUser()` for authenticated flows.

## Project layout

```
config/           # Base URL and demo credentials
fixtures/         # Playwright test fixture + helpers
pages/            # Page Object Model classes (not the GitHub Pages site)
site/             # Static showcase for GitHub Pages (shop + terminal simulator)
tests/
  smoke/          # @smoke specs
  regression/     # @regression specs
playwright.config.ts
```

## Configuration

| Variable | Default |
|----------|---------|
| `BASE_URL` | `https://www.saucedemo.com` |
| `SAUCE_USER` | `standard_user` |
| `SAUCE_PASSWORD` | `secret_sauce` |

## CI

On every push to `main` and on pull requests, GitHub Actions installs dependencies and Chromium, runs smoke then regression tests, and uploads the HTML report and traces on failure.

## License

MIT
