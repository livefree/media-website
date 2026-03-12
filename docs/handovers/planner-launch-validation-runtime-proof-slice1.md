# Planner Handoff: Launch Validation And Runtime Proof / Slice 1

Active slice: `Launch Validation And Runtime Proof / Slice 1: Real Intake To Review Queue Validation`

## Problem Statement

The operator workflow console now renders pending normalized candidates, the review queue, and workflow landing context, but every proof so far was based on seeded or fixture-backed data. We still have not demonstrated that a real provider adapter ingest run (e.g., `jszyapi_vod_json`) can:

1. persist raw payloads and staged records,
2. emit normalized candidates,
3. surface those candidates inside `/admin/normalized`, and
4. let an operator queue the exact item into `/admin/review` using the existing admin actions.

This slice provides the first operator-visible, end-to-end validation that real intake can travel through the tracked workflow surfaces without any manual database edits.

## Success Criteria

- A real provider ingest execution (no fixtures) produces at least one new normalized candidate derived from the `jszyapi_vod_json` adapter and records the ingest artifacts (raw payload, staged row, checkpoint).
- The candidate is visible inside `/admin/normalized`, shows a deterministic identifier, and provides the queue-for-review action without extra tooling.
- Operators can push that candidate into `/admin/review`, and the review entry shows the same canonical identifiers (provider key, title/slug, staged ids) that originated from the ingest run.
- The entire proof path is repeatable: instructions, commands, and captured evidence allow any operator to reproduce the run from the current repository state.
- All verification relies on the existing backend/admin contracts; there are no ad hoc DB scripts or manual inserts.

## Proof Workflow Overview

1. **Environment prep** – ensure `DATABASE_URL` is set and migrations applied (`npm run db:migrate`).
2. **Real ingest execution** – run `npm run ingest:provider:jszyapi -- --page 1 --mode manual --request-id <uuid> --actor-id <operator>` (page can vary as long as it produces fresh items). Record the JSON summary and ingest logs.
3. **Normalization visibility** – start the admin app (`npm run dev`) and capture `/admin/normalized` showing the new candidate(s) with provider metadata and queue action.
4. **Queue to review** – use the UI action to send the candidate into review, then capture `/admin/review` confirming the entry exists and references the same staged ids.
5. **Evidence package** – store ingest command output, admin screenshots (or equivalent console logs), and reviewer notes so the proof stays auditable.

## Execution Order

1. Planner (this handoff).
2. Media Ingest – run the real-provider execution path and capture ingest evidence.
3. Data Catalog – ensure normalized candidates flow into the admin services and queue-for-review path without manual patches; document the reproducible workflow.
4. Reviewer – validate runtime proof, evidence, and checklist completion.
5. Coordinator – merge accepted work, decide on version bump, and push `main`.

## Ownership Boundaries

### Media Ingest

- Operate the `jszyapi_vod_json` ingest path using `npm run ingest:provider:jszyapi`.
- If necessary, add small ingest-side visibility helpers (logs, structured evidence capture) without broadening persistence contracts.
- Provide ingest evidence: command output, request id, actor id, page number, item count, and checkpoint positions.
- Do **not** patch admin UI or normalization repositories.

### Data Catalog

- Confirm the ingested staged records flow through existing normalization, repository, and admin service layers (no manual inserts).
- If normalized candidates are filtered out or missing fields, patch only the relevant backend contracts (`lib/server/normalization`, `lib/server/admin`) so the data surfaces correctly.
- Record how operators push the candidate into review: include the normalized id, resulting review entry id, and supporting logs/tests.
- Ensure documentation and a minimal helper script (if needed) stay inside backend-owned files.

### UI Shell

- **Not required for this slice.** Existing `/admin/normalized` and `/admin/review` surfaces already satisfy the operator touchpoints. If a rendering bug blocks evidence capture, escalate back to Coordinator; otherwise UI Shell remains idle.

### Reviewer

- Re-run the ingest command (or reuse the captured request id) to confirm the workflow is repeatable.
- Validate `/admin/normalized` and `/admin/review` behavior in a real browser, ensuring the queued candidate matches the ingest evidence.
- Confirm the acceptance checklist, recorded commands, and dev-log updates exist before sign-off.

## Required Commands And Evidence

- `npm run db:migrate` – ensure schema parity.
- `npm run ingest:provider:jszyapi -- --page <n> --mode manual --request-id <uuid> --actor-id <operator>` – produce real intake.
- `npm run test:provider-ingest` – prove adapters/ingest execution stay green after any helper adjustments.
- `npm run test -- lib/server/admin/service.test.ts` – regression coverage for admin contracts.
- `npm run build` – confirm the runtime bundle is still healthy.
- Capture admin screenshots or recordings that show: `/admin/normalized` before queue, queue action result, `/admin/review` entry, plus any console logs tying review entry IDs to the ingest run.

## Blockers And Fallback Path

- **Provider outage or hard failure** – retry up to two times with different `--page` or `--mode incremental`. If the provider remains unreachable, mark the slice as blocked in `docs/dev-log.md` and halt until the user approves an alternate provider or fixture.
- **Database connectivity** – missing `DATABASE_URL` is a true blocker; record it immediately and stop until resolved.
- **Normalization gaps** – if real payload fields do not map cleanly, Data Catalog must add deterministic parsers/mappers. Resorting to manual DB edits is forbidden; inability to normalize after two targeted attempts is a blocker.
- **Admin UI regression** – if `/admin/normalized` or `/admin/review` cannot render the new data without UI Shell work, escalate to Coordinator to open a UI Shell slice; do not patch UI inside other scopes.

## Non-Goals

- No backend architecture or system design changes.
- No new provider adapters beyond what is required to run `jszyapi_vod_json`.
- No public-site, player, or consumer-facing route updates.
- No auth/session overhauls.
- No new workflow naming schemes beyond `Project Frame` + `Current Slice Execution`.

## Acceptance Checklist (must stay in lockstep with `task.md`)

- [ ] Docs aligned: Project Frame, roadmap, architecture, and backend workflow reviewed before implementation.
- [ ] Planner handoff published (this document).
- [ ] Ownership respected: each agent edits only its files.
- [ ] Artifact delivered: a real provider-backed intake run produces operator-visible normalized candidates.
- [ ] Artifact delivered: operators can move at least one real candidate into `/admin/review` through the product workflow.
- [ ] Artifact delivered: the proof path is documented and repeatable from the current environment.
- [ ] Artifact delivered: runtime proof uses tracked backend and admin contracts, not ad hoc DB edits.
- [ ] Tests/builds run and recorded by implementing agents.
- [ ] Reviewer acceptance recorded before merge.
- [ ] Dev-log updated.
- [ ] Coordinator records version decision.

## Preparing Slice 5 (Publish To Public Runtime Verification)

Completing this slice yields a repeatable recipe for obtaining real review queue entries created from live provider data. Slice 5 can then start from those review entries, exercise the publish step, and prove the public runtime shows the newly published title(s) without bypassing the operator workflow. Without Slice 1’s evidence package, Slice 5 would have to fabricate queue entries or rely on fixtures, undermining the launch validation goal.
