import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createProviderFetchContext, createProviderRuntimeContext } from "../provider/adapter";
import { jszyapiVodJsonProviderAdapter } from "../provider/jszyapi";
import { applyCatalogPublication } from "./publish";
import {
  buildGoldenPathNormalizationRecord,
  buildGoldenPathPublishedFixtures,
  buildPersistedNormalizationArtifacts,
  createGoldenPathPublishMemoryDb,
} from "./e2e-validation";
import {
  getFinalLaunchValidation,
  getPublishedCatalogDetailByPublicId,
  getPublishedCatalogPage,
  resolvePublishedCatalogWatch,
} from "./service";
import { buildIngestLaunchValidationEvidence } from "../ingest/launch-validation";

import type { ProviderHttpClient } from "../provider/types";

async function withAdminAccessStub<T>(fn: () => Promise<T>) {
  const previousRole = process.env.ADMIN_ACCESS_STUB_ROLE;
  const previousActorId = process.env.ADMIN_ACCESS_STUB_ACTOR_ID;
  process.env.ADMIN_ACCESS_STUB_ROLE = "operator";
  process.env.ADMIN_ACCESS_STUB_ACTOR_ID = "operator-golden";

  try {
    return await fn();
  } finally {
    if (previousRole) {
      process.env.ADMIN_ACCESS_STUB_ROLE = previousRole;
    } else {
      delete process.env.ADMIN_ACCESS_STUB_ROLE;
    }

    if (previousActorId) {
      process.env.ADMIN_ACCESS_STUB_ACTOR_ID = previousActorId;
    } else {
      delete process.env.ADMIN_ACCESS_STUB_ACTOR_ID;
    }
  }
}

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

