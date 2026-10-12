/**
 * Cloudflare Worker — GitHub Actions CI proxy for the static Pages showcase.
 * Secrets (Worker env): GITHUB_TOKEN, optional GITHUB_OWNER / GITHUB_REPO / WORKFLOW_FILE / ALLOWED_ORIGINS
 */

const DEFAULT_OWNER = 'JuanCarlosGP';
const DEFAULT_REPO = 'playwright-ecommerce-demo';
const DEFAULT_WORKFLOW_FILE = 'playwright.yml';
const DEFAULT_ALLOWED = 'https://juancarlosgp.github.io';

function parseAllowedOrigins(env) {
  const raw = env.ALLOWED_ORIGINS || DEFAULT_ALLOWED;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function corsHeaders(env, requestOrigin) {
  const allowed = parseAllowedOrigins(env);
  const origin =
    requestOrigin && allowed.includes(requestOrigin) ? requestOrigin : allowed[0];
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'pages-ci-proxy-worker',
  };
}

async function githubRequest(token, path, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: { ...githubHeaders(token), ...(options.headers || {}) },
  });
  if (res.status === 204) return null;
  const body = await res.text();
  let parsed;
  try {
    parsed = body ? JSON.parse(body) : null;
  } catch {
    parsed = body;
  }
  if (!res.ok) {
    const message =
      parsed && typeof parsed === 'object' && parsed.message
        ? parsed.message
        : `GitHub API ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = parsed;
    throw err;
  }
  return parsed;
}

function repoConfig(env) {
  return {
    owner: env.GITHUB_OWNER || DEFAULT_OWNER,
    repo: env.GITHUB_REPO || DEFAULT_REPO,
    workflowFile: env.WORKFLOW_FILE || DEFAULT_WORKFLOW_FILE,
    ref: env.DEFAULT_REF || 'main',
  };
}

async function dispatchWorkflow(env, refOverride) {
  const token = env.GITHUB_TOKEN;
  if (!token) {
    const err = new Error('GITHUB_TOKEN is not configured on the worker');
    err.status = 500;
    throw err;
  }
  const { owner, repo, workflowFile, ref } = repoConfig(env);
  const targetRef = refOverride || ref;
  const dispatchedAt = Date.now();

  await githubRequest(
    token,
    `/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: targetRef }),
    },
  );

  for (let attempt = 0; attempt < 15; attempt += 1) {
    await sleep(2000);
    const data = await githubRequest(
      token,
      `/repos/${owner}/${repo}/actions/workflows/${workflowFile}/runs?event=workflow_dispatch&per_page=10`,
    );
    const runs = data?.workflow_runs || [];
    const match = runs.find((run) => {
      const created = new Date(run.created_at).getTime();
      return created >= dispatchedAt - 5000;
    });
    if (match) {
      return {
        runId: match.id,
        htmlUrl: match.html_url,
        status: match.status,
        conclusion: match.conclusion,
      };
    }
  }

  const err = new Error('Workflow dispatched but run id not found yet; poll /runs/:id later');
  err.status = 202;
  throw err;
}

async function fetchJobLogs(token, owner, repo, jobId) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,
    {
      headers: githubHeaders(token),
      redirect: 'follow',
    },
  );
  if (res.status === 404 || res.status === 403) return '';
  if (!res.ok) return '';
  return await res.text();
}

async function buildRunPayload(env, runId) {
  const token = env.GITHUB_TOKEN;
  const { owner, repo } = repoConfig(env);

  const run = await githubRequest(token, `/repos/${owner}/${repo}/actions/runs/${runId}`);
  const jobsData = await githubRequest(
    token,
    `/repos/${owner}/${repo}/actions/runs/${runId}/jobs?per_page=20`,
  );
  const jobs = jobsData?.jobs || [];
  const logParts = [];

  for (const job of jobs) {
    if (job.status === 'queued') continue;
    const header = `\n## Job: ${job.name} (${job.status}${job.conclusion ? ` / ${job.conclusion}` : ''})\n`;
    logParts.push(header);
    if (job.steps?.length) {
      for (const step of job.steps) {
        logParts.push(
          `[step ${step.number}] ${step.name} — ${step.status}${step.conclusion ? ` (${step.conclusion})` : ''}`,
        );
      }
    }
    const jobLog = await fetchJobLogs(token, owner, repo, job.id);
    if (jobLog) logParts.push(jobLog);
  }

  return {
    runId: run.id,
    status: run.status,
    conclusion: run.conclusion,
    htmlUrl: run.html_url,
    logText: logParts.join('\n'),
    updatedAt: new Date().toISOString(),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env, request.headers.get('Origin'));
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (path === '/health' && request.method === 'GET') {
        return json({ ok: true }, 200, cors);
      }

      if (path === '/start' && request.method === 'POST') {
        let body = {};
        try {
          body = await request.json();
        } catch {
          body = {};
        }
        const result = await dispatchWorkflow(env, body.ref);
        return json(result, 200, cors);
      }

      const runMatch = path.match(/^\/runs\/(\d+)$/);
      if (runMatch && request.method === 'GET') {
        const runId = runMatch[1];
        const payload = await buildRunPayload(env, runId);
        return json(payload, 200, cors);
      }

      return json({ error: 'Not found' }, 404, cors);
    } catch (err) {
      const status = err.status || 500;
      return json(
        {
          error: err.message || 'Internal error',
          details: err.body || undefined,
        },
        status,
        cors,
      );
    }
  },
};
