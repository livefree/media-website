# Reviewer Findings: Workstream 2 / Slice 3 - Source And Catalog Lifecycle Mutations

## Verdict

Findings. The slice is directionally correct and the backend-backed mutation workflows are real, but I am not accepting it yet because the planner-required deterministic UI coverage for the new operator mutation entry points is still missing.

## Findings

### 1. Deterministic UI coverage is still incomplete for the new mutation entry points

- The planner explicitly required deterministic UI-level verification for the admin entry points that trigger reorder, replace, and unpublish workflows in [docs/handovers/planner-workstream2-slice3-source-catalog-lifecycle-mutations.md](/Users/livefree/projects/media-website-v2/docs/handovers/planner-workstream2-slice3-source-catalog-lifecycle-mutations.md#L71).
- The new operator controls are present in the actual admin detail surface:
  - reorder form in [components/admin/AdminPublishedCatalogDetailPage.tsx](/Users/livefree/projects/media-website-v2/components/admin/AdminPublishedCatalogDetailPage.tsx#L150)
  - replace form in [components/admin/AdminPublishedCatalogDetailPage.tsx](/Users/livefree/projects/media-website-v2/components/admin/AdminPublishedCatalogDetailPage.tsx#L204)
  - unpublish form in [components/admin/AdminPublishedCatalogDetailPage.tsx](/Users/livefree/projects/media-website-v2/components/admin/AdminPublishedCatalogDetailPage.tsx#L457)
- But the only UI-side test coverage I found is helper-level coverage in [components/admin/admin-published-catalog.helpers.test.ts](/Users/livefree/projects/media-website-v2/components/admin/admin-published-catalog.helpers.test.ts#L1), which verifies path parsing and replacement-option shaping, not the rendered mutation entry points themselves.
- I did not find deterministic coverage for:
  - the presence of the reorder/replace/unpublish controls on the admin page
  - form wiring to the intended server actions in [app/admin/catalog/actions.ts](/Users/livefree/projects/media-website-v2/app/admin/catalog/actions.ts#L58)
  - narrow result-state behavior on the operator page after those actions are triggered

## What Passed

### Real backend-backed workflows exist

- Reorder is a real backend-backed admin workflow through:
  - [app/admin/catalog/actions.ts](/Users/livefree/projects/media-website-v2/app/admin/catalog/actions.ts#L58)
  - [lib/server/admin/service.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.ts#L429)
  - [lib/server/source/service.ts](/Users/livefree/projects/media-website-v2/lib/server/source/service.ts#L48)
  - [lib/db/repositories/source/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/source/index.ts#L846)
- Replace is a real backend-backed admin workflow through:
  - [app/admin/catalog/actions.ts](/Users/livefree/projects/media-website-v2/app/admin/catalog/actions.ts#L96)
  - [lib/server/admin/service.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.ts#L438)
  - [lib/server/source/service.ts](/Users/livefree/projects/media-website-v2/lib/server/source/service.ts#L70)
  - [lib/db/repositories/source/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/source/index.ts#L934)
- Unpublish is a real backend-backed admin workflow through:
  - [app/admin/catalog/actions.ts](/Users/livefree/projects/media-website-v2/app/admin/catalog/actions.ts#L121)
  - [lib/server/admin/service.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.ts#L447)
  - [lib/server/catalog/service.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/service.ts#L167)
  - [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L1587)

### Scope and boundary discipline look good

- I did not find public route redesign, player work, auth/session expansion, or broad admin-suite drift in the reviewed scope.
- The mutation logic remains server-side and admin-only. The UI surface submits forms, but the actual lifecycle rules stay inside accepted admin/source/catalog backend boundaries.
- Access control remains enforced through [lib/server/admin/service.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.ts#L429) and existing admin access checks.

### Backend tests and build evidence are strong

- I ran:

```bash
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/db/repositories/source.lifecycle.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/db/repositories/catalog.lifecycle.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/server/admin/service.test.ts
node --experimental-strip-types --test components/admin/admin-published-catalog.helpers.test.ts
npm run build
```

- The lifecycle repository tests passed:
  - reorder + replace in [lib/db/repositories/source.lifecycle.test.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/source.lifecycle.test.ts#L162)
  - unpublish in [lib/db/repositories/catalog.lifecycle.test.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog.lifecycle.test.ts#L67)
- The admin service tests passed, including forwarding of all three bounded workflows in [lib/server/admin/service.test.ts](/Users/livefree/projects/media-website-v2/lib/server/admin/service.test.ts#L1282).
- `npm run build` passed.

## Conclusion

- Reorder, replace, and unpublish are now real backend-backed admin workflows, which is the core functional target of this slice.
- I am still holding the slice at findings because the planner required deterministic UI-level verification for the new operator mutation entry points, and that specific coverage is not yet present on the integrated `main`.
