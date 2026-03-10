# Reviewer Acceptance: Browse Card Simplification Round 1

## Decision

Accepted.

## What was validated

- Shared browse cards no longer render a visible stats or stream/download pill area. The shared card body in [components/MediaCard.tsx](/Users/livefree/projects/media-website-v2/components/MediaCard.tsx#L30) now renders only the title plus an optional supporting line, and no `stats` block or metadata row is present there.
- Movie cards now show title only. The secondary line is gated to non-movie types in [components/MediaCard.tsx](/Users/livefree/projects/media-website-v2/components/MediaCard.tsx#L36).
- Series and anime cards now show title plus a compact episode-count line through `episodeCountLabel`, which is carried explicitly in the shared browse-card contract in [types/media.ts](/Users/livefree/projects/media-website-v2/types/media.ts#L186) and populated in [lib/media-utils.ts](/Users/livefree/projects/media-website-v2/lib/media-utils.ts#L248).
- Card links do not regress. The poster and title still target the same public entry href in [components/MediaCard.tsx](/Users/livefree/projects/media-website-v2/components/MediaCard.tsx#L9) and [components/MediaCard.tsx](/Users/livefree/projects/media-website-v2/components/MediaCard.tsx#L32).
- Poster badges and poster behavior do not regress. The poster wrapper, artwork component, and badge positions remain intact in [components/MediaCard.tsx](/Users/livefree/projects/media-website-v2/components/MediaCard.tsx#L12) and the shared poster/card styles remain stable in [styles/homepage.css](/Users/livefree/projects/media-website-v2/styles/homepage.css#L910).
- Shared grid alignment does not regress from this round. The card shell and copy block remain compact and grid-safe in [styles/homepage.css](/Users/livefree/projects/media-website-v2/styles/homepage.css#L894) and [styles/homepage.css](/Users/livefree/projects/media-website-v2/styles/homepage.css#L980), and the shared card is still only consumed through [components/MediaGrid.tsx](/Users/livefree/projects/media-website-v2/components/MediaGrid.tsx#L15).
- `npm run build` passed.

## Notes

- The legacy `stats` field still exists in the shared `BrowseMediaCard` data shape and builder in [types/media.ts](/Users/livefree/projects/media-website-v2/types/media.ts#L205) and [lib/media-utils.ts](/Users/livefree/projects/media-website-v2/lib/media-utils.ts#L274), but it is no longer rendered by the shared card surface. That is not a blocker for this presentation-only round.
- This acceptance is based on code/build validation. I did not perform live browser visual QA in this session.

## Merge recommendation

Safe to merge for Round 1.
