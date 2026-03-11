# Reviewer Acceptance: Catalog Withdrawal Round 1

Status: accepted

Scope reviewed:
- `/Users/livefree/projects/media-website-v2/task.md`
- `/Users/livefree/projects/media-website-v2/data/media.ts`
- `/Users/livefree/projects/media-website-v2/lib/media-catalog.ts`
- `/Users/livefree/projects/media-website-v2/lib/search-filter.ts`
- `/Users/livefree/projects/media-website-v2/app/page.tsx`
- `/Users/livefree/projects/media-website-v2/app/search/page.tsx`
- `/Users/livefree/projects/media-website-v2/app/watch/page.tsx`
- `/Users/livefree/projects/media-website-v2/app/media/[slug]/page.tsx`
- `/Users/livefree/projects/media-website-v2/app/lists/page.tsx`
- `/Users/livefree/projects/media-website-v2/app/list/[publicId]/page.tsx`
- `/Users/livefree/projects/media-website-v2/components/BrowseCatalogPage.tsx`
- `/Users/livefree/projects/media-website-v2/components/PublicListDirectoryPageShell.tsx`

Acceptance decision:
- Accepted from code/build review.

Findings:
- The runtime catalog is fully withdrawn at the source layer. `mediaCatalog` now exports as an empty array in [data/media.ts](/Users/livefree/projects/media-website-v2/data/media.ts#L2436).
- Public browse routes no longer expose listed titles because both browse cards and filtered search seeds derive from `mediaCatalog`, which now resolves to zero items in [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L407) and [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L511). The home route still renders the shared browse shell in [app/page.tsx](/Users/livefree/projects/media-website-v2/app/page.tsx#L1), and that shell falls back to an empty-state block when `pageData.results.length === 0` in [components/BrowseCatalogPage.tsx](/Users/livefree/projects/media-website-v2/components/BrowseCatalogPage.tsx#L97).
- Search now resolves to empty-state behavior instead of returning current listed titles. The search page shows the `No matches` empty state when `pageData.results.length === 0` in [app/search/page.tsx](/Users/livefree/projects/media-website-v2/app/search/page.tsx#L48), and `buildSearchPageData` now derives zero-result state from the emptied shared search seed in [lib/search-filter.ts](/Users/livefree/projects/media-website-v2/lib/search-filter.ts#L59) and [lib/search-filter.ts](/Users/livefree/projects/media-website-v2/lib/search-filter.ts#L125).
- Watch entry points for withdrawn titles no longer expose playable content. `/watch` now hard-fails to not-found when `getMediaDetailByPublicId` cannot resolve the requested title in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L207) and [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L580).
- Compatibility entry points for withdrawn titles also no longer expose content. `/media/[slug]` now hits `notFound()` when `getMediaDetail` cannot resolve the slug in [app/media/[slug]/page.tsx](/Users/livefree/projects/media-website-v2/app/media/[slug]/page.tsx#L65) and [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L554).
- Public list and list-directory surfaces no longer expose active catalog entries. `getPublicLists()` short-circuits to `[]` and `getPublicListPageRecord()` short-circuits to `undefined` when the runtime catalog is empty in [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L309) and [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L334). That leaves `/lists` with a zero-count directory shell in [app/lists/page.tsx](/Users/livefree/projects/media-website-v2/app/lists/page.tsx#L18) and forces `/list/[publicId]` to not-found in [app/list/[publicId]/page.tsx](/Users/livefree/projects/media-website-v2/app/list/[publicId]/page.tsx#L39).
- Empty-state and not-found behavior remains coherent at the route level: browse/search render explicit empty states, while withdrawn watch/list detail entry points resolve to not-found.

Verification:
- `npm run build` passed.

Residual risk:
- This acceptance is based on code/build review in this session. I did not complete live browser QA for the empty and not-found states.
