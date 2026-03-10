# Planner Handoff: Demo Media Backfill Round 1

## Task summary

Demo Media Backfill Round 1 is a pragmatic demo-readiness pass.

The current baseline has stable canonical watch and list flows, but many titles still rely on empty, placeholder, or non-working playback resources and non-working poster URLs. The watch page also still shows a visible playback source-selection UI that does not add value in a simplified demo-backed setup.

Round 1 should solve three concrete issues only:

1. map the local demo videos in `reference-assets/` into existing media entries that currently have placeholder or empty playback
2. remove the visible playback source-selection UI from the watch page without breaking playback
3. render consistent fallback poster-card artwork for titles whose poster art is missing or non-working

## Execution order

1. `planner`
- publish this handoff

2. `data-catalog`
- map local demo video assets into the existing catalog for affected titles

3. `ui-shell`
- implement fallback poster-card rendering for titles with missing or non-working artwork

4. `detail-player`
- remove the visible source-selection UI and preserve a simplified demo-backed watch flow

5. `reviewer`
- validate demo playback coverage, fallback artwork rendering, and the absence of the source-selection UI before merge

## Ownership boundaries

### Data Catalog owned scope

- `data/`
- `types/`
- `lib/media*`
- planning/schema artifacts only if truly needed for deterministic demo-media mapping

### UI Shell owned scope

- `app/`
- `components/`
- `styles/`
- any shared presentation assets needed for fallback poster cards

### Detail Player owned scope

- `app/media/`
- `app/watch/`
- `components/player/`
- `components/detail/`

### Reviewer scope

- docs and runtime/browser validation only
- no implementation takeover of Data Catalog, UI Shell, or Detail Player files

## Demo video mapping plan

## Local demo assets to use

Round 1 should use the three local video assets already present in `reference-assets/`:

- `reference-assets/demo-movie.mp4`
- `reference-assets/demo-tv.mp4`
- `reference-assets/demo-anime.mp4`

## Mapping rule by media type

Use a deterministic type-based fallback mapping:

- `movie` titles use `demo-movie.mp4`
- `series` titles use `demo-tv.mp4`
- `anime` titles use `demo-anime.mp4`

## Which titles should receive the backfill

This round should target titles that currently have placeholder, empty, or non-working playback for demo/testing purposes.

Recommended detection rule for Round 1:

- treat clearly fake or non-working media-resource URLs as demo-backfill candidates
- treat empty playback resources as demo-backfill candidates
- do not overwrite titles that already have a known-good local or functioning demo stream unless there is a clear reason

This keeps the round deterministic and avoids rewriting every title indiscriminately.

## How the mapping should work

### Movies

- If a movie title lacks a usable primary stream, attach the type-matched local demo video as its primary playable stream resource.
- Keep the canonical watch context and public IDs intact.

### Series and anime

- If an episodic title lacks usable playback, map the type-matched local demo video into the episode-level playback resources needed for demo navigation.
- It is acceptable in Round 1 for multiple episodes of the same title to reuse the same local demo asset, as long as episode navigation still works and the active episode route state remains coherent.

### Resource shape guidance

- Keep the existing playback-resource model rather than inventing a new demo-only runtime path.
- The local demo media should appear as the first usable stream option internally so the simplified watch flow has something valid to auto-select.
- Round 1 should prefer one deterministic local demo stream per affected title or episode rather than rebuilding a multi-source strategy.

## Data Catalog implementation checklist

- Identify the titles and episodes whose current playback is empty or placeholder-backed.
- Map the appropriate local demo asset by media type.
- Ensure affected records still produce valid watch-page playback options under the existing catalog contract.
- Preserve canonical watch/list behavior and public-ID composition.
- Keep the backfill deterministic and easy to reason about.

Recommended naming pattern for demo-backed resources:

- clear labels such as `Local demo`
- no fake provider proliferation
- one primary playable stream per affected context is enough for this round

## Source-selection UI removal plan

## User-facing requirement

The visible “视频源” playback-source chooser should no longer appear on the watch page.

## Detail Player behavior requirement

Removing the visible source-selection UI must not break playback.

Round 1 should keep the simplified flow:

