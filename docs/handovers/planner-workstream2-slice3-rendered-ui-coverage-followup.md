# Planner Follow-up: Workstream 2 / Slice 3 - Rendered Admin Detail Coverage

## Task Summary

Reviewer has now held `Workstream 2 / Slice 3` twice for the same narrow reason: the slice still lacks deterministic coverage for the rendered reorder / replace / unpublish controls and visible result-state wiring on `/admin/catalog/[publicId]`. The backend mutation path is already accepted as real. The helper/view-model layer is already strengthened. This follow-up exists only to close the remaining rendered-surface acceptance gap on the admin published-catalog detail page.

Required execution order:

1. `planner`
2. `ui-shell`
3. `reviewer`

`data-catalog` must not be reopened in this follow-up unless UI Shell proves that the rendered detail page cannot be exercised against the already accepted backend/view-model contract. If that happens, treat it as a blocker and return it to Coordinator rather than expanding scope.

## Strict Scope

In scope:

- deterministic rendered-surface coverage for the actual reorder controls on `/admin/catalog/[publicId]`
- deterministic rendered-surface coverage for the actual replace controls on `/admin/catalog/[publicId]`
- deterministic rendered-surface coverage for the actual unpublish controls on `/admin/catalog/[publicId]`
- deterministic rendered-surface coverage for the visible flash/error/result-state wiring already supported by the accepted helpers and route contract
- the smallest testability-oriented render support needed to make those assertions stable

Out of scope:

- backend mutation redesign
- helper-only coverage expansion without rendered assertions
- admin layout redesign
- browser automation rollout
- public route changes
- auth/session work
- new lifecycle workflow scope

## Target Surface

The follow-up must attach directly to the rendered admin detail surface:

- [AdminPublishedCatalogDetailPage.tsx](/Users/livefree/projects/media-website-v2/components/admin/AdminPublishedCatalogDetailPage.tsx)

Reviewer findings identified the currently relevant mutation entry points on that page:

- reorder controls around the rendered source-order form
- replace controls around the rendered replacement form
- unpublish controls around the rendered unpublish form

The follow-up should assert the presence and visible wiring of those controls on the actual rendered page output, not only inside helper/view-model return objects.

## Required Coverage

The new deterministic coverage must prove all of the following on the rendered page:

1. reorder controls are visible when the detail record has reorderable published stream resources
2. replace controls are visible when replacement candidates exist for a published stream resource
3. unpublish controls are visible when the published media record is in scope for unpublish
4. accepted flash/result-state wiring is visible on the rendered surface when success-state query params are present
5. accepted error/result-state wiring is visible on the rendered surface when error-state query params are present

The coverage should stay narrow. It is not necessary to prove every mutation branch or every admin variant. One stable fixture-driven rendering path is enough as long as it anchors the real control presence and visible result-state surface.

## Implementation Guidance For UI Shell

UI Shell owns this follow-up.

Allowed work:

- add one narrow rendered admin detail test file if needed
- add minimal fixture builders or render helpers scoped to the admin published-catalog detail surface
- make only the smallest render-support changes needed for deterministic assertions

Preferred shape:

- render the actual `AdminPublishedCatalogDetailPage` component with fixture-backed props
- assert rendered mutation entry points by accessible labels, form text, button text, or other stable visible output
- assert visible flash/error/result-state output through the rendered page, not only helper-return values

Avoid:

- moving business rules into the component test
- rewriting the page structure just to simplify tests
- adding a broad component-test harness unrelated to this slice

## Reviewer Re-check Scope

Reviewer should re-check only:

- the rendered reorder control coverage on `AdminPublishedCatalogDetailPage`
- the rendered replace control coverage on `AdminPublishedCatalogDetailPage`
- the rendered unpublish control coverage on `AdminPublishedCatalogDetailPage`
- the rendered visible result-state wiring on `AdminPublishedCatalogDetailPage`
- that backend scope stayed closed

Reviewer should not reopen:

- accepted backend reorder / replace / unpublish semantics
- accepted helper/view-model stability work
- broader admin workflow design

## Acceptance Gate

This follow-up is accepted only if all of the following are true:

- deterministic tests now render `AdminPublishedCatalogDetailPage` rather than stopping at helper/view-model functions
- the rendered reorder / replace / unpublish entry points are asserted directly
- visible flash/error/result-state wiring is asserted directly on the rendered surface
- the follow-up stays within UI-shell scope and does not reopen backend or public-surface scope
