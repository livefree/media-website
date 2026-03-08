# AGENTS.md

Defines how Codex agents collaborate in this repository.

## Agent Roles

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

Media Ingest

- Scans local media library drop folders
- Builds deterministic staging manifests
- Captures local technical metadata before enrichment

Search Filter

- Implements query parameter search
- Filtering and pagination

Detail Player

- Detail page
- Player shell

Reviewer

- Reviews layout consistency
- Does not change architecture

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
- All module agents are coordinated as sub-agents under the Coordinator thread by default. Users do not need to manage separate agent threads for Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer.
- Agents may use git directly during execution for branch, status, staging, and commit workflows within their assigned scope.
- All agent branches must be cut from the latest Coordinator integration branch, not from stale personal branches.
- Coordinator should merge or otherwise integrate accepted agent work back into the integration branch before assigning the next dependent task.
- If multiple agents may touch shared files or adjacent surfaces, Coordinator must define execution order before work begins.

## Git Workflow

Coordinator integration branch:

`codex/coordinator-baseline`

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

- Do not commit directly to main
- Each agent branch must start from the latest `codex/coordinator-baseline`
- Each agent may run `git status`, create or switch to its own branch, stage changes, and create commits during its task
- Each agent commits only files within its ownership scope
- Each agent should make small, task-scoped commits with clear messages
- Agents must not rewrite history, force-push, or modify another agent's branch unless explicitly directed by the Coordinator
- Accepted work should be integrated back into `codex/coordinator-baseline` before the next dependent agent starts
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

1. `git switch codex/coordinator-baseline`
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
2. integrate accepted work into `codex/coordinator-baseline`
3. verify the integration branch is the new source for downstream work
4. only then assign the next dependent agent task
