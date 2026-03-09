# Planner Handoff: Public URL Identity Round 1

## Task summary

Public URL Identity Round 1 defines the first production-grade public playback URL scheme for this project.

The current public watch flow leaks readable identifiers:

- media pages use `/media/[slug]`
- episodic playback uses readable episode slugs in query params
- source/provider state uses readable provider-style values in query params

Example of the current leak:

- `/media/star-mail-courier?episode=star-mail-courier-s1e1&download=quark`

That URL exposes title identity, episode identity, and provider hints directly in clear text. This round should replace that pattern with an opaque public identifier strategy and a canonical watch URL format that can scale to movies, episodic playback, and future playlist/list playback.

This is not encryption. The requirement is a stable opaque public identifier layer for public URLs, separate from internal slugs and internal primary keys.

## Why opaque public IDs should replace readable slugs in public playback URLs

Readable slugs are useful for editorial and internal routing, but they are the wrong canonical identifier for public playback URLs.

### Problems with slug-based watch URLs

- They leak title names, episode names, and provider hints directly into the public URL.
- They tie public link stability to editorial text choices and localization changes.
- They make future playlist/list playback awkward because the URL scheme becomes a mixture of human-readable title, episode, and provider tokens.
- They encourage downstream systems to treat UI text as identity.
- They complicate migration if titles are renamed, merged, relabeled, or de-duplicated.

### Benefits of opaque public IDs

- Public URLs stop exposing title or episode slugs.
- Identity remains stable even if titles, slugs, labels, or providers change.
- The same URL scheme can support movies, episodes, resources, and future lists.
- Internal slugs can remain available for SEO/editorial/internal lookups without being the canonical watch identifier.
- Public URL generation becomes a deliberate contract instead of an incidental byproduct of current UI text.

## Recommended canonical public watch URL shape

Recommended canonical route:

- `/watch`

Recommended query parameters:

- `v`: required media public ID
- `e`: optional episode public ID for episodic playback
- `r`: optional resource public ID for explicit stream/download source selection
- `list`: optional playlist/list public ID
- `li`: optional list-item public reference when list playback needs a stable current item
- `t`: optional future playback position in seconds

Recommended canonical pattern:

```text
/watch?v=<mediaPublicId>[&e=<episodePublicId>][&r=<resourcePublicId>][&list=<listPublicId>][&li=<listItemPublicRef>][&t=<seconds>]
```

### Why this shape

- It is close to the YouTube-style mental model: a stable watch route with query-driven playback context.
- It works for movies without inventing fake episode state.
- It works for episodic titles by layering episode selection only when needed.
- It leaves room for future list playback without replacing the core media identity parameter.
- It keeps the public route simple while still allowing runtime state selection.

## Canonical URL examples

### Movie playback

```text
/watch?v=med_7Q2m4Xc9Lp
```

Movie with explicit source/resource selection:

```text
/watch?v=med_7Q2m4Xc9Lp&r=res_B8n2Ka1Wm3
```

### Series or anime episode playback

```text
/watch?v=med_A4f9Ks2Qp1&e=ep_D3m8Rt7Yx5
```

Series or anime episode with explicit source/resource selection:

```text
/watch?v=med_A4f9Ks2Qp1&e=ep_D3m8Rt7Yx5&r=res_H6v1Nc8Jt2
```

### Future playlist or list playback

Start a list at the current media item:

```text
/watch?v=med_A4f9Ks2Qp1&e=ep_D3m8Rt7Yx5&list=lst_P2w7Lm9Qr4
```

Use a stable list-item reference when list ordering or duplicates matter:

```text
/watch?v=med_A4f9Ks2Qp1&e=ep_D3m8Rt7Yx5&list=lst_P2w7Lm9Qr4&li=li_F5z3Ub1Nk8
```

## Public ID strategy

### Core rule

Every entity that can appear in a public watch URL should have a stable opaque public identifier that is:

- unique
- non-semantic
- not derived from the readable slug
- durable across title renames and display-label changes

Recommended format:

