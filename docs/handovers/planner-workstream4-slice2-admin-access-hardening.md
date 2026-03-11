# Planner Handoff: Workstream 4 / Slice 2 - Admin Access Control And Route Hardening

## Task Summary

This slice hardens access to the existing admin and operator surfaces without turning the project into a full user-auth product. The goal is to establish a server-side access boundary, explicit operator/admin role checks, and safe deny behavior for the admin routes that already exist, so privileged backend and operator surfaces are no longer implicitly reachable.

Required execution order for this slice:

1. `planner`
2. `data-catalog`
3. `ui-shell` only if a minimal deny/fallback surface is required
4. `reviewer`

`media-ingest` is not part of this slice.

## Implementation Scope

This slice is limited to access control and route hardening for existing admin/operator surfaces.

In scope:

- one narrow server-side admin access boundary for existing admin/operator routes
- explicit role checks for the existing privileged surface set
- safe fallback or deny behavior when access is missing or insufficient
- protection of backend admin reads and actions so route access and data access enforce the same boundary
- a minimal hardening-only auth/session stub if the current codebase has no server-readable operator identity source yet
- deterministic tests for authorized, unauthorized, and underprivileged access paths

Expected outcomes:

- existing admin surfaces cannot be reached or partially rendered without the required operator/admin role
- privileged backend data and actions are denied server-side, not merely hidden in the UI
- deny behavior is consistent and safe, with no leaking of admin data into rendered HTML or route-local fallback states

## Explicit Non-Goals

Out of scope for this slice:

- full user auth product
- public sign-in flow
- public route redesign
- player or watch-page changes
- ingest/provider logic changes
- redesign of the admin UI
- RBAC expansion beyond the current admin/operator surfaces
- multi-tenant permissions
- full audit or security platform expansion beyond what is needed for this hardening slice

## Ownership Split

### Data Catalog

Primary owner for this slice.

Allowed scope:

- `lib/db/`
- `lib/server/admin/`
- `lib/server/catalog/`
- `lib/server/health/`
- minimal shared server-side auth or role-resolution support only if required to enforce the access boundary
- minimal schema support only if required by the hardening-only identity stub

Responsibilities:

- define the server-readable operator identity and role contract used by admin routes and admin backend actions
- enforce role checks on the backend side for existing admin data reads and write actions
- ensure unauthorized or underprivileged requests fail safely before privileged data is returned
- provide one consistent deny contract for admin routes and admin service calls
- keep any auth/session stub narrow, server-side, and hardening-only

Must not:

- broaden into a general-purpose public auth system
- redesign the admin surface set
- introduce RBAC complexity beyond the existing operator/admin scope
- leak access logic into public route contracts

### UI Shell

Participates only if a minimal deny/fallback surface is needed for the existing admin routes.

Allowed scope only if needed:

- a minimal unauthorized or denied route presentation for existing admin pages
- minimal route-level handling that matches the server-side boundary

Must not:

- redesign admin layouts
- move access control decisions into client-only logic
- broaden into a sign-in product or session management UI

### Reviewer

Owns acceptance validation for route hardening, deny behavior, scope discipline, and test/build coverage.

## Access-Boundary Rule

Access control must be enforced server-side. Existing admin routes, route loaders, and backend admin service calls must all resolve through the same operator/admin boundary. Client-side hiding of controls is not sufficient. If an unauthorized request hits an admin route directly, the response must deny safely before privileged data is rendered or returned.

## Minimal Auth/Session Stub Rule

If the repository lacks a server-readable privileged identity source, this slice may introduce a minimal hardening-only stub.

The stub must remain narrow:

- server-side only
- scoped to existing admin/operator surfaces
- suitable for later replacement by stronger auth hardening
- not exposed as a public sign-in or full account product

## Test Requirements

Mandatory:

- offline-safe tests for authorized admin access
- offline-safe tests for unauthorized admin access
- offline-safe tests for underprivileged access where the route exists but the role is insufficient
- tests that prove backend admin reads and actions honor the same access boundary as the route layer
- tests that prove deny behavior does not leak privileged data
- build and test path remain healthy

Tests should prove:

- authorized operator/admin requests can reach the intended existing admin surfaces
- anonymous or missing-identity requests are denied safely
- wrong-role requests are denied safely
- admin backend service calls cannot be invoked successfully outside the allowed boundary
- any minimal fallback presentation matches the deny contract and does not render privileged payloads

## Reviewer Acceptance Checklist

This slice is accepted only if all of the following are true:

- existing admin/operator routes now require explicit server-side access checks
- existing admin backend reads and actions enforce the same boundary as the route layer
- unauthorized and underprivileged requests fail safely with no privileged data leakage
- any minimal auth/session stub remains hardening-only and does not broaden into a public auth product
- no public route redesign, player work, ingest logic changes, or broad admin/UI redesign was introduced
- mandatory tests for allowed and denied access paths are present and passing

## Implementation Checklist Per Owning Agent

### Data Catalog Checklist

- identify the current admin/operator route set that must be hardened in this slice
- define the minimal server-side identity and role shape needed for those routes
- add one shared access-check path for admin route entry and backend admin service calls
- harden existing admin reads and writes so they deny before returning privileged data
- add a narrow deny contract that existing admin routes can use consistently
- introduce a minimal hardening-only auth/session stub only if enforcement cannot happen otherwise
- add deterministic tests for authorized, unauthorized, and underprivileged access paths

### UI Shell Checklist

- participate only if a minimal denied-state surface is required by the route behavior chosen in this slice
- keep any UI change limited to existing admin routes
- do not redesign the admin surface or introduce client-side-only protection
- add deterministic coverage only for the minimal deny/fallback presentation if it exists

### Reviewer Checklist

- verify the required execution order was respected
- verify access checks are server-side and cover both route entry and backend admin calls
- verify anonymous and underprivileged requests are denied safely
- verify no privileged admin data leaks into rendered output or route responses
- verify the slice stayed narrow and did not broaden into a full auth product or admin redesign
- verify mandatory tests exist for both allowed and denied paths
- fail the slice if protection still depends primarily on hidden UI controls or route-local client logic
