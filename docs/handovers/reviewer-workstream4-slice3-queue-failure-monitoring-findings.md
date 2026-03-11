# Reviewer Findings: Workstream 4 / Slice 3 - Queue Failure Monitoring And Operator Visibility

## Verdict

Findings. I am not accepting this slice yet.

## Findings

### 1. Missing deterministic UI coverage for the new privileged `/admin/queue-failures` surface

- The slice introduces a new operator-facing admin route at [app/admin/queue-failures/page.tsx](/Users/livefree/projects/media-website-v2/app/admin/queue-failures/page.tsx#L1) and a new presentation surface at [components/admin/AdminQueueFailureMonitoringPage.tsx](/Users/livefree/projects/media-website-v2/components/admin/AdminQueueFailureMonitoringPage.tsx#L1).
- The planner handoff makes deterministic UI coverage mandatory when the slice adds an operator-facing visibility surface; see [docs/handovers/planner-workstream4-slice3-queue-failure-monitoring.md](/Users/livefree/projects/media-website-v2/docs/handovers/planner-workstream4-slice3-queue-failure-monitoring.md#L125).
- I did not find any queue-failure-specific component or route test file under `components/admin/` or `app/admin/` for this new surface. The current coverage is backend/service-only.
- Because this slice adds a new privileged operator page, the missing UI-level deterministic coverage is a release blocker for reviewer acceptance even though the backend tests and build are passing.

## What Passed

- Authorized operators can read failed and retrying jobs through the guarded backend contract in [lib/server/admin/service.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.ts#L181) and [lib/server/health/service.ts](/Users/livefree/projects/media-website-v2/lib/server/health/service.ts#L36).
- The privileged read model exposes materially useful structured triage context, including:
  - visibility state
  - retry state
  - failure category/code/status/retryability
  - last error summary
  - provider/source target context
  - request/checkpoint context
  - attempt count and timing
- The queue-failure-specific backend tests in [lib/server/admin/service.test.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.test.ts#L904) prove the privileged read model includes failed and retrying jobs plus structured triage fields.
- The access boundary still protects the surface and read path. Anonymous and underprivileged viewer requests are denied before queue-failure dependencies run in [lib/server/admin/service.test.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.test.ts#L1200).
- Telemetry refinement for retry/failure triage is present and tested in [lib/server/ingest/telemetry.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/telemetry.ts#L20), [lib/server/ingest/execution.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/execution.test.ts#L288), and [lib/server/ingest/source-jobs.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/source-jobs.test.ts#L290).
- I did not find public-route, player, or provider-redesign drift.
- `npm run build` passed, and the route manifest includes `/admin/queue-failures`.

## Checks Run

```bash
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/ingest/execution.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/ingest/source-jobs.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/admin/service.test.ts lib/server/admin/access.test.ts
npm run build
```

All of the above passed.

## Required Follow-Up

- Add deterministic UI coverage for the new `/admin/queue-failures` surface so the slice satisfies the planner’s test requirement for a newly introduced operator-facing page.
