# Reviewer Acceptance: Public URL Identity Round 1

## Decision

Accept. Candidate `004da1e` on `codex/detail-player-public-url-round-1` is mergeable to `main`.

## Evidence Reviewed

- Active task: [task.md](/Users/livefree/projects/media-website-v2/task.md#L26)
- Reviewer baseline: [docs/handovers/reviewer-public-url-round-1.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-public-url-round-1.md#L1)
- Runtime QA evidence from coordinator for the legacy compatibility URL and canonical `/watch` redirect
- Runtime screenshot: ![Public watch route runtime screenshot](/tmp/public-watch-star-mail.png)
- Shared data/model evidence already merged into `main` for opaque public IDs and future list coverage

## Acceptance Result

### 1. Canonical public watch URL no longer leaks readable media, episode, or provider identity

Pass.

Observed runtime behavior:
- legacy URL tested: `http://127.0.0.1:3001/media/star-mail-courier?episode=star-mail-courier-s1e1&download=quark`
- canonical redirect target: `http://127.0.0.1:3001/watch?v=med_aqmg0bsekx48&e=ep_k8bnx51aapnz&r=res_1f8cfcnxqusw`
- redirected path is `/watch`
- redirected query uses opaque `med_`, `ep_`, and `res_` identifiers rather than readable title, episode, or provider strings
- coordinator runtime checks reported `leaksSlug=false` for media slug, episode slug, and provider token leakage

Reviewer conclusion:
- the primary public playback URL is now the opaque `/watch` URL required by Round 1
- the candidate satisfies the task requirement to stop exposing title, episode, and provider details in the canonical public playback URL

### 2. Public-ID model covers media, episodes, resources, and future lists/playlists

Pass.

Confirmed foundation already merged into shared planning/data layers:
- media records carry stable opaque public IDs
- episode records carry stable opaque public IDs
- resource records carry stable opaque public IDs
- Prisma planning includes public-ID support for `MediaTitle`, `Episode`, `Resource`, `UserList`, and `UserListItem`

Reviewer conclusion:
- Round 1's shared identity model is broad enough for the first `/watch` slice and the stated future list/playlist expansion

### 3. Existing slug routes retain explicit compatibility behavior during migration

Pass.

Observed runtime behavior:
- the tested legacy `/media/[slug]` route still resolves
- it does not strand the user on a slug URL
- it redirects into the canonical opaque `/watch` URL

Reviewer conclusion:
- compatibility behavior is explicit and functional
- migration posture matches the baseline expectation that old slug links continue to work while canonical playback generation moves to `/watch`

### 4. The first `/watch` implementation slice is working in runtime

Pass.

Observed runtime behavior:
- the redirected canonical watch page loads successfully
- document title resolves as `星海邮差 | Media Atlas`
- the visible page heading is `星海邮差`
- a discovered canonical watch link on the resulting page is `/watch?v=med_aqmg0bsekx48&e=ep_k8bnx51aapnz&r=res_1f8cfcnxqusw`

Reviewer conclusion:
- the first `/watch` slice is not docs-only; it resolves a real title in runtime and preserves canonical watch-link generation

## Blocking Findings

None.

## Merge Recommendation

Mergeable.

Round 1 meets the reviewer baseline:
- canonical playback now favors opaque `/watch` URLs
- public identity no longer leaks media slug, episode slug, or provider details in the primary playback URL
- the shared public-ID model covers media, episodes, resources, and future list/list-item contexts
- existing slug routes retain working migration compatibility through canonical redirect behavior
