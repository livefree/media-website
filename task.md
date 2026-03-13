# Current Slice Execution

`task.md` is the only execution entry for current work.

Persistent program context lives in:

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)

## Active Slice

`Launch Validation And Runtime Proof / Slice 5: Publish To Public Runtime Verification`

## Why This Slice Exists

Slice 4 proved real provider intake can produce normalized candidates and queue entries in `/admin/review`. The remaining launch-proof gap is public visibility: operators must be able to publish a reviewed entry and verify that the same title appears on public browse/search/detail/watch surfaces through canonical published-catalog contracts.

## Inputs

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md)
- [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)
- accepted Slice 4 artifacts, including real intake proof and ingest-trace metadata on `/admin/normalized` and `/admin/review`
- operator/admin routes for review and publish actions
- public runtime routes (`/`, `/search`, `/media/[slug]`, `/watch/[watchId]`) backed by published catalog contracts
- planner handoff for this slice: `to be added before implementation`

## Outputs

- one repeatable operator-visible proof path from reviewed queue entry to published public visibility
- evidence that a queued real-intake candidate is published through product workflow and appears in public runtime
- reviewer acceptance or findings anchored to real runtime proof, not only fixture coverage
- reviewer acceptance or findings document for this slice
- `docs/dev-log.md` entry recording scope and outcome

## Ownership And Order

1. Coordinator aligns this slice to the Project Frame and dispatches in order.
2. Planner defines scope, checklist, ownership boundaries, and non-goals.
3. Data Catalog implements any backend support required to preserve ingest-to-publish traceability and published runtime visibility through existing contracts.
4. Search Filter and Detail Player participate only if planner identifies public runtime gaps that block proof capture.
5. UI Shell participates only if planner identifies a missing operator-visible step in admin or public proof surfaces.
6. Reviewer validates the slice against the checklist and confirms no architecture drift.
7. Coordinator merges only after reviewer acceptance.

## Acceptance Checklist

- [ ] Docs aligned: Project Frame, roadmap, architecture, and backend workflow checked before implementation
- [ ] Handoff published: planner handoff exists for this slice
- [ ] Ownership respected: each agent changes only its owned files
- [ ] Artifact delivered: at least one real-intake-backed review entry is published through tracked admin workflow
- [ ] Artifact delivered: the published item is visible from public runtime surfaces without direct DB edits
- [ ] Artifact delivered: review/publish/public proof path is documented and repeatable from the current environment
- [ ] Artifact delivered: runtime proof uses tracked backend and admin contracts, not ad hoc DB edits
- [ ] Tests/builds run and recorded by implementing agents
- [ ] Reviewer acceptance recorded before merge
- [ ] Dev-log updated
- [ ] Version decision recorded by Coordinator

## Non-Goals

- no backend architecture changes
- no system design changes
- no public-route redesign
- no playback-control redesign
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
