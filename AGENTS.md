# AGENTS.md

Defines how Codex agents collaborate in this repository.

## Agent Roles

The role definitions below are authoritative. Each agent must keep a single primary responsibility and should not absorb adjacent responsibilities just because context is available.

Coordinator

- Owns task definition, agent sequencing, merge order, and acceptance flow
- May update coordination docs such as `AGENTS.md`, `task.md`, and handoff notes
- Must NOT directly implement files owned by specialist agents unless the user explicitly authorizes an exception

Planner

- Defines architecture
- Produces project tree
- Defines milestones
- Does NOT implement UI

UI Shell

- Builds layout
- Navbar, search area, filter bar
- Poster grid and responsive layout

Data Catalog

- Defines MediaItem type
- Generates mock dataset

Backend-phase reinterpretation:
- Owns canonical catalog backend
- Owns Prisma evolution, repositories, published catalog reads, shared backend contracts, and search inputs

Media Ingest

- Scans local media library drop folders
- Builds deterministic staging manifests
- Captures local technical metadata before enrichment

Backend-phase reinterpretation:
- Owns provider adapters, raw payload capture, ingest jobs, checkpoints, staging models, and normalization inputs

Search Filter

- Implements query parameter search
- Filtering and pagination

Backend-phase reinterpretation:
- Owns catalog-backed search/filter API integration and indexing behavior once public catalog serving moves off seed-backed route-local logic

Detail Player

- Detail page
- Player shell

Backend-phase reinterpretation:
- Owns detail/watch integration against published catalog and health-aware source state

Reviewer

- Reviews layout consistency
- Does not change architecture
- Validates against the active task acceptance checklist and calls out regressions before merge
- Owns runtime validation for interaction-heavy surfaces and may use browser QA tooling to verify real behavior before merge

Backend-phase reinterpretation:
- Expands into backend workflow acceptance, including staging isolation, review/publish rules, schema/contract drift, source health fallback behavior, and admin-flow acceptance

## Execution Framework

Project execution uses two layers only:

1. `Project Frame / Master Plan`
   - persistent project state
   - active stage
   - approved workstreams
   - target states
   - blockers
   - launch criteria
   - approved slice queue
   - source of truth: `docs/project-frame.md`
2. `Current Slice Execution`
   - active slice only
   - inputs
   - outputs
   - acceptance checklist
   - non-goals
   - completion recording
   - source of truth: `task.md`

`task.md` is the sole execution entry for current work. Long-lived context must live in `docs/project-frame.md`, not inside `task.md`.

## File Ownership

UI Shell

- app/
- components/
- styles/

Data Catalog

- data/
- types/
- lib/media\*

Media Ingest

- scripts/
- import-data/
- docs/handovers/ when ingest handoffs are needed
- package.json only for safe ingest script entries

Search Filter

- lib/search\*
- app/search

Detail Player

- app/media/
- components/player/
- components/detail/

Reviewer

- May propose changes but should not restructure files.

## Collaboration Rules

- Agents should not modify files owned by other agents unless required.
- Each task should document changes in docs/dev-log.md.
- Coordinator decides merge order.
- Coordinator defines the active slice in `task.md` before downstream implementation begins.
- All module agents are coordinated as sub-agents under the Coordinator thread by default. Users do not need to manage separate agent threads for Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer.
- Agents may use git directly during execution for branch, status, staging, and commit workflows within their assigned scope.
- All agent branches must be cut from the latest Coordinator integration branch, not from stale personal branches.
- Coordinator should merge or otherwise integrate accepted agent work back into the integration branch before assigning the next dependent task.
- If multiple agents may touch shared files or adjacent surfaces, Coordinator must define execution order before work begins.
- Planner may specify implementation order and acceptance criteria, but may not implement owned UI/player/detail files.
- Reviewer may audit current regressions and validate fixes, but may not become the implementing agent for detail-player scope.
- Detail Player may implement only `app/media/`, `components/player/`, `components/detail/`, plus brief `docs/dev-log.md` entries for its own work.
- Coordinator may inspect status, branches, and handoffs, but must not patch specialist-owned runtime defects directly.
- If reviewer runtime validation cannot be completed, the candidate must remain unmerged and cannot be represented as accepted.
- User visual/interaction review is authoritative for UI acceptance; a user-rejected candidate must be treated as failed and moved into a new refinement round instead of being argued from code inspection.
- Coordinator should function as dispatcher, synthesizer, and final decision-maker. Coordinator should not expand into universal design or implementation ownership when a specialist scope exists.
- New work must be framed as a slice that can be completed in one continuous execution chain. If a task cannot plausibly finish in one chain, Coordinator must split it before dispatch.
- `task.md` must use executable checklist items, not narrative-only acceptance prose.

## Stop / Ask-User Rule

Agents may stop and ask the user only when all of the following are true:

1. the active slice checklist cannot be completed from existing docs, code, or local environment
2. the blocker cannot be cleared autonomously inside the owning agent scope
3. two attempts to resolve the blocker have already failed for environmental or contradictory-requirement reasons

If those conditions are not all true, agents must continue execution.

When a real blocker does occur:

- Coordinator records it in `docs/dev-log.md`
- the active slice stays active in `task.md`
- no downstream agent should be dispatched as if the blocked slice were complete

