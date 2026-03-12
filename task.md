# Current Slice Execution

`task.md` is the only execution entry for current work.

Persistent program context lives in:

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)

## Active Slice

`Operator Workflow Console / Slice 2: Queue Entry Actions And Review Handoff`

## Why This Slice Exists

The backend is accepted as operator-ready and the execution framework has been normalized, but operators still cannot see or perform the transition from normalized candidates into the review queue. This slice exists to make that handoff visible and operator-actionable.

## Inputs

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md)
- [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)
- existing backend contracts for ingest, normalization, review, admin catalog, source health, and launch validation
- current admin routes and their current empty/opaque workflow gaps
- planner handoff for this slice: `to be added before implementation`

## Outputs

- operator-visible entry points for normalized candidates before review
- explicit operator action to queue normalized candidates for review
- coherent linkage from normalized state into `/admin/review`
- reviewer acceptance or findings document for this slice
- `docs/dev-log.md` entry recording scope and outcome

## Ownership And Order

1. Coordinator aligns this slice to the Project Frame and dispatches in order.
2. Planner defines scope, checklist, ownership boundaries, and non-goals.
3. Media Ingest implements only ingest-side visibility or intake support required by the slice.
4. Data Catalog implements backend read models, queueing contracts, and admin-service support required by the slice.
5. UI Shell implements the operator-facing admin workflow surfaces and navigation.
6. Reviewer validates the slice against the checklist and confirms no architecture drift.
7. Coordinator merges only after reviewer acceptance.

## Acceptance Checklist

- [ ] Docs aligned: Project Frame, roadmap, architecture, and backend workflow checked before implementation
- [ ] Handoff published: planner handoff exists for this slice
- [ ] Ownership respected: each agent changes only its owned files
- [ ] Artifact delivered: operators can see normalized candidates that are not yet in review
- [ ] Artifact delivered: operators have a bounded action to queue a normalized candidate for review
- [ ] Artifact delivered: after queueing, the handoff into `/admin/review` is visible and coherent
- [ ] Artifact delivered: workflow visibility uses tracked backend contracts, not route-local ad hoc state
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
