# Planner Handoff: Operator Workflow Console / Slice 3

Active slice: `Operator Workflow Console / Slice 3: Workflow Landing And Cross-Surface Summary`

## Problem Statement

After Slice 2, operators can see pending normalized candidates (`/admin/normalized`) and the review queue (`/admin/review`), but the workflow is still fragmented:
- Each admin route (catalog, sources, repair, queue failures, launch validation, recovery readiness, moderation, manual submissions) renders in isolation, so operators must click each tab to understand the pipeline state.
- There is no single view answering “What is currently waiting for intake? What is in review? Are there repairs or launch blockers?” which makes incident triage and daily operation slower.
- Operators cannot tell at a glance whether pending normalized items exist, whether review is progressing, whether published catalog has red flags, or whether source health is degraded, without manually opening multiple pages.

This slice must provide one landing surface that summarizes the ingest -> normalized -> review -> catalog -> source-health state and links directly into the existing admin pages.

## Scope

1. **Backend summary contract**: Add an admin service method that aggregates the latest state for:
   - pending normalized candidates (count + CTA)
   - review queue (pending + total)
   - published catalog alerts (e.g., titles needing attention)
   - source inventory / repair / queue failures summary
   - launch validation / recovery readiness status
2. **Operator landing page**: Create `/admin/workflow` (or equivalent) that shows the summary cards, status pills, and CTA links into the existing admin surfaces.
3. **Cross-surface links**: Each summary card must link to its detailed admin route (`/admin/normalized`, `/admin/review`, `/admin/catalog`, `/admin/sources`, `/admin/repair`, `/admin/queue-failures`, `/admin/final-launch-validation`, `/admin/recovery-readiness`).
4. **State freshness**: Use backend contracts only; no ad hoc DB access from React components.

## Ownership Boundaries

- **Media Ingest**: *Skipped*. No new ingest telemetry is needed; the slice consumes existing summary data.
- **Data Catalog**
  - Add an admin landing summary contract (e.g., `getAdminWorkflowLandingSummary`) inside `lib/server/admin/service.ts` that reuses existing provider functions (`listPendingNormalizedCandidates`, `listReviewQueue`, `getAdminPublishedCatalogPage`, `listAdminSourceInventory`, `listAdminRepairQueue`, `listAdminQueueFailures`, `getRecoveryReadiness`, `getFinalLaunchValidation`).
  - Add supporting types in `lib/server/admin/types.ts`.
  - Add helper summary builders and tests in `lib/server/admin/service.test.ts`.
- **UI Shell**
  - Add `/admin/workflow` route (or rename consistent with nav) and navigation entry in `AdminOperatorNav`.
  - Render summary cards with status pills, counts, and CTA links.
  - Ensure empty and backend-unavailable states are clear.
  - Add render/helper tests (e.g., `components/admin/AdminWorkflowLandingPage.render.test.ts`).
- **Reviewer**
  - Verify backend uses existing contracts, no ad hoc queries.
  - Validate UI shows the summaries, links to each admin page, and handles error/empty states.
  - Confirm acceptance checklist items are satisfied.

## Non-goals

- No backend architecture or system-design changes.
- No new provider ingest telemetry.
- No public-site or player redesign.
- No auth/session expansion.
- No new workflow naming system beyond Project Frame + active slice.

## Execution Order

1. Planner (this document).
2. Data Catalog.
3. UI Shell.
4. Reviewer.
5. Coordinator merge/version push.

## Media Ingest Participation

Media Ingest is **not required** for this slice. If a future slice needs ingest metrics beyond existing contracts, scope it separately.

## Acceptance Checklist (must match `task.md`)

1. Docs aligned (Project Frame, roadmap, architecture, backend workflow).
2. Planner handoff exists (this document).
3. Ownership respected.
4. Artifact delivered: one landing view that summarizes the current pipeline state.
5. Artifact delivered: landing view links coherently into intake, review, catalog, source health, and launch validation surfaces.
6. Artifact delivered: landing-page data uses tracked backend contracts (no route-local ad hoc state).
7. Artifact delivered: landing page reuses existing admin capabilities (no duplicate workflow silos).
8. Tests/builds recorded by implementing agents.
9. Reviewer acceptance recorded.
10. Dev-log updated.
11. Coordinator records version decision.

## Required Tests / Builds

- `npm run test -- lib/server/admin/service.test.ts`
- `node --test components/admin/AdminWorkflowLandingPage.render.test.ts` (or equivalent render helper)
- `npm run build`

Additional focused tests should be added if Data Catalog introduces helper utilities for summary math.

## Advancing the Operator Flow

This slice provides visibility across the full operator path:
- Intake state: pending normalized candidates count and CTA.
- Review progress: pending vs. total queue entries.
- Catalog readiness: highlight published catalog or moderation alerts.
- Source health: surface degraded/broken counts, repair backlog, queue failures.
- Launch guardrails: show recovery readiness and final launch validation at a glance.

With this landing view, operators no longer need to manually inspect each admin route; they can start from `/admin/workflow`, understand the current state, and jump to the route that requires action. This completes the operator-visible ingest-to-publish flow for the current stage.
