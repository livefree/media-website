# Reviewer Acceptance: Workstream 3 / Slice 2 - Publish Scheduling And Visibility Control

## Verdict

Accepted.

## What I Reviewed

- Active task definition in [task.md](/Users/livefree/projects/media-website-v2/task.md)
- Planner scope and acceptance criteria in [planner-workstream3-slice2-publish-scheduling-visibility.md](/Users/livefree/projects/media-website-v2/docs/handovers/planner-workstream3-slice2-publish-scheduling-visibility.md)
- Integrated backend support for schedule / clear schedule / hide / restore visibility
- Integrated admin surfaces on `/admin/review/[queueEntryId]` and `/admin/catalog/[publicId]`
- Integrated deterministic render coverage for the new governance controls

## Acceptance Basis

### 1. The slice stays narrow and inside governance scope

- The implementation stays inside review, catalog, admin, repository, and schema boundaries.
- I did not find provider, player, public-route, or auth redesign in this slice.
- The new behavior is bounded to:
  - future publish scheduling
  - clearing/replacing a scheduled publish
  - hiding published visibility
  - restoring published visibility

### 2. Publish scheduling is explicit and operator-bounded

- `scheduleReviewPublication` now requires operator access and enforces a future timestamp in [lib/server/review/service.ts](/Users/livefree/projects/media-website-v2/lib/server/review/service.ts).
- `clearScheduledReviewPublication` clears an existing schedule only through the same tracked review boundary in [lib/server/review/service.ts](/Users/livefree/projects/media-website-v2/lib/server/review/service.ts).
- `ReviewQueueEntry.scheduledPublishAt` is persisted in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma) and carried through review repository types and mapping.
- Publish-audit actions now cover schedule and clear-schedule events rather than relying on implicit state changes.

### 3. Visibility control is explicit and auditable

- Published visibility is modeled with `PublishedVisibilityState` in [prisma/schema.prisma](/Users/livefree/projects/media-website-v2/prisma/schema.prisma).
- Hidden/restore behavior is implemented through explicit repository methods:
  - `hidePublishedCatalogRecord`
  - `restorePublishedCatalogVisibility`
  in [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts)
- Operator lifecycle audit actions now include `CATALOG_HIDDEN` and `CATALOG_RESTORED`.

### 4. Public-serving remains visibility-gated

- Published catalog reads now continue to require `publishedAt != null` and `visibilityState = "VISIBLE"` in the catalog repository, including list/detail/related/public query paths in [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts).
- This satisfies the slice requirement that hidden or not-yet-visible content does not leak into public serving.

### 5. Admin surfaces expose the bounded controls with deterministic UI coverage

- The review detail surface now exposes schedule / reschedule / clear controls in [components/admin/AdminReviewDetailPage.tsx](/Users/livefree/projects/media-website-v2/components/admin/AdminReviewDetailPage.tsx).
- The published catalog detail surface now exposes hide / restore visibility controls in [components/admin/AdminPublishedCatalogDetailPage.tsx](/Users/livefree/projects/media-website-v2/components/admin/AdminPublishedCatalogDetailPage.tsx).
- Render-level tests now cover the visible controls and result-state wiring:
  - [AdminReviewDetailPage.render.test.ts](/Users/livefree/projects/media-website-v2/components/admin/AdminReviewDetailPage.render.test.ts)
  - [AdminPublishedCatalogDetailPage.render.test.ts](/Users/livefree/projects/media-website-v2/components/admin/AdminPublishedCatalogDetailPage.render.test.ts)

## Integrated Checks Reviewed

The following integrated checks passed on local `main`:

```bash
node --experimental-strip-types --test components/admin/AdminReviewDetailPage.render.test.ts components/admin/AdminPublishedCatalogDetailPage.render.test.ts components/admin/admin-published-catalog.helpers.test.ts
node --import ./scripts/register-server-only-loader.mjs --experimental-strip-types --test lib/db/repositories/catalog.lifecycle.test.ts lib/db/repositories/catalog.visibility.test.ts lib/server/admin/service.test.ts lib/server/review/scheduling.test.ts
npm run db:generate
npm run build
```

## Notes

- The render tests emit a React warning for `form action` in static render test context. That is consistent with server actions rendered outside the live runtime and does not block acceptance for this slice.

## Conclusion

`Workstream 3 / Slice 2` is accepted. The repo now has bounded, auditable publish scheduling and visibility controls exposed through tracked backend and admin boundaries, with deterministic backend coverage, deterministic rendered admin coverage, and no public-route scope drift.
