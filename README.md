# Media Catalog Demo (Codex Multi-Agent Project)

This project demonstrates how to recreate the **front‑end information architecture of a media catalog website**
using Codex with a multi‑agent workflow.

The goal is **UI + information architecture replication only**, not content aggregation or scraping.

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
| Search Filter | search and filtering |
| Detail Player | detail page and player shell |
| Reviewer | layout and architecture audit |

## Coordinator Workflow

1. Read `task.md`
2. Update `docs/roadmap.md`
3. Assign tasks to agents
4. Let each agent work in its own git branch and commit within its ownership scope
5. Integrate results

## Agent Git Usage

Agents are expected to use git during execution, not only at the end.

- Each agent should work on its own `codex/*` branch
- Each agent may run status, branch, add, and commit commands for its task
- Each agent should commit only files inside its ownership scope
- Every commit must use the shared format: `<type>(<agent-scope>): <summary>`
- The Coordinator remains responsible for merge order and cross-agent integration

## Documentation

Important project documentation:

docs/
- roadmap.md
- architecture.md
- ui-reference.md
- dev-log.md
- handovers/

Agents must update **dev-log.md** after significant work.