function createGoldenNormalizedDraft(stagedItem: { providerItemId: string; title: string; originalTitle?: string | null; summary?: string | null; region?: string | null; language?: string | null }) {
  return {
    stagingCandidateId: `staging-${stagedItem.providerItemId}`,
    providerId: "provider-jszyapi",
    providerItemId: stagedItem.providerItemId,
    title: {
      display: "星域行者",
      comparable: "星域行者",
    },
    originalTitle: stagedItem.originalTitle
      ? {
          display: stagedItem.originalTitle,
          comparable: stagedItem.originalTitle,
        }
      : undefined,
    aliases: [
      {
        source: "title" as const,
        display: stagedItem.title,
        comparable: stagedItem.title,
      },
      {
        source: "derived" as const,
        display: "星域行者",
        comparable: "星域行者",
      },
    ],
    summary: stagedItem.summary ?? null,
    mediaType: "anime" as const,
    releaseYear: 2026,
    region: stagedItem.region ?? undefined,
    language: stagedItem.language ?? undefined,
    seasonEpisodeHints: {
      isEpisodic: true,
      seasonNumbers: [1],
      episodeNumbers: [1, 2, 3],
      totalEpisodeCount: 3,
      latestEpisodeNumber: 3,
      notes: [],
    },
    sourceSummary: {
      fragmentCount: 3,
      streamCount: 3,
      downloadCount: 0,
      subtitleCount: 0,
      languages: [],
      qualities: [],
      providerLineKeys: ["main", "backup", "备用线路"],
    },
    warnings: [],
    evidence: {
      rawCategory: "anime",
      rawEpisodeText: "更新至03集",
      sourceFragmentCount: 3,
    },
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
  const normalized = createGoldenNormalizedDraft(stagedItem);

  assert.equal(normalizationRecord.providerItemId, stagedItem.providerItemId);
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
      async hidePublishedCatalogRecord() {
        throw new Error("admin catalog visibility control is not part of the golden validation path");
      },
      async restorePublishedCatalogVisibility() {
        throw new Error("admin catalog visibility control is not part of the golden validation path");
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

test("final launch validation aggregates accepted launch evidence into one ready backend record", async () => {
  const payload = await loadFixture();
  const http: ProviderHttpClient = {
    async fetchJson() {
      return payload;
    },
    async fetchText() {
      throw new Error("fetchText should not be called in the launch validation path.");
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

  assert.ok(stagedItem, "expected the launch-validation fixture item to be present");

  const normalizationRecord = buildGoldenPathNormalizationRecord("provider-jszyapi", stagedItem);
  const normalized = createGoldenNormalizedDraft(stagedItem);

  assert.equal(normalizationRecord.providerItemId, stagedItem.providerItemId);

  const { candidate, aliases } = buildPersistedNormalizationArtifacts(normalized);
  const { db, state } = createGoldenPathPublishMemoryDb();
  await applyCatalogPublication(db, {
    decisionType: "approve",
    normalizedCandidate: candidate,
    aliases,
    actorId: "operator-golden",
    performedAt: new Date("2026-03-11T12:00:00.000Z"),
  });

  const fixtures = buildGoldenPathPublishedFixtures(state);
  const dependencies = {
    repository: {
      async queryPublishedCatalog() {
        return fixtures.page;
      },
      async queryAdminPublishedCatalog() {
        return {
          title: "Published Catalog",
          description: "Admin published catalog view.",
          appliedFilters: {},
          page: 1,
          pageSize: 1,
          summary: {
            totalItems: 1,
            totalPages: 1,
            titlesWithRepairs: 0,
            titlesWithHealthyStreams: 1,
            episodicTitles: 1,
          },
          items: [
            {
              publicId: fixtures.detail.media.publicId,
              canonicalWatchHref: fixtures.detail.media.canonicalWatchHref,
              title: fixtures.detail.media.title,
            },
          ],
        };
      },
      async getPublishedDetailByPublicId(publicId: string) {
        return publicId === fixtures.detail.media.publicId ? fixtures.detail : null;
      },
      async resolvePublishedWatch(query: { mediaPublicId: string }) {
        return query.mediaPublicId === fixtures.watch.media.publicId ? fixtures.watch : null;
      },
    },
    migration: {
      async getPublishedCatalogMigrationPreflight() {
        return {
          target: "published_catalog_runtime" as const,
          status: "ready" as const,
          reasonCode: "ready" as const,
          summary: "Ready.",
          expectedSchemaDigest: "golden-digest",
          checkedAt: new Date("2026-03-11T12:00:00.000Z"),
          metadata: null,
        };
      },
    },
    health: {
      async getIngestLaunchValidationEvidence() {
        return buildIngestLaunchValidationEvidence({
          checkedAt: new Date("2026-03-11T12:00:00.000Z"),
          acceptedProviderLane: {
            providerKey: "jszyapi_vod_json",
            adapterKey: "jszyapi_vod_json",
            displayName: "jszyapi Base VOD JSON",
            accepted: true,
          },
          providerExecution: {
            lastSuccessfulPageIngestAt: new Date("2026-03-11T11:30:00.000Z"),
          },
          schedule: {
            enabled: true,
            lastIncrementalCompletedAt: new Date("2026-03-11T11:40:00.000Z"),
            lastBackfillCompletedAt: new Date("2026-03-10T11:40:00.000Z"),
          },
          queueTelemetry: {
            failures: [],
          },
          probeRecovery: {
            latestRefreshObservedAt: new Date("2026-03-11T11:45:00.000Z"),
            latestRefreshObservedState: "healthy",
            latestProbeObservedAt: new Date("2026-03-11T11:50:00.000Z"),
            latestProbeObservedState: "healthy",
            openRepairCount: 0,
          },
        });
      },
      async getRecoveryReadiness() {
        return {
          state: "ready" as const,
          reasonCode: "ready" as const,
          summary: "Recovery readiness is healthy.",
          checkedAt: new Date("2026-03-11T12:00:00.000Z"),
          policy: {
            backupMaxAgeHours: 48,
            restoreMaxAgeHours: 336,
          },
          backupArtifact: {
            id: "backup-1",
            artifactKey: "backup-2026-03-11",
            summary: "Nightly backup completed.",
            completedAt: new Date("2026-03-11T08:00:00.000Z"),
          },
          latestRestoreRehearsal: {
            id: "restore-1",
            status: "succeeded" as const,
            summary: "Restore rehearsal completed successfully.",
            rehearsedAt: new Date("2026-03-10T12:00:00.000Z"),
          },
          contributingReasonCodes: ["ready" as const],
          backupAgeHours: 4,
          restoreAgeHours: 24,
        };
      },
      async listAdminQueueFailures() {
        return [];
      },
      async listAdminRepairQueue() {
        return [];
      },
    },
  };

  await withAdminAccessStub(async () => {
    const validation = await getFinalLaunchValidation(dependencies as never);

    assert.equal(validation.state, "ready");
    assert.equal(validation.reasonCode, "ready");
    assert.equal(validation.catalogEvidence.sampleMediaPublicId, fixtures.detail.media.publicId);
    assert.equal(validation.catalogEvidence.sampleSelectedResourceHealthState, "healthy");
    assert.deepEqual(
      validation.domains.map((domain) => ({ domain: domain.domain, state: domain.state })),
      [
        { domain: "ingest", state: "ready" },
        { domain: "catalog_publishing", state: "ready" },
        { domain: "source_health", state: "ready" },
        { domain: "admin_access", state: "ready" },
        { domain: "guardrails", state: "ready" },
      ],
    );
  });
});