- short prefix plus random opaque token
- examples:
  - `med_...`
  - `ep_...`
  - `res_...`
  - `lst_...`
  - `li_...`

Recommended generation options:

- `nanoid`-style random string with a fixed prefix, or
- ULID-style opaque token with a fixed prefix

The important constraint is stability and opacity, not reversibility or cryptography.

### Entity-by-entity strategy

#### MediaTitle

- add `publicId`
- public watch URLs always anchor on media public ID via `v`
- internal `slug` remains available for compatibility and editorial/internal use

#### Episode

- add `publicId`
- only present in the URL when the selected title is episodic
- decouples episode identity from season/episode slug formatting

#### Resource

- add `publicId`
- supports explicit source selection without exposing provider labels or provider-specific terminology in the canonical URL
- can be used for stream or download resource selection

#### UserList / playlist-like entity

- add `publicId`
- enables future shareable playlist/list contexts through `list`
- this should cover curated lists first and leave room for user-created public lists later

#### UserListItem

- add optional stable public item ref if list playback needs item-level identity
- recommended field: `publicRef`
- needed when the same media appears multiple times in a list or when list ordering must survive edits

#### Optional future entities

- `Person.publicId` if public person pages become part of the external URL contract
- a future `Collection` or editorial collection model should also receive `publicId` if it will have public URLs

These are not required for Round 1 playback, but the same public-ID policy should apply.

## Prisma and database/schema planning

The current Prisma schema has internal slugs but no distinct public-ID layer. Round 1 should introduce the schema foundation for opaque public identity.

### Recommended Prisma changes

#### `MediaTitle`

Add:

- `publicId String @unique`

Keep:

- `slug String @unique`

Rationale:

- `slug` remains useful for editorial/internal routing and temporary compatibility
- `publicId` becomes the canonical public watch identity

#### `Episode`

Add:

- `publicId String @unique`

Keep:

- existing `slug`
- existing `@@unique([mediaId, slug])`

Rationale:

- existing episode slug can remain for compatibility and editorial readability
- public episode selection must no longer depend on readable slugs

#### `Resource`

Add:

- `publicId String @unique`

Rationale:

- public source selection should not expose `quark`, `aliyun`, or similar provider hints in the canonical watch URL
- resource public IDs also support future analytics, reporting, and mirror selection without leaking provider naming

#### `UserList`

Add:

- `publicId String? @unique`

Recommended because:

- not every list must become public immediately
- system or private lists can remain without a public ID until shared playback/list URLs are actually enabled

Optional companion fields for future rounds:

- `isPublic Boolean @default(false)`
- `publicTitle String?`

#### `UserListItem`

Add:

- `publicRef String? @unique`

Rationale:

- stable per-item identity helps list playback where order, duplicates, or point-in-list matters
- the public watch URL can then refer to `li=` without exposing internal row IDs

### Indexing and data constraints

- every new public ID field should be unique
- public IDs should be generated at create time and never rewritten casually
- migration scripts should backfill existing rows before canonical public URL generation switches over

### Shared types/data planning

Round 1 should also update shared TypeScript contracts so public URL generation and route resolution stop depending on readable slug-only identity.

Recommended contract additions:

- `MediaItem.publicId`
- `EpisodeItem.publicId`
- `MediaResourceLink.publicId`
- `MediaDetailRecord.canonicalWatchHref`
- shared helper return shapes for:
  - canonical watch href
  - compatibility slug href
  - public episode/resource lookups

## Migration strategy from current slug links

Current public shape:

```text
/media/[slug]?episode=<episodeSlug>&download=<providerOrReadableValue>
```

Recommended migration path:

### Phase 1: introduce public IDs and canonical watch href generation

- add public IDs to shared data, shared types, and Prisma schema
- add shared helpers that generate canonical `/watch?...` URLs
- update catalog/detail link generation so new public links are available in shared data

### Phase 2: introduce the public watch route

- add `/watch` resolution using `v`, `e`, `r`, `list`, and `li`
- make the watch route resolve public IDs to media, episodes, and resources
- keep `/media/[slug]` working temporarily

