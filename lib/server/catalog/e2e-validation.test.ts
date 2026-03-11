import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createProviderFetchContext, createProviderRuntimeContext } from "../provider/adapter";
import { jszyapiVodJsonProviderAdapter } from "../provider/jszyapi";
import { runNormalizationBatch } from "../normalize/service";
import { applyCatalogPublication } from "./publish";
import {
  buildGoldenPathNormalizationRecord,
  buildGoldenPathPublishedFixtures,
  buildPersistedNormalizationArtifacts,
  createGoldenPathPublishMemoryDb,
} from "./e2e-validation";
import {
  getPublishedCatalogDetailByPublicId,
  getPublishedCatalogPage,
  resolvePublishedCatalogWatch,
} from "./service";

import type { ProviderHttpClient } from "../provider/types";

async function loadFixture() {
  const fixtureUrl = new URL("../provider/__fixtures__/jszyapi-page.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as Record<string, unknown>;
}

function createContext(http: ProviderHttpClient, now: Date) {
  return {
    ...createProviderRuntimeContext({
      http,
      now: () => now,
    }),
    ...createProviderFetchContext({
      requestedAt: now.toISOString(),
      requestId: "req-e2e-golden",
      actorId: "codex",
    }),
  };
}

test("golden backend validation proves staged anime output can normalize, publish, read, and resolve a health-aware watch contract", async () => {
  const payload = await loadFixture();
  const http: ProviderHttpClient = {
    async fetchJson() {
      return payload;
    },
    async fetchText() {
      throw new Error("fetchText should not be called in the golden validation path.");
    },
  };

  const providerPage = await jszyapiVodJsonProviderAdapter.fetchPage(
    {
      page: 2,
      updatedAfter: "2026-03-10T06:30:00.000Z",
    },
    createContext(http, new Date("2026-03-10T12:00:00.000Z")),
  );
  const stagedItem = providerPage.items.find((item) => item.providerItemId === "1002");

  assert.ok(stagedItem, "expected the golden fixture item to be present");

  const normalizationRecord = buildGoldenPathNormalizationRecord("provider-jszyapi", stagedItem);
  const normalizationBatch = runNormalizationBatch([normalizationRecord]);
  const normalized = normalizationBatch.normalizedCandidates[0];

  assert.ok(normalized, "expected one normalized candidate");
  assert.equal(normalized.mediaType, "anime");
  assert.equal(normalized.title.display, "星域行者");
  assert.equal(normalized.releaseYear, 2026);
  assert.equal(normalized.sourceSummary.streamCount, 3);
  assert.equal(normalized.seasonEpisodeHints.isEpisodic, true);
  assert.equal(normalized.seasonEpisodeHints.totalEpisodeCount, 3);
  assert.equal(normalized.seasonEpisodeHints.latestEpisodeNumber, 3);
  assert.equal(normalized.warnings.length, 0);

  const { candidate, aliases } = buildPersistedNormalizationArtifacts(normalized);
  const { db, state } = createGoldenPathPublishMemoryDb();
  const publishResult = await applyCatalogPublication(db, {
    decisionType: "approve",
    normalizedCandidate: candidate,
    aliases,
    actorId: "operator-golden",
    performedAt: new Date("2026-03-11T12:00:00.000Z"),
  });

  assert.equal(publishResult.action, "created");
  assert.equal(publishResult.alternateTitleCount >= 1, true);
  assert.equal(publishResult.seasonCountDelta, 1);
  assert.equal(publishResult.episodeCountDelta, 3);
  assert.equal(state.mediaTitles.length, 1);
  assert.equal(state.episodes.length, 3);

  const fixtures = buildGoldenPathPublishedFixtures(state);

  const dependencies = {
    repository: {
      async queryPublishedCatalog() {
        return fixtures.page;
      },
      async queryAdminPublishedCatalog() {
        throw new Error("admin catalog read is not part of the golden validation path");
      },
      async getPublishedDetailBySlug(slug: string) {
        return slug === fixtures.detail.media.slug ? fixtures.detail : null;
      },
      async getPublishedDetailByPublicId(publicId: string) {
        return publicId === fixtures.detail.media.publicId ? fixtures.detail : null;
      },
      async getAdminPublishedCatalogDetailByPublicId() {
        throw new Error("admin catalog detail is not part of the golden validation path");
      },
      async resolvePublishedWatch(query: { mediaPublicId: string }) {
        return query.mediaPublicId === fixtures.watch.media.publicId ? fixtures.watch : null;
      },
      async getPublishedListByPublicId() {
        throw new Error("public lists are not part of the golden validation path");
      },
      async getPublishedListDirectory() {
        throw new Error("public list directory is not part of the golden validation path");
      },
      async getPublishedFeaturedLists() {
        throw new Error("featured lists are not part of the golden validation path");
      },
    },
    migration: {
      async assertPublishedCatalogRuntimeReady() {
        return {
          target: "published_catalog_runtime" as const,
          status: "ready" as const,
          reasonCode: "ready" as const,
          summary: "Golden path runtime ready.",
          expectedSchemaDigest: "golden-digest",
          checkedAt: new Date("2026-03-11T12:00:00.000Z"),
          metadata: null,
        };
      },
      async getPublishedCatalogMigrationPreflight() {
        return {
          target: "published_catalog_runtime" as const,
          status: "ready" as const,
          reasonCode: "ready" as const,
          summary: "Golden path runtime ready.",
          expectedSchemaDigest: "golden-digest",
          checkedAt: new Date("2026-03-11T12:00:00.000Z"),
          metadata: null,
        };
      },
    },
  };

  const page = await getPublishedCatalogPage({ scope: "anime" }, dependencies);
  const detail = await getPublishedCatalogDetailByPublicId(fixtures.detail.media.publicId, dependencies);
  const watch = await resolvePublishedCatalogWatch(
    {
      mediaPublicId: fixtures.watch.media.publicId,
      episodePublicId: fixtures.watch.selectedEpisode?.publicId,
      resourcePublicId: fixtures.watch.requestedResourcePublicId,
    },
    dependencies,
  );

  assert.equal(page.items.length, 1);
  assert.equal(page.items[0]?.publicId, fixtures.detail.media.publicId);
  assert.equal(page.items[0]?.episodeCountLabel, "3 episodes");

  assert.equal(detail?.media.title, "星域行者");
  assert.equal(detail?.episodes.length, 3);
  assert.equal(detail?.defaultEpisodePublicId, fixtures.watch.selectedEpisode?.publicId);

  assert.equal(watch?.selectedEpisode?.episodeNumber, 3);
  assert.equal(watch?.requestedResourcePublicId, "res_stream_primary");
  assert.equal(watch?.resolvedResourcePublicId, "res_stream_backup");
  assert.equal(watch?.selectedResource?.healthState, "healthy");
  assert.equal(watch?.streamResources[0]?.healthState, "degraded");
  assert.equal(watch?.sourceResolutionReason, "preferred_healthy");
});
