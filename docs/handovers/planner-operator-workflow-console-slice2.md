# Planner Handoff: Operator Workflow Console / Slice 2

Active slice: `Operator Workflow Console / Slice 2: Queue Entry Actions And Review Handoff`

## Problem Statement

Operators can open `/admin/review` and see the review queue, but they cannot see normalized candidates that have not yet been queued, nor can they queue them without leaving the product. Evidence:

- [components/admin/AdminReviewQueuePage.tsx](/Users/livefree/projects/media-website-v2/components/admin/AdminReviewQueuePage.tsx#L66) explicitly renders “No review queue entries are available yet. Queue normalized candidates before review.” without providing any workflow to do so.
- `queueNormalizedCandidateForReview` already exists at [lib/server/review/service.ts](/Users/livefree/projects/media-website-v2/lib/server/review/service.ts#L390), yet no admin surface calls it.
- Admin services in [lib/server/admin/service.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.ts) expose moderation, manual submissions, repair queues, and catalog surfaces, but there is no endpoint for pending normalized candidates or for queueing them.

Result: normalized -> review handoff is opaque, so the backend workflow remains incomplete from an operator perspective.

## Scope

1. Surface normalized candidates that are not yet attached to review queue entries, including duplicate/match summaries.
2. Provide a privileged operator action that calls `queueNormalizedCandidateForReview` with actor/request metadata.
3. Link queued items into `/admin/review` so operators can continue without guessing IDs.
4. Keep all data behind existing admin access controls; no public/API exposure.

## Ownership Boundaries

- **Media Ingest**: *Not required.* This slice consumes existing normalized candidate data; no new ingest visibility is needed.
- **Data Catalog**
  - Extend `lib/db/repositories/normalization` to query normalized candidates with no associated review queue entry.
  - Add admin-facing contracts in `lib/server/admin/service.ts` (and supporting types) to read those candidates and to invoke `queueNormalizedCandidateForReview`.
  - Ensure repository queries stay behind privileged access and return the same candidate summary fields already used in the review queue.
- **UI Shell**
  - Add a new admin surface (e.g., `/admin/intake` or `/admin/normalized`) and navigation entry in `AdminOperatorNav` showing pending normalized candidates.
  - Render per-candidate cards with duplicate/match/alias counts, staged metadata, and a “Queue for review” action wired to the backend contract.
  - Add contextual links to `/admin/review` once an item is queued, and optionally highlight recently queued items inside the review page.
- **Reviewer**
  - Validate backend contracts stay within existing access boundaries.
  - Confirm UI shows pending candidates, queue actions work, and cross-links direct operators into `/admin/review`.
  - Ensure acceptance checklist items in `task.md` are met.

## Non-goals

- No backend architecture or system-design changes.
- No new provider ingest telemetry or scheduling work.
- No public-route, player, or auth/session changes.
- No new workflow naming systems beyond the existing Project Frame + active slice.

## Execution Order

1. Planner (this doc).
2. Data Catalog.
3. UI Shell.
4. Reviewer.
5. Coordinator merge/version push.

## Media Ingest Participation

Media Ingest is *skipped* for this slice. If a later slice needs ingest visibility widgets, it must be scoped there.

## Acceptance Checklist (must match `task.md`)

1. Docs aligned (Project Frame, roadmap, architecture, backend workflow).
2. Planner handoff exists.
3. Ownership respected.
4. Operators can see normalized candidates that are not yet in review.
5. Operators can queue a normalized candidate for review through the UI.
6. After queueing, `/admin/review` reflects the entry and cross-links remain coherent.
7. Workflow visibility uses tracked backend contracts, not ad hoc route logic.
8. Tests/builds recorded by implementing agents.
9. Reviewer acceptance recorded.
10. Dev-log updated.
11. Coordinator records version decision.

## Required Tests / Builds

- `npm run test -- lib/server/admin/service.test.ts`
- `npm run test -- components/admin/AdminReviewQueuePage.render.test.ts` (update or add render coverage for the new surface)
- `npm run build`

## Follow-up (Slice 3 Implications)

Slice 3 (“Workflow Landing And Cross-Surface Summary”) will consume the new normalized/queued/published signals provided here to render a single workflow landing view. Therefore:

- Data Catalog should structure the new admin contract so Slice 3 can reuse summaries without duplicating queries.
- UI Shell should keep styles/components modular so the landing page can pull metrics (counts, CTA links) without duplicate markup.
