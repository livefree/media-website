# Reviewer Acceptance: Workstream 4 / Slice 4 - Migration Safety And Rollout Guardrails

## Verdict

Accepted on code/test/build review of the current integrated `main`.

## Acceptance Basis

### 1. Migration-safety behavior materially improves rollout safety

- The new guardrail contract in [lib/db/migration-safety.ts](/Users/livefree/projects/media-website-v2/lib/db/migration-safety.ts#L1) computes a deterministic Prisma schema digest and compares it against durable runtime rollout metadata for the published-catalog runtime target.
- The contract distinguishes explicit blocked states instead of leaving rollout readiness implicit:
  - missing metadata
  - unavailable metadata table/columns
  - schema digest mismatch
  - rollout still pending
  - rollout explicitly blocked
- The corresponding durable runtime metadata now exists in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma#L1402) through `RuntimeMigrationState`.

### 2. Invalid or incomplete migration state fails closed

- Public published-catalog serving now routes through `assertPublishedCatalogRuntimeReady()` before any repository read in [lib/server/catalog/service.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/service.ts#L53).
- That fail-closed behavior is applied consistently across the published runtime entry points reviewed here:
  - catalog page
  - detail lookup by slug/public ID
  - watch resolution
  - list directory/detail
  - featured-list discovery
- The blocking path returns a safe backend error from [lib/db/migration-safety.ts](/Users/livefree/projects/media-website-v2/lib/db/migration-safety.ts#L123) instead of allowing ambiguous runtime behavior.
- The catalog service tests explicitly prove the runtime does not continue into published reads when the preflight blocks in [lib/server/catalog/service.test.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/service.test.ts#L113).

### 3. Migration visibility remains narrow and privileged

- The only reviewed visibility surface is the operator-only migration status contract in [lib/server/admin/service.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.ts#L78).
- That surface exposes one narrow `AdminMigrationSafetyPageRecord` in [lib/server/admin/types.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/types.ts#L76) rather than broadening the public runtime contract.
- The admin service tests prove underprivileged viewers are denied before the migration preflight dependency is invoked in [lib/server/admin/service.test.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.test.ts#L1260).

### 4. Scope stayed narrow

- I did not find backup/restore workflows, deployment automation, CI/CD expansion, or broader ops-suite drift in the reviewed scope.
- The slice stays focused on:
  - deterministic preflight evaluation
  - durable rollout metadata
  - fail-closed gating on the targeted published-catalog backend path
  - narrow privileged migration-status visibility
- I did not find public-route redesign or player/runtime product changes in this slice.

### 5. Tests and build evidence are sufficient

- I ran:

```bash
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/db/migration-safety.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/catalog/service.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/admin/service.test.ts
npm run build
```

- All three offline-safe test suites passed.
- `npm run build` passed.

## Residual Note

- The reviewed guardrail is intentionally narrow to the published-catalog runtime target in this slice. That matches the planner scope and is appropriate for rollout hardening without expanding into broader deployment orchestration.
