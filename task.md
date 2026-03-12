# Current Slice Execution

`task.md` is the only execution entry for current work.

Persistent program context lives in:

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)

## Active Slice

`Execution Framework Reconstruction / Slice 1: Dual-Layer Execution Model`

## Why This Slice Exists

The project has accepted backend foundations, but the execution framework still mixes persistent project state with active-slice state. This slice exists to make the workflow lower-overhead and more deterministic before the next operator-facing program resumes.

## Inputs

- [docs/project-frame.md](/Users/livefree/projects/media-website-v2/docs/project-frame.md)
- [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/architecture.md](/Users/livefree/projects/media-website-v2/docs/architecture.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)
- current coordination docs and handover indexing rules
- planner handoff for this slice:
  [docs/handovers/planner-execution-framework-reconstruction.md](/Users/livefree/projects/media-website-v2/docs/handovers/planner-execution-framework-reconstruction.md)

## Outputs

- `docs/project-frame.md` as the persistent master-plan layer
- reduced `task.md` that contains only the active slice contract
- tightened stop/ask rule and coordinator-scope rules in coordination docs
- reviewer acceptance or findings document for this slice
- `docs/dev-log.md` entry recording scope and outcome

## Ownership And Order

1. Coordinator aligns this slice to the Project Frame and dispatches in order.
2. Planner defines scope, checklist, and non-goals.
3. Reviewer validates that the workflow changes do not alter backend architecture or system design.
4. Coordinator merges only after reviewer acceptance.

## Acceptance Checklist

- [ ] Docs aligned: Project Frame, roadmap, architecture, and backend workflow checked before implementation
- [ ] Handoff published: planner handoff exists for this slice
- [ ] Ownership respected: each agent changes only its owned files
- [ ] Artifact delivered: `docs/project-frame.md` defines product goal, current stage, workstreams, blockers, milestones, launch criteria, and approved slice queue
- [ ] Artifact delivered: `task.md` contains current slice only and no longer carries full historical program state
- [ ] Artifact delivered: stop/ask-user rule is explicit and strict in coordination docs
- [ ] Artifact delivered: coordinator role is limited to dispatch + synthesis + merge decision in coordination docs
- [ ] Artifact delivered: acceptance criteria are expressed as executable checklist items
- [ ] Tests/checks run and recorded as appropriate for docs/process work
- [ ] Reviewer acceptance recorded before merge
- [ ] Dev-log updated
- [ ] Version decision recorded by Coordinator

## Non-Goals

- no backend architecture changes
- no system design changes
- no runtime feature work
- no public/admin UI expansion in this slice
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