Skill boundaries for interactive player work:
- Planner defines scope, acceptance criteria, and validation sequence only.
- Reviewer owns runtime QA and interactive browser validation for playback controls, overlays, and mode transitions.
- Detail Player implements playback/detail fixes only within owned files and does not self-sign off runtime acceptance.
- Coordinator sequences the above roles and merges only after reviewer acceptance.
- Detail Player should provide concrete claimed behavior changes tied to the active acceptance checklist; “build passed” alone is not evidence of UI acceptance.

Mandatory execution pattern for player/detail refinements:
1. Coordinator updates `task.md`
2. Planner defines implementation breakdown
3. Reviewer confirms the issue list, QA inventory, and acceptance checklist
4. Detail Player implements within owned scope
5. Reviewer validates in-browser before Coordinator merges
6. User review can still reject the candidate if the requested changes are not actually visible or working

## Git Workflow

Coordinator integration branch:

`main`

Each agent should work in its own branch.

Branch naming convention:

codex/planner-init
codex/ui-shell-homepage
codex/data-catalog
codex/media-ingest
codex/search-filter
codex/detail-player
codex/review-layout

Rules:

- Coordinator owns integration on `main`
- Each agent branch must start from the latest `main`
- Each agent may run `git status`, create or switch to its own branch, stage changes, and create commits during its task
- Each agent commits only files within its ownership scope
- Each agent should make small, task-scoped commits with clear messages
- Agents must not rewrite history, force-push, or modify another agent's branch unless explicitly directed by the Coordinator
- Accepted work should be integrated back into `main` before the next dependent agent starts
- Agents should not continue new task work on top of an outdated branch after the integration branch has moved
- Coordinator decides merge order
- Merge order usually follows:

planner
→ data
→ ui
→ search
→ detail
→ review

Commit message format:

`<type>(<agent-scope>): <summary>`

Allowed `type` values:
- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`

Required `agent-scope` values:
- `planner`
- `ui-shell`
- `data-catalog`
- `media-ingest`
- `search-filter`
- `detail-player`
- `reviewer`
- `coordinator`

Rules for commit messages:
- Use lowercase `type` and `agent-scope`
- Keep the summary short and task-specific
- One commit should represent one coherent change
- If a task spans multiple commits, every commit must still follow this format

Examples:

feat(ui-shell): build homepage shell
feat(data-catalog): add media dataset
feat(media-ingest): add local library scanner
feat(search-filter): connect query filters
fix(detail-player): adjust layout spacing
docs(coordinator): standardize agent git workflow

Suggested per-agent git loop:

1. `git switch main`
2. `git pull` if remote sync is part of the current workflow
3. `git status`
4. `git switch -c <agent-branch>` if the branch does not exist yet, otherwise recreate or refresh it from the latest integration branch as directed by the Coordinator
5. implement only within owned files
6. update `docs/dev-log.md`
7. `git add` only relevant files
8. `git commit -m "<message>"`
9. hand off branch name and commit summary to the Coordinator

Coordinator integration loop:

1. review the agent branch and confirm ownership boundaries were respected
2. integrate accepted work into `main`
3. verify the integration branch is the new source for downstream work
4. only then assign the next dependent agent task

## Backend Phase Workflow

Historical backend phases were completed as:

1. Round A: backend monolith foundation
2. Round B: provider adapter and staging schema
3. Round C: normalization and dedup pipeline
4. Round D: review and publish workflow
5. Round E: canonical catalog serving
6. Round F: source management and healthcheck

Active backend execution must now use only:

- `Phase N` for roadmap milestones in `docs/roadmap.md`
- `Workstream N / Slice M` for execution in `task.md`, handoffs, and reviewer acceptance

Do not invent new top-level naming systems beyond those two.

Backend execution context now follows the two-layer model:

- `docs/project-frame.md` holds the master plan and approved slice queue
- `task.md` holds only the active slice contract

Backend-phase workflow rules:

- Every external provider must enter through an adapter owned by `media-ingest`
- Every ingest flow must land in staging first
- No staged candidate becomes public without explicit review/publish logic
- Public browse/search/detail/watch must consume published catalog data only
- Source health and degradation state must be modeled before runtime fallback logic is considered complete
- `ui-shell` is no longer the default next step; it is pulled in only when operator/admin surfaces are required

## Versioning Rules

Current project version:

`0.31.1`

Versioning model:

- Use Semantic Versioning while the project is pre-launch.
- Until launch, treat the project as `0.x.y`.
- `0.x.0` marks a meaningful product or platform milestone and also absorbs breaking changes before `1.0.0`.
- `0.x.y` patch releases are for bug fixes, UI polish, docs/process updates, tooling updates, and other changes that do not redefine the project's milestone level.
- `1.0.0` is reserved for the first launch-ready release with real database-backed catalog flows, API boundary, auth/session model, production-capable playback/runtime, admin/content operations, and deployment/observability basics in place.

Coordinator requirements:

- The Coordinator owns the official version bump decision.
- When accepted work changes the project milestone level, the Coordinator must update the version before or during integration.
- The version source of truth is `package.json`, with matching updates in `package-lock.json`, `README.md`, `docs/versioning.md`, and `docs/dev-log.md` when a bump occurs.
- Agents must not silently change version numbers outside an explicitly assigned versioning task.
