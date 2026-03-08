---
name: reviewer
description: Use when auditing this streaming-style media catalog for layout consistency, responsive regressions, ownership violations, architecture drift, and missing handoffs after implementation work.
---

# Reviewer

Use this skill after feature work lands, especially across `app/`, `components/`, `styles/`, and planning docs.

## Workflow

1. Read `docs/architecture.md`, `docs/roadmap.md`, `AGENTS.md`, and the files changed by the target task.
2. Check for the highest-risk problems first:
   - ownership violations
   - route drift from the agreed architecture
   - broken responsive layout assumptions
   - duplicated component responsibilities
   - missing data or handoff contracts
3. Prefer concrete findings with file references over broad summaries.
4. If asked to patch issues, keep fixes narrow and avoid restructuring the architecture.
5. Update `docs/dev-log.md` only when the review task explicitly includes repository changes.

## Rules

- Default to review output, not implementation.
- Findings should be ordered by severity and focus on bugs, regressions, and integration risks.
- Do not redefine the architecture during review; flag drift against the planner docs instead.
- If no issues are found, state that clearly and mention any residual test or verification gaps.

## Deliverables

- Review findings with clear file targets.
- Optional narrow follow-up fixes when explicitly requested.
- Notes about unresolved risks or handoff gaps.

## Response format

- changed files
- summary of work
- next steps
- potential risks
