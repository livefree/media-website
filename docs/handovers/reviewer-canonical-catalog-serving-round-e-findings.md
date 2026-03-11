# Reviewer Findings: Canonical Catalog Serving Round E

## Verdict

Findings. Round E is not acceptable yet.

## Blocking Findings

### 1. Public list discovery and public list pages still bypass the published-catalog backend

Round E required stable public `/watch?...` and `/list/...` identity to remain intact while the public runtime reconnects to canonical backend data. That reconnect is only partial in the current integrated `main`.

- [app/lists/page.tsx](/Users/livefree/projects/media-website-v2/app/lists/page.tsx#L1) still renders the list directory from `getPublicListDirectory()` in [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L321), which is the old seed/runtime helper layer.
- [app/list/[publicId]/page.tsx](/Users/livefree/projects/media-website-v2/app/list/[publicId]/page.tsx#L1) still renders individual public lists from `getPublicListPageRecord()` in [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L329), again bypassing the published-catalog repository/service.
- Homepage featured-list discovery is still wired through the same seed helper path: [lib/search-filter.ts](/Users/livefree/projects/media-website-v2/lib/search-filter.ts#L389) calls `getPublicLists()` from [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L309), and [components/BrowseCatalogPage.tsx](/Users/livefree/projects/media-website-v2/components/BrowseCatalogPage.tsx#L68) consumes that result.

Why this is blocking:

- Public browse/search/detail/watch did move onto the new published-catalog backend, but public list discovery and list pages did not.
- That leaves public URL identity only partially reconnected to the canonical backend, with `/watch` list context resolved from published data while `/lists` and `/list/...` still depend on the old helper layer.
- Even when the current withdrawn `mediaCatalog` keeps these seed helpers effectively empty, the architectural boundary is still wrong for Round E and would become a real inconsistency as soon as local seed data diverges from published canonical state.

## What Passed

- Published-catalog repository and service boundaries exist under [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L653) and [lib/server/catalog/service.ts](/Users/livefree/projects/media-website-v2/lib/server/catalog/service.ts#L1).
- Public browse/search/detail/watch routes now read through published-catalog boundaries:
  - [lib/search-filter.ts](/Users/livefree/projects/media-website-v2/lib/search-filter.ts#L146)
  - [app/search/page.tsx](/Users/livefree/projects/media-website-v2/app/search/page.tsx#L1)
  - [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L208)
  - [app/media/[slug]/page.tsx](/Users/livefree/projects/media-website-v2/app/media/[slug]/page.tsx#L44)
  - [components/detail/publishedCatalogAdapters.ts](/Users/livefree/projects/media-website-v2/components/detail/publishedCatalogAdapters.ts#L1)
- The published repository filters public reads to published records with `publishedAt: { not: null }`, which prevents staging/review state from leaking through the new public contracts; see [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L421), [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L678), and [lib/db/repositories/catalog/index.ts](/Users/livefree/projects/media-website-v2/lib/db/repositories/catalog/index.ts#L705).
- I did not find source-health workflow mixed into this round.
- `npm run build` passed.

## Required Follow-up

- Move `/lists`, `/list/[publicId]`, and homepage featured-list discovery onto the published-catalog service/repository layer.
- Remove the remaining public-route dependency on `lib/media-catalog` for public list discovery/rendering so canonical `/list/...` identity is served from the same published backend as `/watch`.
