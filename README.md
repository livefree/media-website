# Media Catalog Demo (Codex Multi-Agent Project)

Current project version: `0.7.0`

This project demonstrates how to recreate the **front‑end information architecture of a media catalog website**
using Codex with a multi‑agent workflow.

The goal is **UI + information architecture replication only**, not content aggregation or scraping.

Versioning follows the project rules in [docs/versioning.md](/Users/livefree/projects/media-website-v2/docs/versioning.md).

## Goals

Reproduce the following structure:

- Homepage with media grid
- Category pages (movie / series / anime)
- Search page
- Media detail page
- Player shell page

## Tech Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS

## How the Project is Organized

Agents work in parallel using the following responsibilities:

| Agent | Responsibility |
|------|---------------|
| Planner | project architecture |
| UI Shell | layout and styling |
| Data Catalog | media schema and dataset |
| Media Ingest | local library scanning and staging manifests |
| Search Filter | search and filtering |
| Detail Player | detail page and player shell |
| Reviewer | layout and architecture audit |

## Coordinator Workflow

1. Read `task.md`
2. Update `docs/roadmap.md`
3. Assign tasks to sub-agents inside the Coordinator thread
4. Require each agent to branch from the latest `codex/coordinator-baseline`
5. Let each agent commit within its ownership scope
6. Integrate accepted work back into `codex/coordinator-baseline`
7. Use the refreshed integration branch as the base for the next dependent agent

## Agent Git Usage

Agents are expected to use git during execution, not only at the end.

- `codex/coordinator-baseline` is the integration branch for downstream work
- Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, and Reviewer are expected to run as Coordinator-managed sub-agents
- Each agent should work on its own `codex/*` branch
- Each agent branch should start from the latest integration branch state
- Each agent may run status, branch, add, and commit commands for its task
- Each agent should commit only files inside its ownership scope
- Every commit must use the shared format: `<type>(<agent-scope>): <summary>`
- The Coordinator remains responsible for merge order, integration timing, and preventing agents from branching from stale states

## Documentation

Important project documentation:

docs/
- roadmap.md
- architecture.md
- ui-reference.md
- dev-log.md
- handovers/

Agents must update **dev-log.md** after significant work.

## Local Ingest

The first local ingest pass is file-system only. It scans `import-video/`, groups files by title directory, runs `ffprobe` on video assets when available, and writes a deterministic staging manifest to `import-data/`.
