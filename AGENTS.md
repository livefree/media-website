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
- Agents may use git directly during execution for branch, status, staging, and commit workflows within their assigned scope.

## Git Workflow

Each agent should work in its own branch.

Branch naming convention:

codex/planner-init
codex/ui-shell-homepage
codex/data-catalog
codex/search-filter
codex/detail-player
codex/review-layout

Rules:

- Do not commit directly to main
- Each agent may run `git status`, create or switch to its own branch, stage changes, and create commits during its task
- Each agent commits only files within its ownership scope
- Each agent should make small, task-scoped commits with clear messages
- Agents must not rewrite history, force-push, or modify another agent's branch unless explicitly directed by the Coordinator
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
feat(search-filter): connect query filters
fix(detail-player): adjust layout spacing
docs(coordinator): standardize agent git workflow

Suggested per-agent git loop:

1. `git status`
2. `git switch -c <agent-branch>` if the branch does not exist yet, otherwise `git switch <agent-branch>`
3. implement only within owned files
4. update `docs/dev-log.md`
5. `git add` only relevant files
6. `git commit -m "<message>"`
7. hand off branch name and commit summary to the Coordinator
