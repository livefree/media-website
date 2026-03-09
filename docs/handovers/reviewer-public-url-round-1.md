# Reviewer Handoff: Public URL Identity Round 1

## Scope

- Active task: [task.md](/Users/livefree/projects/media-website-v2/task.md#L14)
- Planner handoff: [docs/handovers/planner-public-url-round-1.md](/Users/livefree/projects/media-website-v2/docs/handovers/planner-public-url-round-1.md#L1)
- Runtime surfaces under review:
  - canonical public watch route
  - existing `/media/[slug]` compatibility route during migration

Round 1 is not a player-redesign task. Reviewer sign-off is about public URL identity, public-ID coverage, migration compatibility, and whether the first canonical `/watch` flow is actually opaque in runtime.

## Acceptance Checklist

### 1. Canonical public watch URL must stop leaking readable media, episode, or provider identity

Pass if a tester can observe all of the following:
- The primary public playback URL is a canonical `/watch` URL rather than a slug-based `/media/[slug]` URL.
- The canonical URL does not expose human-readable media slugs.
- The canonical URL does not expose human-readable episode slugs.
- The canonical URL does not expose readable provider/resource labels such as `quark`, `aliyun`, or similar provider hints.

Fail if any of the following is true:
- The main playback URL is still a readable slug route.
- The canonical playback URL still contains title, episode, or provider details in clear text.
- The implementation uses a reversible text transformation that is still effectively derived from UI slugs instead of a true opaque ID.

### 2. Public-ID model must cover media, episodes, resources, and future lists/playlists

Pass if reviewer can confirm all of the following from the shared types/schema/data layer:
- media has a stable opaque public ID
- episodes have a stable opaque public ID
- resources/source selections have a stable opaque public ID
- the plan or schema foundation clearly reserves support for future lists/playlists and, where needed, list items

Fail if any of the following is true:
- the model covers only media and leaves episodes or resources on readable slugs
- future playlist/list support is not represented in the model or plan
- public identity is still coupled to mutable editorial slugs

### 3. Existing slug routes must have explicit compatibility behavior during migration

Pass if reviewer can observe or confirm all of the following:
- existing `/media/[slug]` links still resolve during the migration period
- the compatibility behavior is defined clearly: either temporary serving, redirecting, or canonicalizing
- canonical playback generation now points to `/watch` rather than continuing to mint new slug-based watch links

Fail if any of the following is true:
- existing slug links break outright
- compatibility behavior is ambiguous
- new UI links still primarily generate slug-based watch URLs

### 4. First `/watch` implementation slice must be runtime-testable

Pass if a tester can observe all of the following:
- at least one working `/watch` URL can be opened directly
- the watch route resolves the requested media correctly
- episodic selection works through opaque identifiers when episode context is needed
- explicit resource/source selection works through opaque identifiers when resource context is needed

Fail if any of the following is true:
- `/watch` exists only in docs but does not resolve at runtime
- `/watch` still depends on readable slug parameters under the hood of the public URL shape
- the first slice works only for movies or only for one narrow case without the promised shared public-ID foundation

## Runtime QA Expectations For The First `/watch` Slice

Reviewer runtime sign-off should cover these checks once implementation lands:

1. Open a canonical `/watch` URL directly and verify it resolves to playable media.
2. Confirm the visible browser URL does not reveal readable media slug, episode slug, or provider details.
3. If the selected title is episodic, switch to or load an episode through opaque URL state and verify the URL remains opaque.
4. If explicit resource/source selection is implemented in the first slice, verify the resource identifier in the URL is opaque and provider-neutral.
5. Refresh the page and confirm the same opaque `/watch` URL still resolves correctly.
6. Copy and reopen the URL in a fresh session or tab and confirm the same route remains stable.

## Compatibility Expectations For Existing Slug Routes

Reviewer should explicitly validate migration behavior, not assume it.

Expected compatibility posture for Round 1:
- existing `/media/[slug]` links may remain temporarily functional
- if `/media/[slug]` redirects, the redirect target should be the canonical opaque `/watch` URL
- if `/media/[slug]` temporarily serves the page directly, the canonical link generation and user-facing watch-link entry points should still favor `/watch`
- migration must not strand existing internal links or bookmarks without a defined fallback path

Reviewer should reject the round if:
- old slug URLs simply stop working
- the app still encourages users into readable-slug playback URLs by default
- canonical and compatibility behavior conflict with each other

## Reviewer Questions For Final Sign-Off

1. Does the primary public playback URL stop exposing readable media, episode, and provider identity?
2. Does the public-ID model clearly cover media, episodes, resources, and future list/playlist contexts?
3. Is there a clear migration/compatibility story for existing `/media/[slug]` links?
4. Is there at least one real working `/watch` implementation slice in runtime rather than only a schema or docs change?
5. Do the new canonical links now favor opaque `/watch` URLs instead of continuing to generate slug-based playback URLs?

## Merge Gate

Public URL Identity Round 1 can be accepted only if:
- the canonical playback URL is opaque and `/watch`-based
- the underlying public-ID model covers media, episodes, resources, and future lists/playlists
- slug-route compatibility behavior is explicit and functional during migration
- reviewer can validate at least one working `/watch` flow in runtime

The round must be rejected if:
- readable slugs still leak through the canonical public watch URL
- the public-ID design is incomplete for episodes/resources/future lists
- migration breaks old links or leaves compatibility undefined
- the first `/watch` implementation slice is not actually working in runtime
