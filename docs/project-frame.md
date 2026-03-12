# Project Frame

This document is the persistent execution layer for the project.

It defines the long-lived frame that survives across slices:

- product goal
- current stage
- master workstreams
- milestone state
- blockers
- launch criteria
- approved slice queue

`task.md` is the execution entry for the active slice only. It should not repeat full project history.

## Product Goal

Build a lawful streaming-style media aggregation platform with:

- public browse, search, watch, and list surfaces
- operator-visible intake, normalization, review, publish, and source-maintenance workflows
- stable published catalog serving and health-aware playback resolution

## Current Stage

`Stage: Execution Framework Hardening`

Why this is the current stage:

- the tracked backend program is already accepted as operator-ready under the previously agreed backend scope
- the immediate gap is execution governance, not backend architecture or system design
- current docs still mix master-plan state and active-slice state, which increases coordination overhead and encourages step-by-step replanning

## Master Workstreams

| Workstream | Status | Goal State | Primary Agents | Blocking Conditions |
| --- | --- | --- | --- | --- |
| Public Runtime Shell | Active maintenance | Public browse/search/watch surfaces remain stable while backend/operator work continues | `ui-shell`, `search-filter`, `detail-player`, `reviewer` | User-reported regressions that block testing |
| Backend Operator-Ready Core | Complete | Provider intake, staging, normalization, review/publish, published catalog serving, source health, and admin operations are accepted under tracked scope | `planner`, `media-ingest`, `data-catalog`, `ui-shell`, `reviewer` | Closed |
| Execution Framework Governance | Active | Master plan, active slice, stop/ask policy, checklist discipline, and coordinator scope are unambiguous and low-overhead | `planner`, `coordinator`, `reviewer` | Missing Project Frame, ambiguous task entry, drift between docs |
| Operator Workflow Console | Planned | Admin users can see and act through ingest -> normalized -> review -> publish flow without opaque queue gaps | `planner`, `media-ingest`, `data-catalog`, `ui-shell`, `reviewer` | Execution framework not yet normalized, missing state aggregation, missing operator actions |
| Launch Validation And Runtime Proof | Pending follow-up | Real provider data can be traced through operator-visible workflow and verified in public runtime | `planner`, `media-ingest`, `data-catalog`, `detail-player`, `reviewer` | No reviewable items, missing test path, environment outage |
| Post-Launch Expansion | Deferred | Broader provider coverage, production automation, and expansion beyond the tracked backend scope | future tracked program | Not part of the active program |

## Milestones

| Milestone | Status | Evidence |
| --- | --- | --- |
| Frontend shell and player foundation | Complete | `docs/architecture.md`, player/detail history in `docs/handovers/` |
| Tracked backend queue (`Rounds A-F`, `Workstreams 1-4`) | Complete | `docs/backend-delivery-workflow.md`, `docs/handovers/reviewer-final-backend-readiness-sweep-acceptance.md` |
| Execution framework hardening | In progress | Active slice in `task.md`, planner handoff in `docs/handovers/planner-execution-framework-reconstruction.md` |
| Operator workflow console | Planned | Starts after execution framework hardening is accepted |
| Operator-visible ingest-to-publish flow | Not yet complete | Review queue emptiness still opaque to operators |
| Launch-ready operator path | Pending | Depends on workflow-console completion and runtime proof |

## Launch Criteria

The project should not be considered launch-ready until all of the following are true:

- operators can trace a title from intake through publish without direct DB inspection
- review queue entry creation is visible and testable from the admin workflow
- published catalog state can be verified from admin surfaces and public runtime
- source health and repair state remain visible in the same operator workflow
- final launch validation remains green under current environment and data

## Stop / Ask-User Gate

Agents may stop and ask the user only when all of the following are true:

1. the active slice checklist cannot be completed from existing docs, code, or local environment
2. the blocker cannot be cleared autonomously within the owning agent scope
3. two attempts to resolve the blocker have already failed for environmental or contradictory-requirement reasons

If those conditions are not all true, agents must continue.

## Coordinator Operating Model

The Coordinator is responsible for:

- selecting or opening the active slice
- aligning `task.md` to this Project Frame
- dispatching agents in the correct order
- merging accepted work
- version decisions
- documenting blockers and decisions

The Coordinator is not responsible for personally designing or implementing specialist-owned runtime work.

## Approved Slice Queue

### Active Program

`Execution Framework Reconstruction`

### Queue

1. `Slice 1: Dual-Layer Execution Model`
   - status: `active`
   - target: move persistent project state into a master plan doc, reduce `task.md` to the active slice contract, tighten stop/ask rules, and normalize checklist-driven execution
2. `Slice 2: Resume Operator Workflow Console Under New Framework`
   - status: `planned`
   - target: reopen the operator workflow console work with the Project Frame plus active-slice model in place

Any new slice must be added here before it can become active in `task.md`.

## Recording Rules

- `task.md` holds the current slice only
- `docs/dev-log.md` records accepted outcomes and major coordination changes
- `docs/handovers/` keeps planner/reviewer audit history
- `docs/backend-delivery-workflow.md` remains the historical backend completion record and fixed backend-delivery rulebook
