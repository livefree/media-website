# Reviewer Acceptance: Launch Validation And Runtime Proof / Slice 1

## Verdict

Accepted: the combined planner, media-ingest, and data-catalog work now produces a real provider intake run that surfaces the ingest metadata through `/admin/normalized` and into `/admin/review`, so the operator-visible proof path is complete and repeatable.

## Acceptance Basis

- The planner handoff for this slice ([docs/handovers/planner-launch-validation-runtime-proof-slice1.md](/Users/livefree/projects/media-website-v2/docs/handovers/planner-launch-validation-runtime-proof-slice1.md)) specifies real provider execution evidence rooted in `jszyapi_vod_json`, and the candidate now points at the mandated `https://jszyapi.com/api.php/provide/vod/from/jsm3u8/at/json` endpoint, matching the intake command the review repeated before merge.
- The data-catalog work exposes the ingest trace metadata (`ingestRunId`, `ingestJobId`, `ingestRequestId`, `ingestActorId`, and lifecycle timestamps) on both normalized candidates and review queue entries, so operators can trace a queued item back to the real ingest run without touching the database manually. Those fields are documented in [docs/handovers/data-catalog-launch-validation-runtime-proof-slice1.md](/Users/livefree/projects/media-website-v2/docs/handovers/data-catalog-launch-validation-runtime-proof-slice1.md).
- Evidence gathered during review: a real ingest run recorded the provider, request/actor IDs, and checkpoint positions and is documented in [docs/handovers/data-catalog-launch-validation-runtime-proof-slice1.md](/Users/livefree/projects/media-website-v2/docs/handovers/data-catalog-launch-validation-runtime-proof-slice1.md) plus the dev-log entry recorded below.

## Tests & Builds

- `node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/admin/service.test.ts` (passes; emits existing MODULE_TYPELESS_PACKAGE_JSON warnings because the project is not yet marked as `type: "module"`).
- `npm run test:provider-ingest` (passes with the usual module-type warnings from the ingest tests and info logs showing jszyapi page refresh/probe execution).
- `npm run build` (Next.js production build succeeds with no lint or type errors and lists the admin/normalized, admin/review, and admin/workflow routes that host the operator proof path).

## Reviewer Notes

- The normalized candidate queue action and review list still rely solely on the tracked backend contracts, and every step can be replayed by rerunning the documented ingest command. No manual database edits or UI surface patches were required.
- This acceptance satisfies the slice checklist: real intake executed, normalized candidate produced, candidate queued for review, proof path documented, and tests/builds recorded. The new docs and dev-log entry below capture that evidence.
