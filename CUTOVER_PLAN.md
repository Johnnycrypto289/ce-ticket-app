# Trello Cutover Plan

## Goal
Move CE ticket operations from Trello to the CE Ticket App without breaking the current live intake path.

## Phase 1 — Parallel Run
- Keep current Gmail -> Trello automation untouched
- Run CE Ticket App in shadow mode
- Sync Gmail into CE Ticket App independently
- Validate ticket canonicalization, reply threading, attachments, and status workflows

## Phase 2 — Operator Adoption
- Dispatch works primarily from CE Ticket App
- Trello becomes reference-only backup
- Validate quote, invoice, contractor docs, and SLA jobs in app

## Phase 3 — Controlled Cutover
- Disable Trello card creation only after inbox sync + reply flow are validated
- Preserve rollback switch by leaving legacy scripts intact and documented
- Keep Trello board read-only during first 72 hours of cutover

## Rollback
If Gmail sync or reply threading fails:
- continue using current Trello flow immediately
- disable app-driven outbound actions
- retain all CE Ticket App data for diagnostics
- fix and resume shadow mode before retrying cutover

## Preconditions Before Cutover
- intake smoke tests pass
- reply threading verified against live Gmail sandbox/test thread
- attachment ingest verified
- status changes + notes verified
- dispatch team approves workflow parity
