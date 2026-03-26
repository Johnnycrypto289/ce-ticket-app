# ATL-013 Gap Matrix

Created: 2026-03-26 00:40 CT

## Audit Summary
Current state is a scaffold. Core UI, schema, and seed exist, but production v1 requirements are mostly Partial or Missing.

## Gap Matrix

| Requirement | Status | Evidence | Notes |
|---|---|---|---|
| Real Prisma-backed app (no mock data for core flows) | Partial | `prisma/schema.prisma`, `prisma/seed.ts`, UI still uses `lib/mock-data.ts` | Schema exists; app not wired to DB |
| Auth + role guards | Missing | no auth/session layer present | Must add owner/dispatch/ledger/admin enforcement |
| Gmail inbound sync (thread-aware canonicalization) | Missing | legacy references only: `systems/facilities_mail_automation_script/Code.js`, `systems/scripts/ticket_intake.py` | Need new app-native Gmail sync service |
| Gmail outbound reply from ticket view using correct thread IDs | Missing | UI placeholder only in `app/tickets/[id]/page.tsx` | Must implement Gmail API send/reply path |
| Attachment pipeline (ingest/store/render) | Partial | schema supports attachments; UI renders mock list | Need real storage, ingest, display |
| Dispatch status workflow + timeline + internal notes | Partial | schema supports status/history/notes; UI mock-only | Need DB-backed transitions and note actions |
| Contractor workflow + W9/COI state | Partial | contractor/doc schema exists; UI mock-only | Need actionable workflow + portal/SMS path |
| Quote + invoice workflows | Partial | schema exists; UI mock-only | Need CRUD/actions + readiness checks |
| SLA rules + escalation jobs | Missing | only schema field exists | Need worker/job engine and escalation output |
| AI ticket summary + recommendation actions (OpenAI gpt-5.4) | Missing | schema exists; no action layer | Need server action/service |
| Smoke tests for intake/reply/status/attachments/SLA | Missing | none | Must add test harness |
| Cutover plan from Trello documented (with rollback) | Missing | none in app folder | Must document migration path |
| Security review complete | Missing | none | Must review before done |

## DevCell Role Outputs

### 1) dev-planner
- **Owner routing**
  - Atlas: orchestration + integration
  - backend-worker: schema completion, auth, Gmail services, API/actions, jobs, tests
  - frontend-worker: DB-backed UI, forms, role-aware views, ticket workspace
  - reviewer-security: final blocker audit
- **Dependency graph**
  1. Foundation: config, Prisma cleanup, auth skeleton, service boundaries
  2. Data wiring: replace mock loaders with Prisma-backed queries
  3. Gmail lane: inbound sync + outbound reply + attachments
  4. Workflow lane: status transitions, notes, contractor docs, quotes, invoices
  5. Intelligence lane: SLA engine + AI summary/recommendation
  6. Quality gate: smoke tests + cutover doc + security review
- **Highest risks**
  - Gmail reply threading correctness
  - attachment persistence semantics
  - making replacement-safe without breaking live automations
- **Mitigation**
  - keep app isolated; no live automation mutation
  - env-only Gmail config
  - test using dry-run paths and seed data first

### 2) code-mapper
- **Affected files/modules**
  - existing app shell under `app/`, `components/`, `lib/`, `prisma/`
  - new service layer needed under `lib/server/*`
  - API/server actions needed for ticket mutation, Gmail sync, reply send, AI summarize, SLA jobs
  - tests and docs to be added within project folder
- **Legacy reference value**
  - `Code.js` confirms current canonicalization logic uses thread IDs, ticket IDs, Trello list mapping, and comment-based audit markers
  - `ticket_intake.py` confirms prior local flow: unread Gmail -> Trello incoming
- **Safe edit boundary**
  - keep all new implementation inside `/projects/ce-ticket-app`
  - treat legacy files as reference-only; do not mutate live intake scripts

### 3) docs-researcher
- **Verified implementation constraints**
  - Next.js App Router is already scaffolded; server actions/route handlers are appropriate for form-based mutations
  - Prisma schema should remain env-driven; no secrets in code
  - Gmail integration should be isolated behind service functions with dry-run support for tests and local setup
- **Do**
  - keep Gmail service adapter abstracted
  - make OpenAI model configurable but default to `gpt-5.4`
  - make auth role guards explicit per route/action
- **Don't**
  - don't couple UI directly to Gmail APIs
  - don't store secrets or tokens in repo files
  - don't mutate shared OpenClaw automation during replacement build

## Implementation Order
1. Foundation + auth + Prisma cleanup
2. DB-backed dashboard and ticket pages
3. Ticket actions (notes/status/quotes/invoices/docs)
4. Gmail service (sync + reply) with dry-run and persistence
5. Attachment ingestion/storage model
6. SLA jobs + AI summary actions
7. Smoke tests + cutover + security review