- the watch page auto-selects the first valid available playable source
- canonical watch routing still tolerates existing `r` query state if present
- the player still receives a resolved source and continues to play

This means the source-selection logic may remain internally as fallback/resolution behavior, but the visible selector surface should be removed from the rendered watch UI.

## Detail Player implementation checklist

- Remove the visible `SourceTabs` playback-source block from the watch-page UI.
- Keep source resolution stable by selecting the first valid playable source internally.
- Preserve existing canonical watch behavior, list context, and episode navigation.
- Do not turn this into a larger player redesign.

Important scope note:

- This round is only about removing the visible playback-source selector.
- It does not require removing download sections or other non-source playback surfaces unless they directly block the simplified demo flow.

## Poster fallback plan

## Goal

Titles with missing or non-working poster art should render a consistent fallback poster-card treatment rather than broken image boxes.

## Deterministic fallback trigger

Round 1 should use a deterministic fallback rule rather than runtime guesswork only.

Recommended trigger conditions:

- poster URL is missing, or
- poster URL is known placeholder/non-working test infrastructure, such as the current `static.example.com` poster host, or
- image loading fails at runtime

This gives the app a predictable baseline while still covering runtime failures.

## Fallback artwork expectations

Fallback poster cards should:

- be visually consistent
- vary by media type (`movie`, `series`, `anime`)
- remain readable in grids and related/recommendation surfaces
- not depend on remote image availability

Recommended visual system:

- deterministic type-based color treatment
- title or title-initial treatment
- simple badge or label showing media type

Round 1 does not need a complex image-generation pipeline. It needs a consistent fallback visual.

## UI Shell implementation checklist

- Add a shared fallback poster-card treatment for missing/non-working artwork.
- Apply it consistently wherever catalog cards or related cards render posters.
- Make sure the fallback works for titles whose poster URL is absent, clearly fake, or fails to load.
- Keep the fallback presentation compact and aligned with the current browsing visual system.

## Acceptance criteria

Round 1 passes only if:

- affected titles that previously had empty or placeholder playback now resolve to usable local demo video by media type
- the watch page no longer shows the visible playback source-selection UI
- playback still works in the simplified demo-backed flow after that UI is removed
- titles with missing or non-working poster art show consistent fallback poster-card artwork
- canonical watch routing and existing list-aware behavior do not regress
- reviewer can verify end-to-end playback for affected demo-backed titles and visible fallback artwork where expected

Round 1 fails if:

- affected titles still land on empty or unusable playback
- the source-selection UI is still visibly present
- removing the source-selection UI breaks watch-page playback
- poster cards still render as broken/missing images instead of a fallback treatment
- canonical watch or list-aware URL behavior regresses

## Reviewer validation sequence

Reviewer sign-off must cover all three Round 1 outcomes.

### 1. Demo playback coverage

- Open representative affected titles across `movie`, `series`, and `anime`.
- Confirm each type now resolves to usable local demo playback where placeholder playback previously failed.
- For episodic titles, confirm episode navigation still lands on a working demo-backed playback state.

### 2. Source-selection UI removal

- Open the watch page for affected titles.
- Confirm the visible playback source-selection block is gone.
- Confirm playback still begins from a resolved default source.

### 3. Poster fallback rendering

- Review titles known to have missing or non-working poster art.
- Confirm they render a consistent fallback poster-card treatment instead of broken images.
- Check browse cards, related cards, and any other touched shared poster surface.

### 4. Routing regression guard

- Confirm canonical watch URLs still work.
- Confirm list-aware watch behavior still works where it existed before.

## Explicit out of scope

Round 1 does not include:

- building a full local media-ingest pipeline
- downloading or repairing all remote poster assets permanently
- adding new playback features
- reintroducing or redesigning multi-source playback controls
- auth flows
- admin tooling
- unrelated browse or player redesign
- production-grade transcoding, DRM, or media delivery work

## Recommendation summary

Round 1 should be treated as a focused demo-readiness slice:

- Data Catalog backfills playable local demo media by type
- UI Shell makes broken poster slots look intentional and consistent
- Detail Player removes the now-unnecessary visible source selector while keeping watch flow stable

That is enough to make the demo-backed watch experience usable without broadening into a larger media-platform rebuild.
