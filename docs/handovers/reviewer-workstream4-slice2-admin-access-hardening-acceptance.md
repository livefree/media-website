# Reviewer Acceptance: Workstream 4 / Slice 2 - Admin Access Control And Route Hardening

## Verdict

Accepted on code/test/build review of the current integrated `main`.

## Acceptance Basis

### 1. Existing admin/operator routes and backend entry points now require explicit server-side access checks

- The shared server-side access boundary is defined in [lib/server/admin/access.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/access.ts#L1) through `requirePrivilegedAdminAccess`.
- The admin service layer now enforces that boundary before backend dependencies are touched in [lib/server/admin/service.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.ts#L72).
- The direct admin-facing backend entry points also enforce the same boundary:
  - catalog admin reads in [lib/server/catalog/service.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/service.ts#L23)
  - repair queue admin reads/actions in [lib/server/health/service.ts](/Users/livefree/projects/media-website-v2/lib/server/health/service.ts#L29)
  - review/moderation/manual-title workflows in [lib/server/review/service.ts](/Users/livefree/projects/media-website-v2/lib/server/review/service.ts#L168)
  - source inventory/manual-source workflows in [lib/server/source/service.ts](/Users/livefree/projects/media-website-v2/lib/server/source/service.ts#L25)
- That means existing admin routes now resolve through guarded backend service calls instead of relying on hidden UI controls or implicit reachability.

### 2. Authorized vs unauthorized vs underprivileged behavior is correctly separated

- The access helper resolves three distinct outcomes:
  - authenticated operator/admin access
  - anonymous/missing identity
  - authenticated but underprivileged viewer identity
- Anonymous access throws a `401` `admin_access_unauthorized` error in [lib/server/admin/access.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/access.ts#L95).
- Underprivileged viewer access throws a `403` `admin_access_forbidden` error in [lib/server/admin/access.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/access.ts#L102).
- The helper behavior is directly covered in [lib/server/admin/access.test.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/access.test.ts#L30).
- The admin service tests additionally prove that anonymous and viewer requests are denied before dependencies are invoked in [lib/server/admin/service.test.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.test.ts#L1052).

### 3. Deny behavior is safe and does not leak privileged data

- The deny path triggers before backend dependency calls in the admin service tests, so privileged payloads are not fetched and cannot be partially rendered through the guarded service boundary.
- In [lib/server/admin/service.test.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.test.ts#L1052), unauthorized access leaves `queryAdminPublishedCatalog` untouched.
- In [lib/server/admin/service.test.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.test.ts#L1066), underprivileged viewer access leaves `listAdminRepairQueue` untouched.
- That is the key safety property for this slice: deny happens before privileged backend data is returned.

### 4. The auth/session stub remains narrow and hardening-only

- The identity source stays intentionally minimal in [lib/server/admin/access.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/access.ts#L82):
  - request header
  - request cookie
  - environment fallback stub
- There is no public sign-in flow, no account model, no session UI, and no auth expansion into public runtime routes.
- The fallback stub is clearly server-readable and hardening-only, which matches the planner’s constraint for this slice.

### 5. Scope stayed narrow

- I did not find public route redesign, player work, ingest/provider changes, or admin UI redesign in the reviewed scope.
- The slice is confined to server-side access enforcement and related tests across the existing admin/operator backend surface.
- Public published-catalog reads, watch serving, and other runtime routes remain unchanged.

### 6. Tests and build evidence are sufficient

- Focused access helper coverage exists in [lib/server/admin/access.test.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/access.test.ts#L1).
- Broader admin workflow coverage, including deny-before-dependency behavior, exists in [lib/server/admin/service.test.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.test.ts#L1).
- I ran:

```bash
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/admin/access.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/admin/service.test.ts
npm run build
```

- Both test suites passed.
- `npm run build` passed.

## Residual Note

- The tests cover the server-side boundary and deny semantics credibly. This slice does not yet introduce a production auth system, which is correct for scope, but it also means the current env/header/cookie identity source should still be treated as a hardening stub rather than a final launch-ready auth model.
