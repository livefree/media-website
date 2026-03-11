# Reviewer Acceptance: Workstream 4 / Slice 1 - Structured Job Execution Telemetry And Failure Visibility

## Verdict

Accepted on code/test/build review of the current integrated `main`.

## Acceptance Basis

### 1. The slice stays narrow and does not leak into public/runtime/product UI work

- The reviewed implementation is contained to ingest/job execution files under [lib/server/ingest/execution.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/execution.ts#L1), [lib/server/ingest/source-jobs.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/source-jobs.ts#L1), and the new shared helper at [lib/server/ingest/telemetry.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/telemetry.ts#L1).
- I did not find changes to public browse/search/detail/watch/list routes, player/runtime UI, or new admin/operator surfaces in this slice.
- The route output from `npm run build` remained the existing app surface; no new product/runtime route expansion was introduced by this hardening work.

### 2. Telemetry structure is coherent and usable across ingest and scheduled jobs

- The slice introduces one shared telemetry vocabulary in [lib/server/ingest/telemetry.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/telemetry.ts#L1):
  - shared job kinds
  - stable failure categories
  - normalized context builders for page ingest, source refresh, and source probe
  - one `buildExecutionTelemetryMetadata` shape for pending, running, succeeded, and failed states
- The shared metadata shape includes the fields needed for later operational visibility:
  - job kind and scope
  - provider key
  - request/actor context
  - maintenance reason / probe kind
  - target snapshot
  - attempt count
  - started/finished timestamps
  - duration
  - item/raw payload/warning counts
  - checkpoint state where applicable
  - structured failure summary
- Page ingest uses the shared builder in [lib/server/ingest/execution.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/execution.ts#L69), and scheduled refresh/probe jobs use the same model in [lib/server/ingest/source-jobs.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/source-jobs.ts#L144), so the execution record shape is consistent across all three accepted job flows.

### 3. Failure visibility is materially improved

- Before this slice, the job paths already had durable job/run status, but failure interpretation was still relatively thin and more dependent on ad hoc logs.
- This slice materially improves failure visibility by persisting structured machine-readable failure summaries through `classifyIngestExecutionFailure` in [lib/server/ingest/telemetry.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/telemetry.ts#L118).
- Failures now capture:
  - stable category
  - backend error code
  - HTTP/status context where available
  - retryability
  - summary text
  - error name
- Those structured failure records are written into both job and run metadata on failure in [lib/server/ingest/execution.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/execution.ts#L157) and [lib/server/ingest/source-jobs.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/source-jobs.ts#L223).
- Scheduled job success paths also now surface linked repair/health context such as `probeRunId`, `repairQueueCount`, and `observedState`, which makes later repair-oriented debugging materially easier than replaying console output alone.

### 4. Tests and build evidence are sufficient and credible

- Focused offline-safe ingest execution coverage exists in [lib/server/ingest/execution.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/execution.test.ts#L1), including:
  - successful page ingest telemetry
  - failed page ingest telemetry
  - failure classification assertions for `provider_payload_invalid`
- Focused offline-safe scheduled job coverage exists in [lib/server/ingest/source-jobs.test.ts](/Users/livefree/projects/media-website-v2/lib/server/ingest/source-jobs.test.ts#L1), including:
  - queued -> running -> succeeded refresh lifecycle
  - probe success telemetry
  - probe failure telemetry with stable category/code/retryability
  - repeated-attempt telemetry incrementing from prior attempt count
- I ran:

```bash
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/ingest/execution.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/ingest/source-jobs.test.ts
npm run build
```

- Both ingest test suites passed.
- `npm run build` passed.

## Residual Note

- The test runs still emit Node's `MODULE_TYPELESS_PACKAGE_JSON` warning under `--experimental-strip-types`, and the ingest service continues to emit informational logs during execution tests. Neither is blocking here, because execution outcome visibility no longer depends on logs alone: the structured telemetry is now persisted and asserted directly in tests.
