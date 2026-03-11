# Reviewer Acceptance: Canonical Catalog Serving Round E

## Verdict

Accepted on code/build review of the current integrated `main`.

## Acceptance Basis

### 1. Public browse/search/detail/watch/list surfaces now serve from published backend read boundaries

- Browse/search continue to resolve through the published-catalog service in [lib/search-filter.ts](/Users/livefree/projects/media-website-v2/lib/search-filter.ts#L146), backed by [lib/server/catalog/service.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/service.ts#L14) and [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L653).
- Detail/watch resolve through the same published-catalog service layer in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L208) and [app/media/[slug]/page.tsx](/Users/livefree/projects/media-website-v2/app/media/[slug]/page.tsx#L44), with route-safe mapping in [components/detail/publishedCatalogAdapters.ts](/Users/livefree/projects/media-website-v2/components/detail/publishedCatalogAdapters.ts#L1).
- `/lists` now reads the published backend list directory in [app/lists/page.tsx](/Users/livefree/projects/media-website-v2/app/lists/page.tsx#L4).
- `/list/[publicId]` now reads published backend list detail in [app/list/[publicId]/page.tsx](/Users/livefree/projects/media-website-v2/app/list/[publicId]/page.tsx#L5).
- Homepage featured-list discovery no longer uses withdrawn seed helpers; it now resolves through published featured-list discovery in [lib/search-filter.ts](/Users/livefree/projects/media-website-v2/lib/search-filter.ts#L3) and [lib/search-filter.ts](/Users/livefree/projects/media-website-v2/lib/search-filter.ts#L236), consumed by [components/BrowseCatalogPage.tsx](/Users/livefree/projects/media-website-v2/components/BrowseCatalogPage.tsx#L64).

### 2. No staging, normalization, review, rejected, or operator-only state leaks into public runtime contracts

- Published catalog queries still enforce `publishedAt: { not: null }` on public media reads in [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L421), [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L678), and [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L705).
- Public list records are filtered to items whose media are published in [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L67) and [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L507).
- The public service/contracts expose only published-safe browse/detail/watch/list shapes in [lib/server/catalog/types.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/types.ts#L20) and do not include raw provider payloads, staging candidates, review notes, queue state, or publish audit data.

### 3. Canonical public identity remains intact

- Canonical list identity remains `/list/<publicId>` via [lib/server/catalog/identity.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/identity.ts#L34).
- Canonical watch identity remains `/watch?...` with `list` / `li` context preserved via [lib/server/catalog/identity.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/identity.ts#L5).
- Published list summaries, list items, and watch resolution all continue to emit canonical list-aware watch hrefs in [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L541), [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L582), [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L601), and [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L776).

### 4. No source-health workflow was introduced

- I did not find source-health workflow additions in the integrated Round E public catalog serving path. The reviewed public/runtime changes stay focused on published catalog reads, identity resolution, and list discovery/detail serving.

### 5. Ownership boundaries were respected

- `data-catalog` work stays centered in `lib/server/catalog/` and `lib/db/repositories/catalog/`.
- `search-filter` owns the browse/search integration in [lib/search-filter.ts](/Users/livefree/projects/media-website-v2/lib/search-filter.ts#L1).
- `detail-player` owns the detail/watch integration in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L1), [app/media/[slug]/page.tsx](/Users/livefree/projects/media-website-v2/app/media/[slug]/page.tsx#L1), and [components/detail/publishedCatalogAdapters.ts](/Users/livefree/projects/media-website-v2/components/detail/publishedCatalogAdapters.ts#L1).
- `ui-shell` ownership is limited to public list presentation components such as [components/FeaturedListsSection.tsx](/Users/livefree/projects/media-website-v2/components/FeaturedListsSection.tsx#L1), [components/PublicListDirectoryPageShell.tsx](/Users/livefree/projects/media-website-v2/components/PublicListDirectoryPageShell.tsx#L1), [components/PublicListPageShell.tsx](/Users/livefree/projects/media-website-v2/components/PublicListPageShell.tsx#L1), and [components/publicListView.ts](/Users/livefree/projects/media-website-v2/components/publicListView.ts#L1).

### 6. Buildability

- `npm run build` passed during this review.
- The generated route output includes `/lists`, `/list/[publicId]`, `/watch`, and the browse/search/detail routes without build regressions.

## Residual Notes

- [components/BrowseCatalogPage.tsx](/Users/livefree/projects/media-website-v2/components/BrowseCatalogPage.tsx#L1) still imports `getCategoryFeed` from `lib/media-catalog`, but that usage is limited to static browse copy, not runtime catalog/list data composition.
- Unrelated API helpers such as [app/api/catalog/route.ts](/Users/livefree/projects/media-website-v2/app/api/catalog/route.ts#L1) and [app/api/media/[slug]/route.ts](/Users/livefree/projects/media-website-v2/app/api/media/[slug]/route.ts#L1) still point at older seed-era helpers, but they were outside the Round E public page-serving acceptance scope requested in this review.
