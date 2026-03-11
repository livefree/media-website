# Reviewer Acceptance: Workstream 1 / Slice 3 - Durable Worker Execution

## Verdict

Accepted on code/test/build review of the current integrated `main`.

## Acceptance Basis

### 1. There is now a durable unattended in-repo worker path for queued provider jobs

- The worker contract is explicit in [lib/server/ingest/worker.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/worker.ts#L1) through:
  - queued job claim
  - claimed lease ownership
  - terminal success transition
  - terminal failure transition
  - unattended drain-until-idle execution
- `runNextDurableProviderJob` and `runDurableProviderJobsUntilIdle` give the repo a real in-repo worker path for queued provider jobs instead of relying only on direct invocation paths.
- The ingest module exports this boundary in [lib/server/ingest/index.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/index.ts#L1), keeping the slice inside ingest-owned server scope.

### 2. Claim, success, failure, and duplicate-pickup protection are all covered

- Worker-level tests in [lib/server/ingest/worker.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/worker.test.ts#L244) prove:
  - successful claim and completion
  - deterministic failure handling
  - duplicate-pickup prevention while a lease is active
  - unattended drain-until-idle behavior across queued jobs
- Repository-level tests in [lib/db/repositories/staging.worker.test.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging.worker.test.ts#L153) prove:
  - claim persists lease ownership
  - the next worker cannot duplicate-pick a leased job
  - terminal success requires matching lease identity
  - terminal failure requires matching lease identity

### 3. Repository lease validation is correct and narrowly scoped

- The only durable-state expansion is the lease metadata on `IngestJob` in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma#L896).
- Repository claim logic in [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L715) claims only `PENDING` jobs, flips them to `RUNNING`, increments `attemptCount`, and records `leaseWorkerId`, `leaseId`, `leaseClaimedAt`, and `leaseExpiresAt`.
- Terminal transitions in [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L763) and [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L791) validate `id + status + leaseWorkerId + leaseId` before updating state, and they fail with `ingest_job_lease_conflict` if the lease does not match.
- That is the right narrow repository boundary for this slice: it adds lease validation without broad queue-platform redesign.

### 4. Scope stayed narrow

- I did not find public-route changes, player work, admin redesign, or broad infrastructure rewrite in the reviewed scope.
- The slice stays limited to:
  - ingest worker runtime support
  - minimal staging repository durability for lease-based claims
  - offline-safe worker/repository tests
- It does not broaden into CI/CD, fleet orchestration, multi-worker management, or general queue-platform migration.

### 5. Tests and build evidence are sufficient

- I ran:

```bash
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/ingest/worker.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/db/repositories/staging.worker.test.ts
npm run build
```

- Both targeted offline-safe test suites passed.
- `npm run build` passed.

## Residual Note

- The lease model is intentionally narrow and in-repo for this slice. It is sufficient for the planner-defined acceptance gate, while leaving broader worker-platform concerns for later operationalization slices.
