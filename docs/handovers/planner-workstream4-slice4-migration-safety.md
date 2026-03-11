# Planner Handoff: Workstream 4 / Slice 4 - Migration Safety And Rollout Guardrails

## Task Summary

This slice hardens the existing backend foundation against unsafe schema and rollout changes by adding narrow migration-safety controls and rollout guardrails. The goal is to improve rollout safety through deterministic preflight checks, explicit migration metadata or status visibility, and safe runtime guardrails, without expanding into a full operations or deployment platform.

Required execution order for this slice:

1. `planner`
2. `data-catalog`
3. `ui-shell` only if a minimal privileged migration-safety signal is required
4. `reviewer`

`media-ingest` is not expected to participate in this slice.

## Implementation Scope

This slice is limited to migration safety and rollout guardrails for the accepted backend foundation.

In scope:

- deterministic migration preflight checks before guarded backend paths proceed
- explicit migration execution metadata or status visibility suitable for operator or reviewer inspection
- safe rollout boundaries that fail closed when migration state is unsafe, incomplete, or incompatible with expected runtime state
- a minimal operator-visible migration signal only if needed to expose migration safety state through an existing privileged admin surface
- offline-safe tests for preflight behavior, unsafe-state deny behavior, and any migration metadata handling introduced by the slice

Expected outcomes:

- the backend can detect and block obviously unsafe migration conditions before wider runtime impact
- migration state is no longer implicit or only visible through ad hoc manual inspection
- rollout-sensitive backend paths fail safely instead of running ambiguously against an incompatible schema state

## Explicit Non-Goals

Out of scope for this slice:

- backup and restore implementation
- full deployment automation
- broad CI/CD redesign
- general operations suite expansion
- public route redesign
- player or watch-page changes
- provider or ingest workflow redesign
- broad admin redesign
- full release orchestration platform work

## Ownership Split

### Data Catalog

Primary owner for this slice.

Allowed scope:

- `lib/db/`
- `lib/server/admin/`
- `lib/server/catalog/`
- minimal shared server-side runtime support needed for migration preflight and rollout guardrails
- minimal schema or metadata support only if required to persist or read migration-safety state

Responsibilities:

- define the deterministic migration preflight contract for this slice
- define the narrow migration metadata or status signal needed for safe rollout reasoning
- enforce safe deny or abort behavior where backend runtime must not proceed under incompatible migration state
- keep migration-safety logic inside accepted backend boundaries and out of public-route composition

Must not:

- broaden into a deployment-control system
- redesign public runtime contracts
- introduce backup/restore workflow scope
- expand into a general ops suite

### UI Shell

Participates only if a minimal operator-visible migration-safety signal is required.

Allowed scope only if needed:

- a narrow privileged admin signal or status view for migration state
- reuse of an existing admin area rather than a new admin suite

Must not:

- redesign admin navigation or layout
- broaden into a general operations dashboard
- move migration-safety decisions into client-only logic

### Reviewer

Owns acceptance validation for preflight correctness, safe deny behavior, scope discipline, and test/build coverage.

## Guardrail Rule

Migration safety must be enforced server-side. Preflight checks and rollout guardrails should stop unsafe backend startup or guarded backend operations from proceeding when migration state is incompatible with expected runtime state. Safe failure is preferable to partial runtime behavior against the wrong schema.

## Preferred Slice Shape

This slice should prefer the following order of value:

1. deterministic preflight checks
2. explicit migration metadata or status visibility
3. safe runtime deny or abort boundaries
4. only then minimal operator-visible signaling if required

It should not start by building a large admin operations surface.

## Test Requirements

Mandatory:

- offline-safe tests for successful preflight under valid migration state
- offline-safe tests for failed preflight or guardrail behavior under invalid or incompatible migration state
- offline-safe tests for any migration metadata read/write behavior introduced in this slice
- deterministic UI coverage only if this slice adds a minimal operator-visible migration signal
- build and test path remain healthy

Tests should prove:

- valid migration state passes the new guardrail path
- invalid or incomplete migration state fails safely and predictably
- migration metadata visibility, if added, is consistent with the guardrail state
- no public route or non-privileged surface leaks migration-safety internals unnecessarily

## Reviewer Acceptance Checklist

This slice is accepted only if all of the following are true:

- migration-safety behavior measurably improves rollout safety through deterministic preflight checks, explicit migration state handling, or safe deny behavior
- backend runtime does not silently proceed through the targeted guardrail path when migration state is incompatible
- any migration visibility introduced stays narrow and privileged
- the slice remains narrow and does not expand into backup/restore, deployment automation, broad CI/CD redesign, or a general ops suite
- no public-route changes, player work, or unrelated admin redesign were introduced
- offline-safe tests and build validation are present and passing

## Implementation Checklist Per Owning Agent

### Data Catalog Checklist

- define one narrow migration preflight contract for this slice
- define what migration metadata or runtime state must be checked before guarded backend paths proceed
- add only the minimal runtime guardrail needed to fail safely on incompatible migration state
- add explicit migration status visibility only if needed for operator or reviewer reasoning
- keep the slice compatible with existing backend module boundaries
- add deterministic tests for valid-state pass, invalid-state fail, and any metadata visibility introduced

### UI Shell Checklist

- participate only if a minimal privileged migration-safety signal is required
- reuse an existing admin surface if any UI is needed
- keep presentation limited to current migration safety status or failure-state signaling
- add deterministic UI coverage only for that minimal surface if it exists

### Reviewer Checklist

- verify the required execution order was respected
- verify deterministic migration preflight or guardrail behavior now exists
- verify invalid migration state fails safely instead of allowing ambiguous partial runtime behavior
- verify any migration visibility remains narrow and privileged
- verify no public-route changes, player work, broad CI/CD redesign, or operations-suite sprawl was introduced
- verify offline-safe tests and build validation are present
- fail the slice if migration safety still depends mainly on undocumented manual discipline or if the implementation broadens beyond this narrow hardening target
