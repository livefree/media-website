# Current Slice Execution

`task.md` is the only execution entry for current work.

Persistent program context lives in:

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)

## Active Slice

`Launch Validation And Runtime Proof / Slice 1: Real Intake To Review Queue Validation`

## Why This Slice Exists

The operator workflow console is now complete enough for navigation, but the system still needs proof that real provider-backed intake creates reviewable items through the visible admin workflow. This slice exists to validate the intake -> normalized -> review queue path against real data instead of only fixture-backed contracts.

## Inputs

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md)
- [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)
- accepted operator workflow console surfaces, including `/admin/normalized`, `/admin/review`, and `/admin/workflow`
- real provider ingest path and local database environment already established
- existing backend contracts for staging, normalization, review queue, and admin workflow surfaces
- planner handoff for this slice: `to be added before implementation`

## Outputs

- one repeatable operator-visible proof path showing real intake data appear before review
- evidence that normalized candidates created from real provider intake can be queued into `/admin/review`
- reviewer acceptance or findings anchored to real runtime proof, not only fixture coverage
- reviewer acceptance or findings document for this slice
- `docs/dev-log.md` entry recording scope and outcome

## Ownership And Order

1. Coordinator aligns this slice to the Project Frame and dispatches in order.
2. Planner defines scope, checklist, ownership boundaries, and non-goals.
3. Media Ingest implements real-intake execution or bounded tooling support required by the proof path.
4. Data Catalog implements any backend support required to surface proof-state transitions through existing contracts.
5. UI Shell participates only if planner identifies a missing operator-visible step in the proof path.
6. Reviewer validates the slice against the checklist and confirms no architecture drift.
7. Coordinator merges only after reviewer acceptance.

## Acceptance Checklist

- [ ] Docs aligned: Project Frame, roadmap, architecture, and backend workflow checked before implementation
- [ ] Handoff published: planner handoff exists for this slice
- [ ] Ownership respected: each agent changes only its owned files
- [ ] Artifact delivered: a real provider-backed intake run produces operator-visible normalized candidates
- [ ] Artifact delivered: operators can move at least one real candidate into `/admin/review` through the product workflow
- [ ] Artifact delivered: the proof path is documented and repeatable from the current environment
- [ ] Artifact delivered: runtime proof uses tracked backend and admin contracts, not ad hoc DB edits
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
