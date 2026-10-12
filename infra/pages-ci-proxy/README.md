# Pages CI proxy (Cloudflare Worker)

Small proxy so the **static** GitHub Pages showcase can trigger and poll a real Playwright workflow **without** putting a GitHub token in `site/` JavaScript.

## Architecture

1. Visitor opens [the showcase](https://juancarlosgp.github.io/playwright-ecommerce-demo/) (static files only).
2. If `site/js/live-config.js` sets `proxyBaseUrl`, **Start** sends `POST {proxy}/start` → this worker calls GitHub `workflow_dispatch` on `.github/workflows/playwright.yml`.
3. The browser polls `GET {proxy}/runs/:id` for run status and log text (job logs from the Actions API).
4. The shop UI still uses **heuristic** milestones parsed from log lines (same as the simulated demo); Playwright runs on GitHub runners, not in the browser.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check |
| `POST` | `/start` | Dispatches the Playwright workflow. Optional JSON body: `{ "ref": "main" }`. Returns `{ runId, htmlUrl, status, conclusion }`. |
| `GET` | `/runs/:id` | Run status + aggregated `logText` from workflow jobs. |

CORS allows origins listed in `ALLOWED_ORIGINS` (default: `https://juancarlosgp.github.io`).

## Required secrets (Worker only — never commit)

| Secret / var | Purpose |
|--------------|---------|
| `GITHUB_TOKEN` | **Required.** PAT or fine-grained token with `actions:read` and `actions:write` on this repo. Stored via `wrangler secret put GITHUB_TOKEN`. |
| `GITHUB_OWNER` | Optional (default `JuanCarlosGP`). |
| `GITHUB_REPO` | Optional (default `playwright-ecommerce-demo`). |
| `WORKFLOW_FILE` | Optional (default `playwright.yml`). |
| `DEFAULT_REF` | Branch/ref for dispatch when the client does not send `ref` (default `main`). |
| `ALLOWED_ORIGINS` | Comma-separated browser origins allowed for CORS. |

Use a token scoped to **this repository only**. Rotate if leaked.

## Deploy (example)

```bash
cd infra/pages-ci-proxy
npm install -g wrangler   # or use npx wrangler
wrangler login
wrangler secret put GITHUB_TOKEN
wrangler deploy
```

Note the deployed URL (e.g. `https://playwright-pages-ci-proxy.<account>.workers.dev`) and set it in `site/js/live-config.js` as `proxyBaseUrl`.

## GitHub workflow

The Playwright workflow must include `workflow_dispatch` (see `.github/workflows/playwright.yml`). Manual runs use the same smoke + regression steps as CI on push/PR.

## Limits

- Log text is aggregated from GitHub job log downloads; very large logs may be truncated by API limits.
- While jobs are **queued**, log bodies may be empty; step names still appear when the jobs API updates.
- GitHub API rate limits apply; the showcase should not poll faster than ~2s.
- The proxy does **not** stream SSE; clients poll `GET /runs/:id`.
