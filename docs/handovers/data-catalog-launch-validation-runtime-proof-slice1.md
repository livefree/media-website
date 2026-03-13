# Data Catalog Handoff: Launch Validation And Runtime Proof / Slice 1

This slice proves the full ingest → normalization → review workflow using real provider artifacts. Data Catalog’s only in-scope work was to make those ingest artifacts visible to the operator-facing admin contracts so that an operator can trace the exact `requestId`, `actorId`, and ingest run that produced a normalized candidate and the queue entry generated from it.

## Implementation

- `lib/db/repositories/normalization` now joins each normalized candidate to its staging candidate and ingest run, so the `PersistedNormalizedCandidateRecord` delivered by `listPendingNormalizedCandidates` carries:
  - `ingestJobId`, `ingestRunId`, `ingestRequestId`, `ingestActorId`
  - normalized digest of `ingestMode`, `ingestScope`, `ingestStartedAt`, `ingestFinishedAt`
- The `jszyapi_vod_json` adapter now targets `https://jszyapi.com/api.php/provide/vod/from/jsm3u8/at/json`, matching the live lane that feeds the real ingest intake expected by this proof path.
- `lib/db/repositories/review` mirrors the same ingest metadata when building the review queue list/detail records; both `listReviewQueue` and `getReviewQueueDetail` now include `stagingCandidate.ingestRun`.
- The admin service (`getAdminPendingNormalizedCandidatesPage`) continues to surface the pending candidates, but they now contain the ingest metadata, and the new regression test ensures operators can read the same fields from the service response.

## Verification Steps

1. Run a real provider ingest (e.g., `npm run ingest:provider:jszyapi -- --request-id proof-123 --actor-id operator --mode manual`).
2. Call the admin normalization contract (`/admin/normalized` or `getAdminPendingNormalizedCandidatesPage`) and note the normalized candidate whose `ingestRequestId` equals the request from step 1; record the `ingestRunId`/`ingestJobId`.
3. Queue that candidate for review through the admin queue action and confirm `listReviewQueue` or `/admin/review` returns the same `ingestRunId` plus the normalized `ingestMode`/`ingestScope`.
4. The ingest metadata now provides a concrete proof trace linking the real intake command to the review entry without touching the database manually.

## Tests

- `node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/admin/service.test.ts`
- `npm run test:provider-ingest`
- `npm run build`

## Next Steps

- Reviewer should use the ingest metadata exposed above when validating the proof package in `/admin/normalized` and `/admin/review`. For this slice to be accepted, the recorded ingest command, the recorded normalized candidate with its `ingestRequestId`, and the queued review entry with the same `ingestRunId` must all exist together.
