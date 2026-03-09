# Current State Overview

Date: 2026-03-09

Project version: `0.7.0`

## 1. Project Positioning

This repository is currently a buildable Next.js media-catalog prototype with:

- real browse/search/detail/playback pages
- shared mock-backed catalog logic
- URL-backed browse and search filters
- a functional in-page video player
- a drafted Prisma/PostgreSQL data model
- early API and ingest/import scaffolding

It is not yet a launch-ready streaming platform.

## 2. Frontend Structure

### Route structure

- `/`
  Homepage browse route
- `/movie`
  Movie browse route
- `/series`
  Series browse route
- `/anime`
  Anime browse route
- `/search`
  Search route with query/facet state in the URL
- `/media/[slug]`
  Detail and playback route

### Main UI modules

- `app/layout.tsx`
  App shell and global layout
- `components/Navbar.tsx`
  Top navigation and search entry
- `components/SearchBox.tsx`
  Search intro shell and hot-search area
- `components/FilterBar.tsx`
  Shared facet controls for browse and search
- `components/BrowseCatalogPage.tsx`
  Shared browse-page composition for `/`, `/movie`, `/series`, `/anime`
- `components/MediaGrid.tsx`
  Poster grid
- `components/MediaCard.tsx`
  Catalog card
- `components/Pagination.tsx`
  Pagination controls
- `components/detail/*`
  Detail-page modules such as hero, synopsis, resource list, related titles
- `components/player/*`
  Player shell, source tabs, and episode selector

### Styling/layout status

The current UI is no longer a raw placeholder shell. It already includes:

- a streaming-style browse layout
- responsive card grid and browse routes
- search and filter sections integrated into browse/search pages
- a rebuilt detail page and player area aligned to the reference assets
- multiple rounds of player UI refinement

Important note:

- The documentation still says `TailwindCSS`, but the actual implemented styling is currently plain CSS and CSS Modules:
  - `app/globals.css`
  - `styles/homepage.css`
  - `components/detail/detail-page.module.css`

So the real current frontend stack is:

- Next.js App Router
- React 18
- TypeScript
- plain CSS + CSS Modules

## 3. Current Frontend Functionality

### Browse and search

Implemented:

- category browsing for all/movie/series/anime
- search route
- live URL-backed facet updates
- live `Sort`, `Type`, `Genre`, `Region`, and `Year` filtering
- pagination that updates with current query state
- result counts and section metadata tied to filter state
- duplicate quick-filter row removed from the filter section
- `Apply` button removed; filtering updates immediately

Current behavior:

- browse and search pages share the same facet semantics
- changing filters updates the URL
- refresh and navigation preserve active filter state

### Detail page

Implemented:

- detail hero
- synopsis and metadata
- related recommendations
- download/resource area
- episode and source selection

### Player

Implemented:

- real HTML5 video player
- HLS support via `hls.js`
- play/pause
- click-on-video play/pause
- keyboard shortcuts
- seek left/right
- next episode button when applicable
- volume control with hover slider
- mute/unmute with memory of previous volume
- speed presets and custom speed slider
- theater mode
- fullscreen mode
- auto-hiding controls/cursor behavior
- local resume from saved progress
- watched-episode dimming
- multiple rounds of UI fixes to align with the provided player references

## 4. Backend / API Status

### Implemented server pieces

- `app/api/health/route.ts`
  Health check route with database reachability check when `DATABASE_URL` is configured
- `app/api/catalog/route.ts`
  Catalog/search API over current mock/shared catalog logic
- `app/api/media/[slug]/route.ts`
  Detail API over current mock/shared catalog logic
- `lib/config/env.ts`
  server-only environment parsing with Zod
- `lib/db/client.ts`
  Prisma client singleton setup
- `lib/server/errors.ts`
  shared API error response handling

### What these APIs currently are

They are useful scaffolding, but not yet a real backend layer:

- they still read from shared in-repo catalog logic rather than a production database-backed repository layer
- there is no auth/session boundary
- there are no write APIs for progress, lists, reports, or admin workflows
- there is no service/repository layer beyond the basic helpers

## 5. Data Layer and Catalog Logic

### Current runtime data source

The public app currently runs primarily on:

- `data/media.ts`
  shared catalog seed data
- `data/categories.ts`
  category and facet config
