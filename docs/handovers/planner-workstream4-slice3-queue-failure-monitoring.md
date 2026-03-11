# Planner Handoff: Workstream 4 / Slice 3 - Queue Failure Monitoring And Operator Visibility

## Task Summary

This slice adds operator-visible queue and job failure monitoring on top of the accepted structured telemetry baseline and the accepted admin access-control boundary. The goal is to let authorized operators see failed and retrying backend jobs, inspect enough structured context to triage the failure, and do so through existing privileged surfaces rather than through ad hoc logs or a brand-new observability suite.

Required execution order for this slice:

1. `planner`
2. `media-ingest`
3. `data-catalog`
4. `ui-shell` only where an operator-facing visibility surface is required
5. `reviewer`

## Implementation Scope

This slice is limited to operator-visible queue and job failure monitoring for existing backend job flows.

In scope:

- exposing failed and retrying queued jobs from the accepted telemetry layer
- defining the minimal operator-facing read model needed to inspect queue/job failures
- surfacing enough structured context for triage, such as job kind, provider or source context, current status, attempt count, recent failure classification, timestamps, and narrow linkage to related entities where already available
- reusing existing admin/operator surfaces or sections instead of inventing a new admin suite
- preserving the accepted admin access boundary so queue/job monitoring remains privileged only
- offline-safe tests for backend read models and any operator-facing UI involved in this slice

Expected outcomes:

- an authorized operator can see which jobs are failed or retrying
- an authorized operator can inspect enough structured failure context to decide what to investigate next
- queue/job monitoring stays within privileged admin/operator boundaries and does not leak into public routes

## Explicit Non-Goals

Out of scope for this slice:

- full observability platform rollout
- external alert integrations
- broad dashboard sprawl
- public route redesign
- player or watch-page changes
- provider adapter redesign
- broad metrics system design beyond what is required for this queue-failure surface
- broad admin-suite expansion beyond the minimum visibility surface required here
- queue mutation, replay, or job-control platform work unless explicitly required for read-only workflow completeness

## Ownership Split

### Media Ingest

Primary owner for queue/job telemetry interpretation within provider and ingest execution boundaries.

Allowed scope:

- `lib/server/provider/`
- `lib/server/ingest/`
- existing queued/scheduled job execution paths
- telemetry-to-operator read-model support that is naturally owned by job execution semantics

Responsibilities:

- ensure existing job telemetry exposes the structured fields needed for operator failure triage
- refine job-status semantics for failed and retrying states only where the accepted telemetry baseline is insufficient
- provide the ingest-side context needed to distinguish queue/job failure cases in operator-facing reads

Must not:

- redesign provider adapters
- broaden into public route logic
- expand this slice into a general observability or alerting platform

### Data Catalog

Owns the privileged backend read path and admin-facing contracts for queue/job failure visibility.

Allowed scope:

- `lib/db/`
- `lib/server/admin/`
- `lib/server/health/`
- minimal backend query/repository support needed to read failed and retrying jobs safely for operator surfaces

Responsibilities:

- expose one narrow privileged read contract for failed/retrying queued jobs
- keep the queue/job monitoring contract behind the accepted admin access boundary
- ensure no public or non-privileged route can read queue failure state
- support any narrow filtering or grouping needed for workflow completeness without broadening into dashboard sprawl

Must not:

- leak job telemetry into public route contracts
- expand into a full analytics layer
- broaden the scope into unrelated admin workflows

### UI Shell

Participates only where an operator-facing visibility surface is required.

Allowed scope:

- a narrow admin/operator surface or section that lists failed and retrying jobs
- a narrow detail or expanded row pattern if required to expose triage context
- minimal presentation changes within the existing privileged admin/operator area

Must not:

- invent a new large observability suite
- redesign unrelated admin areas
- move access-control or telemetry semantics into client-only logic

### Reviewer

Owns acceptance validation for privileged operator visibility, scope discipline, test coverage, and build health.

## Access And Leakage Rule

Queue/job failure monitoring must remain inside the accepted privileged access boundary from Slice 2. Any operator-facing list or detail surface in this slice must deny safely for unauthorized or underprivileged requests and must not leak telemetry or failure details into public routes, unauthenticated responses, or non-privileged admin fallbacks.

## Test Requirements

Mandatory:

- offline-safe backend tests for failed-job and retrying-job read models
- offline-safe backend tests proving privileged access is required for queue/job failure visibility
- offline-safe tests that verify structured triage context is present in the privileged read contract
- deterministic UI coverage if this slice adds or changes an operator-facing visibility surface
- build and test path remain healthy

Tests should prove:

- authorized operators can read failed and retrying jobs
- unauthorized or underprivileged requests are denied safely
- the read contract exposes enough structured failure context to triage without depending on ad hoc logs
- only the intended privileged surface can access queue/job failure state

## Reviewer Acceptance Checklist

This slice is accepted only if all of the following are true:

- an authorized operator can see failed and retrying queued jobs
- enough structured context exists in the privileged surface to triage failures without falling back to raw console output as the primary workflow
- queue/job failure visibility is served through accepted backend boundaries and remains protected by the admin access boundary
- no privileged telemetry leaks into public routes or unauthorized responses
- the slice remains narrow and does not expand into a full observability platform, external alerts, dashboard sprawl, or public-route changes
- offline-safe tests and build validation are present and passing

## Implementation Checklist Per Owning Agent

### Media Ingest Checklist

- verify the accepted telemetry baseline exposes the minimum fields needed for failed/retrying job triage
- add only the missing structured fields needed for operator visibility if the current telemetry is insufficient
- keep failed/retrying job semantics stable across ingest, scheduled refresh, and source-probe flows
- add deterministic tests for any telemetry refinement introduced by this slice

### Data Catalog Checklist

- define one narrow privileged read contract for failed and retrying queued jobs
- ensure the contract includes only the structured triage context needed for operator workflow completeness
- keep the contract behind the existing admin access boundary
- add deterministic backend tests for allowed and denied reads plus structured triage fields

### UI Shell Checklist

- participate only if a privileged operator-facing visibility surface is required
- reuse an existing admin/operator area where possible
- present failed and retrying jobs without expanding into a broad dashboard
- add deterministic UI coverage only for the narrow surface introduced by this slice

### Reviewer Checklist

- verify the required execution order was respected
- verify authorized operators can see failed and retrying jobs through a privileged surface
- verify the visible context is sufficient for triage and comes from structured telemetry rather than ad hoc log-only workflow
- verify unauthorized and underprivileged requests are denied safely
- verify no public-route changes, player work, provider-adapter redesign, or dashboard sprawl was introduced
- verify offline-safe tests and build validation are present
- fail the slice if queue failure monitoring still requires direct log inspection as the primary operator workflow or if privileged telemetry leaks outside admin boundaries