### Phase 3: compatibility redirects or canonical-link fallback

- when arriving through `/media/[slug]?...`, resolve the slug-based request and redirect or link-canonicalize to the `/watch?...` form
- convert readable episode/provider query params into public IDs during that compatibility path

### Phase 4: stop using slug URLs as canonical public links

- internal link generation should default to `/watch?...`
- slug routes become compatibility entry points only

### Important migration rule

Do not break old links immediately. Existing slug routes may remain temporarily, but they should stop being the canonical public watch URL once the public-ID path exists.

## Agent-by-agent implementation order and ownership boundaries

## Execution order

1. `planner`
- publish this handoff

2. `data-catalog`
- define the public-ID model across shared types, data helpers, href generation, and Prisma schema

3. `detail-player`
- implement the first public watch-route slice and opaque episode/resource selection handling

4. `reviewer`
- validate URL behavior, compatibility behavior, and public-ID leakage before merge

## Data Catalog ownership and tasks

Owned scope:

- `data/`
- `types/`
- `lib/media*`
- `prisma/schema.prisma`
- import payload/planning artifacts if needed for public-ID planning

Round 1 tasks:

- add public IDs to shared media, episode, and resource records
- define shared href helpers for canonical `/watch?...` URLs
- update current media href generation so downstream UI/detail code can consume canonical watch links
- extend Prisma schema with the public-ID fields described above
- plan list-level public identifiers in schema/contracts even if full list playback is deferred

## Detail Player ownership and tasks

Owned scope:

- `app/media/`
- new public watch route(s)
- `components/player/`
- `components/detail/`

Round 1 tasks:

- implement `/watch` resolution from opaque query params
- support movie playback via `v`
- support episodic playback via `v + e`
- support explicit resource selection via `r`
- keep `/media/[slug]` compatible for now, but stop treating it as the primary public watch URL
- preserve current playback behavior while changing the public URL contract

## Reviewer ownership and tasks

Owned scope:

- docs and runtime validation only

Round 1 tasks:

- confirm canonical public watch URLs no longer expose title or episode slugs
- confirm compatibility behavior still resolves old slug links
- confirm at least one real public watch flow works end to end
- confirm schema/type changes support future list playback without requiring a redesign

## Acceptance gates

### Round 1 acceptance gate

Round 1 passes only if:

- the canonical public watch URL shape is defined as `/watch?...`
- shared media/episode/resource identity includes opaque public IDs
- Prisma planning or schema changes cover `MediaTitle`, `Episode`, `Resource`, and future list-level public identifiers
- at least one working public watch flow exists using opaque IDs
- the canonical playback URL no longer exposes readable media slug or episode slug
- `/media/[slug]` compatibility may remain, but it is no longer the canonical public watch URL

### Later-round acceptance gates

These are explicitly out of scope for Round 1 and should be handled in later rounds:

- full redirect coverage for every old slug-based entry path
- full playlist/list playback runtime, queue controls, and list continuation behavior
- public list sharing/privacy policy
- people/collection public routes
- analytics/event model migration from slug identifiers to public IDs
- complete import/backfill tooling for existing production databases
- SEO/editorial landing-route policy for title pages separate from watch URLs

## Reviewer validation focus

Reviewer sign-off should focus on visible URL behavior and identity leakage:

- opening the canonical public watch route should show opaque IDs only
- no readable title slug should appear in the primary watch URL
- no readable episode slug should appear in the primary watch URL
- explicit source/resource selection should use opaque resource IDs, not provider names
- compatibility slug links should still resolve correctly during the migration window
- the implementation should clearly distinguish opaque public IDs from “encrypted” slugs

## Recommendation summary

Recommended canonical direction:

- use `/watch` as the public playback route
- use `v`, `e`, `r`, `list`, and `li` query params for playback context
- add stable opaque `publicId` fields to media, episodes, resources, and lists
- keep slug routes temporarily for compatibility, but stop using them as canonical public watch URLs
- treat Round 1 as the identity foundation round, not the full playlist/runtime migration round