- `data/platform.ts`
  supporting platform/demo metrics
- `lib/media-catalog.ts`
  read model, facet building, browse/search/detail shaping
- `lib/search-filter.ts`
  search page data building
- `lib/search-params.ts`
  URL param normalization and link building

### Data coverage status

Current shared catalog coverage has already been expanded:

- 21 titles
- mixed movie / series / anime coverage
- multiple genres
- multiple regions
- multiple release years
- enough spread to exercise sort/filter/pagination combinations meaningfully

This is still seed/mock data, but it is now broad enough to support realistic UI testing.

## 6. Database Structure and Intended Capabilities

### Database technology

- Prisma
- PostgreSQL

### Current schema coverage

The Prisma schema is substantial and already models a real platform direction, including:

- users and preferences
- media titles
- alternate titles
- genres / tags / countries
- credits
- artwork
- seasons
- episodes
- resources
- browse/search/watch/list/event-related tables

From the schema already present, the intended platform capabilities include:

- title-level metadata management
- episodic structure
- stream/download resources
- playback progress
- user history/lists
- search and browse analytics/event storage
- resource-report and action tracking

### Current reality

The schema is drafted and usable as a model, but the product is not yet truly database-backed because:

- `DATABASE_URL` is not configured in the working environment
- no migrations have been applied here
- no repository layer serves the public app from Prisma yet
- the public routes still read mock/shared data

## 7. Local Ingest and Import Pipeline

Implemented scripts:

- `scripts/media-ingest-scan.mjs`
  scans local video directories and builds a manifest
- `scripts/media-enrich-candidates.mjs`
  builds metadata candidate review records
- `scripts/media-generate-import-seed.mjs`
  converts reviewed ingest data into import seed records
- `scripts/media-build-prisma-payload.mjs`
  converts seed data into Prisma-friendly payloads
- `scripts/media-import-prisma.mjs`
  dry-run or apply import into Prisma when `DATABASE_URL` is available

Current status:

- the ingest/import pipeline exists
- staging artifacts and import payload generation exist
- safe Prisma import logic exists
- but production database import has not been completed in this environment because the database is not configured

## 8. What Is Already Implemented

### Major implemented areas

- Buildable Next.js application
- Browse/search/detail/playback routes
- Shared browse UI shell
- Real live URL-backed facet filtering
- Expanded mock catalog data
- Functional player with custom controls and shortcuts
- Detail page resource/episode/source UI
- Early API routes
- Prisma schema
- Prisma client/environment scaffolding
- Local ingest to Prisma-payload pipeline
- Coordinator/sub-agent workflow, versioning, and audit trail in docs

## 9. Main Missing Functionality

### Product/runtime gaps

- public app still depends on in-repo seed data rather than live DB reads
- no authenticated user system
- no persistent user progress/list/history writes through app APIs
- no admin/content operations UI
- no real moderation/report queues
- no production playback source management or protection layer
- no deployment/observability/security hardening

### Backend gaps

- no full repository/service layer over Prisma
- no real catalog write APIs
- no progress/list/resource-report APIs
- no auth/session middleware
- no role-protected admin routes

### Database/infrastructure gaps

- no configured live database in this environment
- no applied migration history in this workspace
- no verified end-to-end DB-backed public catalog reads

### Quality/ops gaps

- no full automated test coverage
- `npm run build` passes, but `npm run typecheck` is currently blocked by an existing `.next/types` include issue
- no CI/CD or deployment config has been established as a production workflow

## 10. Practical Summary

### Current state

This project is now a fairly advanced streaming-platform prototype:

- strong frontend structure
- real browse/search/detail/player behavior
- realistic catalog seed coverage
- drafted schema and ingest pipeline
- early API and DB scaffolding

### Not yet true

It is not yet a full production streaming platform because the critical backend, persistence, auth, admin, and operations layers are still incomplete or only scaffolded.

## 11. Recommended Next Major Steps

1. Move public catalog reads from mock data to a Prisma-backed repository layer.
2. Configure a real `DATABASE_URL` and validate the ingest/import pipeline against the actual schema.
3. Add persistent write APIs for watch progress, history, lists, and invalid-resource reporting.
4. Build authentication/session handling.
5. Add admin/content operations workflows.
6. Fix the current `typecheck` configuration issue and add targeted automated tests.
