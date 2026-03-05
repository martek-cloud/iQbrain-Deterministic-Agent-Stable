# IQBrain Demo Script — ECR-2221 Full Scenario

This document validates the full end-to-end demo using the ECR-2221 change order scenario.

## Pre-flight Checklist

1. Temporal running: `temporal server start-dev`
2. Server running: `npm run dev:server` from repo root
3. Client running: `npm run dev:client` from repo root
4. Browser open at `http://localhost:5173`
5. (Optional) `OPENROUTER_API_KEY` set in `server/.env` for real LLM responses
   - Without key: server falls back gracefully, mock UI responses remain accurate

---

## Demo Scenario: R245 → R250 Part Change (ECR-2221)

**Context**: Motor Controller V2 design calls for replacing R245 (2.2K resistor) with R250 (4.7K)
due to component shortage. ECR-2221 was released in PLM 4 days ago but ERP propagation is incomplete.

---

## Query 1 — Change Impact Analysis

**Input**: `What is the impact of replacing R245 with R250?`

**Expected intent badge**: Change Impact · 93%

**Expected panel**: Change Impact Analysis panel showing:
- Source: R245 → Target: R250
- Affected assemblies: MOTOR-CTRL-V2 (depth 1), DRIVE-UNIT-X1 (depth 2, TOP)
- Production orders: PO-88712 (IN_PROGRESS, $185,000), PO-88841 (PLANNED, $111,000)
- Financial exposure: WIP $185,000 · Inventory $37 · Total ~$185,037

**Pass criteria**: ✅ Panel renders with 2 assemblies, 2 production orders, non-zero financial exposure

---

## Query 2 — Where-Used Analysis

**Input**: `Show me all assemblies that use part R245`

**Expected intent badge**: Where-Used · 91%

**Expected panel**: Where-Used Analysis panel showing:
- Part: R245
- Tree: MOTOR-CTRL-V2 → DRIVE-UNIT-X1
- Total assemblies: 2, Top-Level: 1, Max Depth: 2

**Pass criteria**: ✅ Tree renders with correct parent/child hierarchy, TOP badge visible on DRIVE-UNIT-X1

---

## Query 3 — Closure Status

**Input**: `Show closure status for ECR-2221`

**Expected intent badge**: Closure Status · 89%

**Expected panel**: Closure Status panel showing:
- Change: ECR-2221
- Bottleneck: ERP (red badge)
- Lag: 4 days
- ERP/MBOM: 1/3 updated (progress bar ~33%)
- MES/Orders: 0/2 aligned (0%)
- MBOM propagation: MBOM-001 UPDATED, MBOM-002 PENDING, MBOM-003 PENDING

**Pass criteria**: ✅ Panel shows ERP bottleneck, lag days, partial propagation status

---

## Query 4 — Cycle Time Analysis

**Input**: `What is the cycle time for ECR-2221?`

**Expected intent badge**: Cycle Time · 87%

**Expected panel**: Cycle Time panel showing:
- Total: ~18 days
- Longest Stage: APPROVAL (red BOTTLENECK badge)
- Approval Cycles: 1 (one rejection by J.Smith)
- Stage breakdown: DRAFT, REVIEW, APPROVAL (twice, totaling ~10d), RELEASE

**Pass criteria**: ✅ APPROVAL marked as bottleneck, 1 rejection cycle noted, ~18 total days

---

## Query 5 — EBOM/MBOM Reconciliation

**Input**: `Does the MBOM match the EBOM for Motor Controller V2?`

**Expected intent badge**: BOM Compare · 85%

**Expected panel**: EBOM/MBOM Comparison panel showing:
- Assembly: MOTOR-CTRL-V2
- Total lines: 4+ lines
- R250: QTY EXPECTED (scrapFactor explains +1)
- M-ALT-01: MBOM-ONLY ! (no approved substitute)
- C112, IC-78L05: ALIGNED

**Pass criteria**: ✅ Divergences highlighted, UNEXPECTED items in red, EXPECTED with explanation

---

## Edge Cases to Test

| Input | Expected behavior |
|---|---|
| `What's the weather today?` | Unknown intent, clarification message |
| `Show supply chain for R245` | Deferred stub → "not yet implemented" message |
| `What is the cycle time?` (no changeId) | Low confidence → clarification request |

---

## Health Check

```
curl http://localhost:3001/api/health
```

Expected response:
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

---

## Local Dev Setup (quick reference)

```bash
# 1. Clone and install
npm install --cache /tmp/npm-cache

# 2. Copy env file
cp server/.env.example server/.env
# Edit server/.env — set OPENROUTER_API_KEY if available

# 3. Start everything
temporal server start-dev                  # terminal 1
npm run dev:server                         # terminal 2
npm run dev:client                         # terminal 3

# 4. Open browser
open http://localhost:5173
```

## Docker Compose Setup

```bash
OPENROUTER_API_KEY=sk-or-... MONITORING_INTERVAL_HOURS=0.01 docker-compose up --build
open http://localhost
```
