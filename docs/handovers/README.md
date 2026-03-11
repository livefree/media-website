# Handover Index Rules

This folder is the audit trail for planner and reviewer checkpoints.

## Naming convention

Use only these active naming forms for backend execution:

- `planner-workstream<workstream>-slice<slice>-<slug>.md`
- `reviewer-workstream<workstream>-slice<slice>-<slug>-acceptance.md`
- `reviewer-workstream<workstream>-slice<slice>-<slug>-findings.md`

Examples:

- `planner-workstream1-slice5-retry-throttling.md`
- `reviewer-workstream1-slice5-retry-throttling-acceptance.md`

Legacy files that use `round-*` naming are historical and should not be renamed unless there is a migration task dedicated to that cleanup.

## Folder policy

- Keep accepted and findings documents in this folder as the permanent audit log.
- Do not create duplicate handoffs for the same accepted slice unless the prior one was explicitly rejected and a follow-up was opened.
- Follow-up files should append a clear suffix such as `-followup` instead of inventing a new numbering scheme.

## Growth policy

File growth here is expected, but discoverability must stay manageable.

- New backend work must use the `Workstream / Slice` naming pattern above.
- `task.md` remains the source of truth for the current active slice.
- `docs/dev-log.md` records completed acceptance points.
- If this folder becomes difficult to navigate, add index files or archive folders by era, but do not delete accepted audit history.
