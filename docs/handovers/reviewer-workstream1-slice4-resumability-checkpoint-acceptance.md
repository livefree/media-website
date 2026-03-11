# Reviewer Acceptance: Workstream 1 / Slice 4 - Resumability And Checkpoint Hardening

## Verdict

Accepted on code/test/build review of the current local `main`.

## Acceptance Basis

### 1. Restart-safe continuation now exists for one provider-job path

- The slice introduces a dedicated resumable page-worker path in [lib/server/ingest/page-worker.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.ts#L1).
- That worker claims one queued provider page-ingest job, reconstructs the durable resume request, and then either:
  - requeues the job with the next durable checkpoint
  - completes the job when no further checkpoint remains
  - fails the job while preserving the last durable checkpoint
- The resumable path is exported through the ingest boundary in [lib/server/ingest/index.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/index.ts#L16), so it stays inside ingest-owned scope.

### 2. Checkpoint advancement only happens after the safe persisted boundary

- The worker does not advance from request-local state. It derives the next continuation point only from `result.persisted.checkpoint` in [lib/server/ingest/page-worker.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.ts#L126).
- If a persisted checkpoint exists, the worker requeues with that checkpoint; if not, it completes the job.
- This matches the planner rule that checkpoint state must represent the last durable safe continuation point rather than the last attempted step.
- The worker test at [lib/server/ingest/page-worker.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.test.ts#L247) explicitly proves checkpoint advancement only occurs after a successful durable page boundary.

### 3. Resume avoids reprocessing earlier pages and preserves the last durable checkpoint on failure

- `buildResumedPageRequest()` re-enters from the serialized durable checkpoint rather than process-local assumptions in [lib/server/ingest/page-worker.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.ts#L173).
- The resume test in [lib/server/ingest/page-worker.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.test.ts#L271) proves the page-worker runs page `2`, advances to checkpoint page `3`, and then resumes at page `3` instead of replaying page `2`.
- The failure-path test in [lib/server/ingest/page-worker.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/page-worker.test.ts#L306) proves a resumed failure does not overwrite or lose the last durable checkpoint.

### 4. Durable requeue, complete, and fail transitions are correctly lease-validated

- The repository reconstructs queued page jobs and their durable checkpoint from stored metadata in [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L623).
- `requeueQueuedProviderPageJob()` requires a matching `RUNNING + workerId + leaseId` lease, serializes `resumeCheckpoint` into durable metadata, resets the job to `PENDING`, and clears the active lease in [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L962).
- `completeQueuedProviderPageJob()` and `failQueuedProviderPageJob()` use the same narrow lease validation and fail with `ingest_job_lease_conflict` if the lease does not match in [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L1014) and [lib/db/repositories/staging/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging/index.ts#L1070).
- Repository tests in [lib/db/repositories/staging.page-worker.test.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/staging.page-worker.test.ts#L185) cover checkpoint serialization plus terminal lease enforcement.

### 5. Scope stayed narrow

- I did not find public-route changes, player work, admin redesign, or broad infrastructure migration in the reviewed scope.
- The slice stays limited to:
  - one queued provider page-ingest recovery path
  - durable checkpoint reconstruction and serialization
  - narrow lease-validated requeue/complete/fail transitions
  - offline-safe worker/repository tests

### 6. Tests and build evidence are sufficient

- I ran:

```bash
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/ingest/page-worker.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/db/repositories/staging.page-worker.test.ts
npm run build
```

- Both targeted offline-safe test suites passed.
- `npm run build` passed.

## Residual Note

- This slice hardens one deterministic resumable page-ingest path. That narrower scope is appropriate for the planner-defined checkpoint/resume hardening gate and does not yet attempt broad retry/throttling redesign or multi-provider recovery matrices.
