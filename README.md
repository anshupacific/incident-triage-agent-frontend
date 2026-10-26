# Incident triage agents: frontend

React + TypeScript (Vite) UI for the incident triage demo. Visitors pick an invented Azure alert,
watch five Microsoft Foundry agents work through it live (agent calls, tool calls, answers), approve
or reject the drafted Jira ticket, and see the result.

Hosted on Azure Static Web Apps. It talks to the FastAPI backend on App Service over HTTPS,
streaming server-sent events from `POST /api/runs` and `POST /api/runs/{run_id}/approval`.

## Folder layout

```
src/
  api/          client.ts (all backend calls), sse.ts (stream parser), types.ts (backend shapes)
  state/        runReducer.ts: turns the event stream into what the run view shows
  hooks/        useRun, useBackendData, useElapsed, useHashRoute
  lib/          agents.ts (labels and descriptions), format.ts
  config/       site.ts (title, author, links, API base URL)
  components/
    layout/     Header, Footer
    scenarios/  ScenarioList, ScenarioCard
    run/        RunPanel, Pipeline, StepCard, AgentOutput, ToolCallList,
                ApprovalCard, OutcomeCard, SecurityBanner, EventLog, EmptyRun
    common/     Badge, Collapsible, CodeBlock, RichText, Spinner
  pages/        DemoPage, HowItWorksPage
  styles/       global.css (light and dark themes)
public/
  staticwebapp.config.json   SPA fallback and security headers
tests/          SSE parser and run reducer tests (Vitest)
.github/workflows/           GitHub Actions deploy to Static Web Apps
```

## Run locally

Needs Node 20 or later.

```powershell
npm install
copy .env.example .env.local
npm run dev            # http://localhost:5173
```

In dev, `/api` calls go through the Vite proxy to `VITE_DEV_API_TARGET`, so there is no CORS setup.
- Backend running locally: leave it as `http://localhost:8000`.
- Use the deployed backend: set `VITE_DEV_API_TARGET=https://<your-app>.azurewebsites.net`.

```powershell
npm test               # parser and reducer tests
npm run build          # type check + production build into dist/
```

## Deploy to Azure Static Web Apps

### 1. Create the Static Web App
Portal > Create > Static Web App. Plan: Free. Deployment source: **Other** (you deploy from
GitHub Actions or the CLI below). Copy the deployment token from Overview > Manage deployment token.

### 2. Allow the site in the backend's CORS
App Service > Environment variables, set `ALLOWED_ORIGINS` to a comma-separated list, for example:

```
http://localhost:5173,https://<random-name>.azurestaticapps.net,https://triage.trirect.com
```

### 3a. Deploy with GitHub Actions (recommended)
Push this folder to a GitHub repo, then in the repo settings add:
- Secret `AZURE_STATIC_WEB_APPS_API_TOKEN` = the deployment token
- Variable `VITE_API_BASE_URL` = `https://<your-app>.azurewebsites.net` (no trailing slash)

Every push to `main` runs the tests, builds and deploys.

### 3b. Or deploy from your machine
```powershell
$env:VITE_API_BASE_URL = "https://<your-app>.azurewebsites.net"
npm run build
npx @azure/static-web-apps-cli deploy ./dist --deployment-token <token> --env production
```

`VITE_API_BASE_URL` is baked in at build time. Change it, then rebuild.

### 4. Custom domain
Static Web App > Custom domains > Add > `triage.trirect.com`, create the CNAME it shows at your
DNS provider, and add the domain to `ALLOWED_ORIGINS`.

## Notes
- `staticwebapp.config.json` sets a Content Security Policy that allows API calls to
  `https://*.azurewebsites.net`. If the backend moves to another domain, add it to `connect-src`.
- A run id is kept in the URL (`?run=<id>`), so refreshing while a run waits for approval reopens
  it with the draft and the approve and reject buttons.
- Agent text is rendered as plain text with clickable links, never as HTML.
