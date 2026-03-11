# Reviewer Acceptance: Workstream 1 / Slice 5 - Retry And Throttling Guardrails

## Verdict

Accepted on code/test/build review of the current local `main`.

## Acceptance Basis

### 1. Bounded retry behavior now exists and reaches terminal failure at the configured bound

- The resumable provider page-worker now carries explicit retry state on the queued job contract in [lib/server/ingest/page-worker.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.ts#L13).
- Retry scheduling is bounded by `retryLimit`, with deterministic requeue on attempts within the bound and terminal failure once the bound is exceeded in [lib/server/ingest/page-worker.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.ts#L533).
- The worker tests prove both paths:
  - bounded retry scheduling in [lib/server/ingest/page-worker.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.test.ts#L345)
  - terminal failure after the configured limit in [lib/server/ingest/page-worker.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.test.ts#L382)

### 2. Throttle enforcement and backoff timing are deterministic

- Backoff timing is deterministic and testable through explicit `retryBaseMs`, `retryMaxMs`, and exponential calculation in [lib/server/ingest/page-worker.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.ts#L207) and [lib/server/ingest/page-worker.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.ts#L239).
- Provider-aware throttling is resolved from `providerThrottleMs`, including provider-key-specific configuration, in [lib/server/ingest/page-worker.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.ts#L219).
- The worker tests prove:
  - throttled deferral before issuing another request in [lib/server/ingest/page-worker.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.test.ts#L419)
  - the next continued checkpoint gets the correct throttled due time after a successful page boundary in [lib/server/ingest/page-worker.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.test.ts#L454)

### 3. Claim logic respects `nextAttemptAt` and does not pick delayed jobs early

- Durable retry/throttle timing is now persisted on `IngestJob` through `retryCount`, `lastAttemptedAt`, and `nextAttemptAt` in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma#L896).
- Repository claim logic explicitly skips queued page jobs whose `nextAttemptAt` is still in the future in [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L897).
- The repository test at [lib/db/repositories/staging.page-worker.test.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging.page-worker.test.ts#L203) proves a throttled job is skipped until due and a due job is claimed instead.

### 4. Scope stayed narrow

- I did not find public-route changes, player work, admin redesign, external queue adoption, or broad infrastructure rewrite in the reviewed scope.
- The slice stays limited to:
  - the queued provider page-worker path
  - durable retry/throttle timing persistence
  - due-time-aware claim eligibility
  - deterministic offline-safe tests

### 5. Tests and build evidence are sufficient

- I ran:

```bash
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/ingest/page-worker.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/db/repositories/staging.page-worker.test.ts
npm run build
```

- Both targeted offline-safe test suites passed.
- `npm run build` passed.

## Residual Note

- This slice hardens retry and throttling for one queued provider page-ingest path only. That narrower scope is correct for the planner-defined Slice 5 acceptance gate and does not yet broaden into general queue-platform or multi-provider scheduling work.
