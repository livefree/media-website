# Current Slice Execution

`task.md` is the only execution entry for current work.

Persistent program context lives in:

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)

## Active Slice

`Operator Workflow Console / Slice 3: Workflow Landing And Cross-Surface Summary`

## Why This Slice Exists

Operators can now see pending normalized candidates and queue them into review, but the operator workflow is still fragmented across separate admin pages. This slice exists to provide one landing view that summarizes the current pipeline state and gives operators coherent links into intake, review, catalog, source health, and launch validation.

## Inputs

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md)
- [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)
- accepted Slice 2 backend and UI contracts for pending normalized candidates and review handoff
- existing admin routes for review, catalog, sources, repair, queue failures, recovery readiness, and final launch validation
- planner handoff for this slice: `to be added before implementation`

## Outputs

- one operator landing page summarizing intake, review, catalog, source health, and launch validation state
- coherent cross-links into the existing admin surfaces
- reusable summary contracts that avoid duplicating route-local logic
- reviewer acceptance or findings document for this slice
- `docs/dev-log.md` entry recording scope and outcome

## Ownership And Order

1. Coordinator aligns this slice to the Project Frame and dispatches in order.
2. Planner defines scope, checklist, ownership boundaries, and non-goals.
3. Media Ingest participates only if planner determines an ingest summary contract is missing.
4. Data Catalog implements backend summary/read-model support required by the landing page.
5. UI Shell implements the operator-facing landing surface and cross-links.
6. Reviewer validates the slice against the checklist and confirms no architecture drift.
7. Coordinator merges only after reviewer acceptance.

## Acceptance Checklist

- [ ] Docs aligned: Project Frame, roadmap, architecture, and backend workflow checked before implementation
- [ ] Handoff published: planner handoff exists for this slice
- [ ] Ownership respected: each agent changes only its owned files
- [ ] Artifact delivered: operators have one landing view that summarizes the current pipeline state
- [ ] Artifact delivered: the landing view links coherently into intake, review, catalog, source health, and launch validation surfaces
- [ ] Artifact delivered: landing-page data uses tracked backend contracts, not route-local ad hoc state
- [ ] Artifact delivered: the landing page reuses existing admin capabilities rather than recreating them in a new workflow silo
- [ ] Tests/builds run and recorded by implementing agents
- [ ] Reviewer acceptance recorded before merge
- [ ] Dev-log updated
- [ ] Version decision recorded by Coordinator

## Non-Goals

- no backend architecture changes
- no system design changes
- no public-route redesign
- no player work
- no broad auth/session expansion
- no new top-level workflow naming system
- no ad hoc roadmap expansion

## Stop / Ask-User Rule For This Slice

Agents may stop and ask the user only if all of the following are true:

1. the acceptance checklist cannot be satisfied from existing docs, code, or environment
2. the blocker cannot be cleared autonomously in owned scope
3. two attempts to resolve the blocker have already failed

Otherwise execution must continue.

## Completion Recording

When this slice is accepted:

1. reviewer acceptance is added to `docs/handovers/`
2. coordinator records the result in `docs/dev-log.md`
3. coordinator updates versioned docs if the milestone level changed
4. coordinator advances the next active slice from `docs/project-frame.md`
