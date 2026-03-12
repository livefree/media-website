# Planner Handoff: Execution Framework Reconstruction

## Current-state diagnosis vs user guardrails
- **Single-responsibility agents**: `AGENTS.md` still maps each agent to a single scope, but backend reinterpretations are mixed into prose instead of a persistent authoritative table. Result: mostly satisfied, yet easy to drift because responsibilities are defined in prose only.
- **`task.md` as sole execution entry**: the file currently embeds both backlog history and the active slice, while other docs (e.g. backend workflow) also dictate queue state. This dilutes the "single entry" requirement.
- **Stop-to-ask discipline**: no document describes when agents must pause; practice relies on ad hoc coordinator judgment. Requirement not satisfied.
- **Executable acceptance checklists**: historic planner handoffs include checklists, but `task.md` acceptance criteria are narrative paragraphs rather than checklist-ready bullets. Requirement partially met.
- **Coordinator as dispatcher/synthesizer**: coordinator tasks still include long-form reasoning and impromptu replanning. There is no doc enforcing that coordinator only dispatches/merges. Requirement not enforced.
- **Large tasks split into single-run slices**: backend phases were delivered via workstreams/slices, but new operator workflow work is currently described only as a narrative block in `task.md`. Requirement partially satisfied, needs explicit slice queue for the new program.

## Missing execution layers
1. **Persistent Project Frame** — there is no living doc that defines the master objectives, workstreams, launch criteria, or blockers that span slices.
2. **Execution-layer separation** — `task.md` currently mixes history, baselines, and active scope instead of referencing a master frame for context and isolating the current slice.
3. **Explicit stop/ask policy** — none of the docs spell out when agents may pause for user input; this creates ad hoc interruptions.
4. **Checklist template** — acceptance criteria are textual; we need a reusable checklist form.

## Project Frame / Master Plan blueprint
Create `docs/project-frame.md` owned by Coordinator+Planner that is updated whenever the master state changes.
Contents:
- **Product goal** summary and current release target.
- **Stage** and rationale (e.g., "Operator workflow console build-out").
- **Workstream table** with: name, objective, owner agents, exit criteria, blockers.
- **Milestone & launch criteria** referencing docs/roadmap and backend-delivery-workflow.
- **Stop/ask gate** (when human decision required) and escalation path.
- **Persistent slice queue** listing approved slices in order with status (pending/active/done).
- **Version alignment** showing which version satisfied each milestone.
This doc becomes Layer 1: Project Frame / Master Plan.

## Current Slice Execution layer
`task.md` becomes Layer 2. After the change it must only contain:
- pointer to Project Frame (`docs/project-frame.md`).
- current slice name, scope, and motivation.
- explicit inputs (docs, data, dependent slices).
- explicit outputs (artifacts, UI surfaces, state updates).
- executable acceptance checklist referencing the template below.
- non-goals.
- stop/ask instructions specific to the slice.
- logging requirement (where to record completion, e.g., docs/dev-log).
The historical backlog and queue will live in the Project Frame, not `task.md`.

## Required doc changes
1. **`docs/project-frame.md` (new)** — authoritative layer for goals, workstreams, queue, launch criteria, escalation points.
2. **`task.md` (update)** — shrink to current slice execution contract referencing the Project Frame.
3. **`docs/backend-delivery-workflow.md` (update)** — add a short section pointing to the new two-layer model and clarifying that backend workflow completion now feeds into the Project Frame rather than being re-listed there.
4. **`docs/dev-log.md`** — continue capturing slice completions; note the introduction of the new execution framework.
No other runtime or architecture docs change.

## Stop/ask-user policy
Agents may stop and ask the user only when **all** of the following hold:
1. The active slice’s acceptance checklist cannot be satisfied due to missing or contradictory requirements.
2. The Project Frame lists a blocker that cannot be cleared autonomously.
3. Two consecutive attempts to fetch required local resources or run required commands have failed for environmental reasons outside the agent’s control.
In every other case, agents must continue execution using the documented plan. Coordinators summarize blockers in `docs/dev-log.md` when these conditions are hit.

## Acceptance checklist template
Every slice entry in `task.md` must present a checklist with the following headings (items may expand with sub-bullets, but completion is binary):
1. **Docs aligned** – Project Frame, roadmap, and architecture cross-checked.
2. **Handoff published** – planner+reviewer docs exist for the slice.
3. **Ownership respected** – only the assigned agents touched owned files.
4. **Artifact delivered** – required UI/backend/admin artifacts exist and are linked.
5. **Tests/builds run** – required commands executed, outputs noted.
6. **Reviewer acceptance** – reviewer doc approving or listing findings.
7. **Dev-log updated** – entry under current date summarizing scope.
8. **Version decision** – coordinator records whether version bump occurred.

## Non-goals
- No backend architecture redesign.
- No system design changes or new runtime features beyond workflow visibility.
- No auth/session overhauls, product roadmap additions, or public UI redesign.
- No automation of ingest-to-review without the manual visibility surfaces defined in the new program.

