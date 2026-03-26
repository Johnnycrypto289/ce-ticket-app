# Security Review

## Scope Reviewed
- env-based secret handling
- auth/session role checks
- Gmail service isolation
- write boundaries inside project folder
- no mutation of live legacy automation

## Findings
### Resolved
1. **Hardcoded secrets in scaffold** — resolved by env-only config in `.env.example`
2. **Mock-only core UI** — replaced with DB-backed pages
3. **No role guard layer** — resolved with route/action-level auth checks

### Remaining Risks (Non-blocking for local v1)
1. Login is seed-email based and not production-identity-grade
   - Fix: replace with real auth provider before external deployment
2. Gmail live send depends on OAuth env credentials
   - Fix: validate with dedicated service account/user consent flow
3. Attachment storage is local filesystem
   - Fix: move to durable object storage before production cutover

## Blocking Findings
- None for local development/demo use.


## Outbound Safety Enforcement
- Protected client outbound is forced through `sendClientEmail()`
- In `TEST_MODE=true` and `OUTBOUND_POLICY=safe-template`, protected recipients receive exact safe template body only
- Attachments are stripped, CC minimized, threadId preserved, and audit event tagged `sanitized_test_send`
