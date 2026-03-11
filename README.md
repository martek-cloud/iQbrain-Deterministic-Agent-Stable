# IQBrain — AI-Powered Manufacturing Intelligence

IQBrain is a natural-language assistant for engineering change management. It lets engineers query PLM, ERP, and MES systems in plain English and get structured, data-driven answers — powered by LLMs and durable Temporal.io workflows.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Supported Intents](#supported-intents)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development](#local-development)
  - [Docker Compose](#docker-compose)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Temporal Workflows](#temporal-workflows)
- [Adapter System](#adapter-system)
- [Demo Scenario](#demo-scenario)
- [Tech Stack](#tech-stack)

---

## Overview

IQBrain bridges the gap between engineering change systems (PLM/ERP/MES) and the people who need answers. Instead of navigating multiple disconnected tools, an engineer can type:

> *"What is the impact of replacing R245 with R250?"*

and get a fully structured panel showing affected assemblies, open production orders, and financial exposure — all in seconds.

The system works by:
1. Parsing the user's natural-language query to detect **intent** (via an LLM call to OpenRouter).
2. Routing the intent to a **Temporal workflow** that calls mock (or real) PLM/ERP/MES adapters.
3. **Streaming** the result back to the browser over SSE, rendering a rich UI panel alongside a generated narrative.

---

## Architecture

```
Browser (React + Vite)
        │  SSE stream
        ▼
Express API  (/api/chat, /api/health, /api/models)
        │
        ├── Intent Parser  (OpenRouter LLM)
        │
        ├── Temporal Client  ──────────► Temporal Server (port 7233)
        │                                       │
        │                               Temporal Worker
        │                                       │
        │                           ┌───────────┼───────────┐
        │                         PLM          ERP         MES
        │                       Adapter      Adapter     Adapter
        │                      (mock/real)  (mock/real) (mock/real)
        │
        └── Session Store  (in-memory)
```

Communication between the browser and API uses **Server-Sent Events (SSE)** for incremental updates: status phases → intent badge → workflow data panel → LLM narrative tokens → done.

---

## Project Structure

```
iQbrainAIDeter/
├── client/                     # React SPA
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── App.tsx         # Root component, chat layout
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── IntentBadge.tsx
│   │   │   ├── ModelSelector.tsx
│   │   │   └── panels/         # Result panels per intent
│   │   │       ├── ImpactPanel.tsx
│   │   │       ├── WhereUsedPanel.tsx
│   │   │       ├── ClosurePanel.tsx
│   │   │       ├── CycleTimePanel.tsx
│   │   │       ├── ReconcilePanel.tsx
│   │   │       └── WorkflowPanel.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts      # SSE streaming hook
│   │   └── mocks/
│   │       └── mockSSE.ts      # Dev mock for SSE events
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile
│
├── server/                     # Express API + Temporal worker
│   ├── src/
│   │   ├── index.ts            # Express app entry point
│   │   ├── routes/
│   │   │   ├── chat.ts         # POST /api/chat (SSE)
│   │   │   ├── health.ts       # GET /api/health
│   │   │   └── models.ts       # GET /api/models
│   │   ├── adapters/
│   │   │   ├── interfaces.ts   # PLM/ERP/MES adapter interfaces
│   │   │   ├── toolRouter.ts   # Selects adapter based on env
│   │   │   └── mock/           # Mock data adapters
│   │   │       ├── data.ts     # Seed fixture data
│   │   │       ├── plm.ts
│   │   │       ├── erp.ts
│   │   │       └── mes.ts
│   │   ├── canonical/
│   │   │   ├── identityResolver.ts  # Part/assembly ID normalisation
│   │   │   └── relationships.ts     # Cross-system relationship graph
│   │   ├── temporal/
│   │   │   ├── client.ts       # Temporal client singleton
│   │   │   ├── worker.ts       # Worker entry point
│   │   │   ├── intentRouter.ts # Maps ParsedIntent → workflow
│   │   │   └── workflowBundle.ts
│   │   ├── workflows/
│   │   │   ├── changeImpact/   # Change impact analysis workflow
│   │   │   ├── whereUsed/      # Where-used tree workflow
│   │   │   ├── closureQuery/   # ECR closure status workflow
│   │   │   ├── cycleTimeSingle/# ECR cycle time workflow
│   │   │   ├── ebomMbomReconcile/ # EBOM/MBOM comparison workflow
│   │   │   ├── changeIngestion/
│   │   │   ├── closureInit/
│   │   │   ├── closureMonitor/
│   │   │   ├── registry.ts     # Workflow registry
│   │   │   └── plugin.ts       # Plugin interface
│   │   ├── lib/
│   │   │   └── openrouter.ts   # OpenRouter LLM client
│   │   ├── session/
│   │   │   └── store.ts        # In-memory session store
│   │   └── types/
│   │       ├── canonical.ts
│   │       └── intents.ts
│   ├── .env.example
│   └── Dockerfile
│
├── packages/
│   └── shared-types/           # Shared TypeScript types (monorepo package)
│       └── src/index.ts        # All shared interfaces & SSE event types
│
├── docker-compose.yml
├── azure-pipelines.yml
└── DEMO_SCRIPT.md
```

---

## Supported Intents

| Intent | Trigger example | Workflow |
|---|---|---|
| **Change Impact Analysis** | "What is the impact of replacing R245 with R250?" | `changeImpact` |
| **Where-Used Analysis** | "Show me all assemblies that use part R245" | `whereUsed` |
| **Closure Status** | "Show closure status for ECR-2221" | `closureQuery` |
| **Cycle Time** | "What is the cycle time for ECR-2221?" | `cycleTimeSingle` |
| **EBOM/MBOM Comparison** | "Does the MBOM match the EBOM for Motor Controller V2?" | `ebomMbomReconcile` |
| **Unknown / Deferred** | "What's the weather today?" | Graceful decline |

Each intent carries a **confidence score** displayed as a badge in the UI. If confidence is too low or required parameters are missing, the system asks for clarification.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10 (workspaces support)
- **Temporal CLI** (for local dev without Docker)

Install Temporal CLI:
```bash
# macOS
brew install temporal

# or download from https://github.com/temporalio/cli
```

### Local Development

```bash
# 1. Clone and install all workspace dependencies
git clone <repo-url> iQbrainAIDeter
cd iQbrainAIDeter
npm install

# 2. Configure the server environment
cp server/.env.example server/.env
# Edit server/.env and add your OPENROUTER_API_KEY (optional — falls back gracefully without it)

# 3. Start Temporal (terminal 1)
temporal server start-dev

# 4. Start the API server (terminal 2)
npm run dev:server

# 5. Start the Temporal worker (terminal 3)
npm run dev:worker

# 6. Start the React client (terminal 4)
npm run dev:client

# 7. Open the app
open http://localhost:5173
```

> **Without an OpenRouter key**: The server falls back to a heuristic intent parser and mock responses. The UI will still display accurate panels with mock data.

### Docker Compose

The full stack (PostgreSQL, Temporal, Temporal UI, API server, worker, React client) runs with a single command:

```bash
# Minimal — uses mock adapters, no LLM
docker-compose up --build

# With LLM support
OPENROUTER_API_KEY=sk-or-... docker-compose up --build

# With fast closure monitoring (for demo)
OPENROUTER_API_KEY=sk-or-... MONITORING_INTERVAL_HOURS=0.01 docker-compose up --build

# Open the app
open http://localhost
```

| Service | URL |
|---|---|
| React SPA | http://localhost |
| Express API | http://localhost:3001 |
| Temporal UI | http://localhost:8233 |
| Temporal gRPC | localhost:7233 |

---

## Environment Variables

All variables live in `server/.env` (copy from `server/.env.example`):

| Variable | Default | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | *(empty)* | API key for OpenRouter LLM calls. Optional — falls back to mock intent parsing. |
| `TEMPORAL_ADDRESS` | `localhost:7233` | Temporal server address |
| `TEMPORAL_NAMESPACE` | `iqbrain` | Temporal namespace |
| `TEMPORAL_TASK_QUEUE` | `iqbrain-main` | Task queue name used by worker and client |
| `DATA_SOURCE` | *(unset)* | Set to `static` to load demo data from `server/resources/demo-data/` (JSON files: parts, assemblies, changes, mbom_mappings, production_orders, inventory, closure_trackers, relationships). Unset = in-code mock data. |
| `PLM_ADAPTER` | `mock` | PLM adapter to use (`mock` or custom) |
| `ERP_ADAPTER` | `mock` | ERP adapter to use |
| `MES_ADAPTER` | `mock` | MES adapter to use |
| `MONITORING_INTERVAL_HOURS` | `24` | How often the closure monitor workflow polls for updates |
| `PORT` | `3001` | Express server port |
| `NODE_ENV` | `development` | Node environment |

---

## API Reference

### `GET /api/health`

Returns the server and adapter health status.

```json
{
  "status": "ok",
  "phase": "P6",
  "adapters": {
    "plm": { "type": "mock", "ok": true },
    "erp": { "type": "mock", "ok": true },
    "mes": { "type": "mock", "ok": true }
  }
}
```

### `GET /api/models`

Returns the list of available LLM models from OpenRouter (filtered to free tier).

### `POST /api/chat` — SSE Stream

Accepts a chat message and streams back a sequence of SSE events.

**Request body:**
```json
{
  "message": "What is the impact of replacing R245 with R250?",
  "sessionId": "optional-session-id",
  "modelId": "meta-llama/llama-3.3-70b-instruct:free"
}
```

**SSE event sequence:**

| Event type | Description |
|---|---|
| `session` | Provides the session ID for the conversation |
| `status` | Phase updates: `connecting` → `parsing` → `routing` → `workflow` → `generating` → `done` |
| `intent` | Parsed intent with type, confidence, and parameters |
| `workflow` | Full workflow result (data for the UI panel) |
| `token` | Individual LLM narrative tokens (streamed) |
| `done` | Signals end of stream |
| `error` | Error message if something fails |

---

## Temporal Workflows

Each query intent maps to a dedicated Temporal workflow. Workflows are durable — they survive server restarts and can run long-running operations reliably.

| Workflow | File | Description |
|---|---|---|
| `changeImpact` | `workflows/changeImpact/` | Fetches BOM tree, production orders, and computes financial exposure for a part substitution |
| `whereUsed` | `workflows/whereUsed/` | Walks the BOM graph upward to find all assemblies using a part |
| `closureQuery` | `workflows/closureQuery/` | Checks PLM/ERP/MES propagation status for a given ECR |
| `cycleTimeSingle` | `workflows/cycleTimeSingle/` | Calculates stage-by-stage cycle time and identifies the bottleneck stage |
| `ebomMbomReconcile` | `workflows/ebomMbomReconcile/` | Compares EBOM and MBOM lines, categorising each as aligned, divergent, or unexpected |
| `changeIngestion` | `workflows/changeIngestion/` | Ingests new ECRs from PLM |
| `closureInit` | `workflows/closureInit/` | Initialises closure tracking for a newly released ECR |
| `closureMonitor` | `workflows/closureMonitor/` | Long-running monitor that periodically polls ERP/MES propagation |

Each workflow has unit tests under its `__tests__/` directory.

---

## Adapter System

The server supports pluggable PLM, ERP, and MES adapters controlled by environment variables:

```
PLM_ADAPTER=mock   # or: teamcenter, custom, ...
ERP_ADAPTER=mock   # or: sap, ...
MES_ADAPTER=mock   # or: ...
```

Adapters implement the interfaces defined in `server/src/adapters/interfaces.ts`. The `toolRouter.ts` selects and instantiates the correct adapter at startup. All current adapters are mock implementations using the fixture data in `adapters/mock/data.ts`.

To add a real adapter:
1. Create a new folder under `server/src/adapters/` (e.g., `teamcenter/`).
2. Implement the `PlmAdapter` (or `ErpAdapter` / `MesAdapter`) interface.
3. Register it in `toolRouter.ts`.
4. Set the corresponding `_ADAPTER` env variable.

---

## Demo Scenario

The built-in mock data is designed around a realistic engineering change scenario:

**Team demo with static data:** To run the same ecosystem (workflows, intent, LLM, canonical model, adapters) with data loaded from files instead of in-code fixtures, set `DATA_SOURCE=static` in `server/.env` and ensure the server is run from the `server/` directory (or that `server/resources/demo-data/` exists relative to your working directory). The folder must contain the eight canonical-shaped JSON files: `parts.json`, `assemblies.json`, `changes.json`, `mbom_mappings.json`, `production_orders.json`, `inventory.json`, `closure_trackers.json`, `relationships.json`. Edit these files to align IDs and numbers with your demo script without changing code.

> **ECR-2221** — Motor Controller V2 requires replacing resistor **R245** (2.2 kΩ) with **R250** (4.7 kΩ) due to component shortage. The change was released in PLM 4 days ago but ERP propagation is incomplete.

Try these queries against the running app:

1. `What is the impact of replacing R245 with R250?`
2. `Show me all assemblies that use part R245`
3. `Show closure status for ECR-2221`
4. `What is the cycle time for ECR-2221?`
5. `Does the MBOM match the EBOM for Motor Controller V2?`

See [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) for expected outputs and pass criteria for each query.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js 20, Express 4, TypeScript |
| Workflow Engine | Temporal.io (v1.10) |
| LLM | OpenRouter API (Llama 3.3 70B, DeepSeek V3, Gemma 3, Mistral 7B — free tier) |
| Monorepo | npm workspaces |
| Containerisation | Docker, Docker Compose, nginx |
| CI | Azure Pipelines |
| Testing | Vitest |

---

## Scripts

Run from the **repo root**:

| Command | Description |
|---|---|
| `npm run dev:client` | Start the React dev server (port 5173) |
| `npm run dev:server` | Start the Express API in watch mode (port 3001) |
| `npm run dev:worker` | Start the Temporal worker in watch mode |
| `npm run build` | Type-check and build all workspaces |
| `npm run test` | Run all workspace tests |
| `npm run typecheck` | Run TypeScript type-checking across all workspaces |
