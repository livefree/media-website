# Planner Handoff: Workstream 4 - Hardening Slice 1

## Task Summary

This slice introduces the first narrow observability and launch-hardening increment on top of the accepted provider, catalog, source, and admin backend foundation. The chosen target is structured job execution telemetry and failure visibility for backend job flows that already exist, so operators and reviewers can prove what ran, how it ended, and why it failed without relying on ad hoc console output or implicit runtime behavior.

Required execution order for this slice:

1. `planner`
2. `media-ingest`
3. `data-catalog` only where shared persistence or backend support is required by the telemetry slice
4. `reviewer`

`ui-shell` is not part of this first slice unless a concrete implementation gap makes an operator-facing surface unavoidable. That is not the expected path for this round.

## Chosen First Hardening Slice And Why

Chosen slice:

- structured job execution telemetry and failure visibility for ingest, refresh, and source-probe job flows

Why this is the right first hardening slice:

- the backend already depends on scheduled and executable provider/source jobs, so operability risk is currently concentrated in job execution rather than public UI
- later hardening work such as alerts, queue visibility, provider-failure dashboards, and launch-readiness checks all depend on trustworthy execution and failure records
- this slice is narrow, measurable, and testable without introducing broad auth, UI, or infrastructure changes
- it improves safety and debuggability across the existing backend foundation without changing public runtime behavior

## Implementation Scope

This slice is limited to structured observability for existing backend job paths.

In scope:

- normalized execution lifecycle records for ingest, scheduled refresh, and source-probe jobs
- explicit success, failure, retry, and cancellation state capture where applicable to currently accepted job flows
- durable summary fields such as job kind, provider/source context, started time, finished time, duration, attempt count, and failure classification
- structured error capture suitable for offline-safe tests and later operator tooling
- shared helpers so existing job runners emit consistent telemetry instead of ad hoc per-job logging
- deterministic tests for telemetry creation, success paths, and failure paths

Expected outcomes:

- a failed or successful backend job leaves a consistent execution record
- job runs can be reasoned about without replaying ad hoc logs
- future hardening slices can build alerts or admin visibility on top of a stable execution record

## Explicit Non-Goals

Out of scope for this slice:

- public route redesign
- player or watch-page changes
- admin observability dashboard work
- alert delivery integrations
- broad metrics platform rollout
- auth or session expansion beyond narrow hardening needs
- Redis rearchitecture or worker-platform replacement
- provider-contract redesign
- review/publish workflow redesign
- source-health UX redesign
- backup, restore, or RBAC implementation

## Ownership Split

### Media Ingest

Primary owner for this slice.

Allowed scope:

- `lib/server/provider/`
- `lib/server/ingest/`
- existing scheduled refresh and source-probe execution paths
- shared runtime instrumentation helpers that are naturally owned by job execution

Responsibilities:

- emit structured execution lifecycle events from existing job paths
- normalize failure capture and retry-attempt capture for provider/ingest-owned execution
- ensure existing accepted job flows use consistent telemetry shape rather than ad hoc logging

Must not:

- redesign provider contracts
- broaden into public route logic
- expand this slice into queue UI or alerting systems

### Data Catalog

Participates only if durable shared persistence or server-side query support is needed for the telemetry model.

Allowed scope:

- `lib/db/`
- `lib/server/admin/`
- `lib/server/health/`
- minimal schema or repository support needed to persist and read structured execution records

Responsibilities:

- provide narrow durable storage or repository support if `media-ingest` cannot complete the telemetry slice within existing persistence boundaries
- keep telemetry persistence decoupled from public catalog serving and staging/review logic

Must not:

- broaden into admin dashboards for this slice
- redesign catalog/read models
- leak telemetry state into public route contracts

### UI Shell

Not expected to participate in Slice 1.

Only allowed if a concrete implementation blocker makes a minimal operator-facing surface unavoidable, which should be treated as an exception and kept out unless Planner/Coordinator explicitly reopen scope.

### Reviewer

Owns acceptance validation for telemetry correctness, scope discipline, test coverage, and build health.

## Test Requirements

Mandatory:

- offline-safe tests for successful job execution telemetry
- offline-safe tests for failure telemetry, including stable failure classification
- offline-safe tests for retry or repeat-attempt telemetry where the accepted job path already supports retries or repeated attempts
- deterministic verification that structured execution records include enough context to identify job kind and runtime outcome
- build and test path remain healthy

Tests should prove:

- ingest, scheduled refresh, and source-probe paths emit consistent execution records
- success and failure paths do not silently drop telemetry
- failure capture remains structured and machine-readable rather than raw unbounded console output only
- telemetry persistence or repository support, if added, stays inside accepted backend boundaries

## Acceptance Checklist

This slice is accepted only if all of the following are true:

- the chosen hardening slice measurably improves backend operability by making existing job execution outcomes visible in a consistent structure
- ingest, refresh, and source-probe job paths produce structured execution telemetry for both success and failure
- any durable storage added for execution records remains inside accepted backend boundaries and does not leak into public route logic
- the slice stays narrow and does not expand into dashboards, alerts, public route redesign, player work, or broader auth/admin drift
- the implementation includes the necessary offline-safe tests and remains buildable after this slice

## Implementation Checklist Per Owning Agent

### Media Ingest Checklist

- identify the accepted job flows that must emit structured execution telemetry in this slice
- define one consistent execution record shape for start, finish, failure, and retry-related updates
- instrument ingest, scheduled refresh, and source-probe paths to emit that shape
- normalize runtime failure capture into stable categories suitable for later observability work
- keep instrumentation narrow and compatible with current provider and job boundaries
- add deterministic tests for successful and failed execution telemetry

### Data Catalog Checklist

- participate only if shared durable persistence or repository support is required
- add the smallest possible schema or repository support for structured execution records if existing runtime boundaries are insufficient
- keep execution telemetry storage separate from public catalog reads and review/publish state
- add deterministic tests for any persistence or query support introduced by this slice

### Reviewer Checklist

- verify the required execution order was respected
- verify the slice improves observability or operability in a measurable way through structured execution records
- verify ingest, refresh, and source-probe paths all produce consistent telemetry for success and failure
- verify no public-route redesign, player work, dashboard expansion, or broader auth/admin drift was introduced
- verify offline-safe tests exist for the new telemetry behavior
- fail the slice if job visibility still depends on ad hoc logs alone or if the implementation broadens beyond this narrow hardening target
