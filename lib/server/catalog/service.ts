import "server-only";

import {
  hasSufficientAdminRole,
  requirePrivilegedAdminAccess,
  resolveAdminAccessFromValues,
} from "../admin/access";

import {
  assertMigrationPreflightReady,
  getMigrationPreflightRecord,
  type MigrationPreflightRecord,
} from "../../db/migration-safety";
import { buildFinalLaunchValidationRecord } from "../../db/final-launch-validation";
import { createDefaultSourceHealthRepository } from "../../db/repositories/health";
import type {
  AdminPublishedCatalogDetailRecord,
  AdminPublishedCatalogPageRecord,
  AdminPublishedCatalogQuery,
} from "../admin";

import type {
  PublishedCatalogPageRecord,
  PublishedCatalogQueryInput,
  PublishedDetailRecord,
  PublishedFeaturedListDiscoveryRecord,
  PublishedListDirectoryRecord,
  PublishedListRecord,
  PublishedListSummaryRecord,
  HidePublishedCatalogInput,
  HidePublishedCatalogResult,
  RestorePublishedCatalogVisibilityInput,
  RestorePublishedCatalogVisibilityResult,
  UnpublishPublishedCatalogInput,
  UnpublishPublishedCatalogResult,
  PublishedWatchQuery,
  PublishedWatchRecord,
  FinalLaunchValidationRecord,
} from "./types";
import { runInTransaction } from "../../db/transactions";
import { createPublishedCatalogRepository } from "../../db/repositories/catalog";
import type {
  AdminQueueFailureItemRecord,
  AdminRepairQueueItemRecord,
  RecoveryReadinessRecord,
} from "../health";
import type { IngestLaunchValidationEvidenceRecord } from "../ingest/launch-validation";

interface PublishedCatalogServiceDependencies {
  repository: {
    queryPublishedCatalog(input: PublishedCatalogQueryInput): Promise<PublishedCatalogPageRecord>;
    queryAdminPublishedCatalog(input?: AdminPublishedCatalogQuery): Promise<AdminPublishedCatalogPageRecord>;
    getPublishedDetailBySlug(slug: string): Promise<PublishedDetailRecord | null>;
    getPublishedDetailByPublicId(publicId: string): Promise<PublishedDetailRecord | null>;
    getAdminPublishedCatalogDetailByPublicId(publicId: string): Promise<AdminPublishedCatalogDetailRecord | null>;
    resolvePublishedWatch(query: PublishedWatchQuery): Promise<PublishedWatchRecord | null>;
    getPublishedListByPublicId(publicId: string): Promise<PublishedListRecord | null>;
    getPublishedListDirectory(): Promise<PublishedListDirectoryRecord>;
    getPublishedFeaturedLists(limit?: number): Promise<PublishedListSummaryRecord[]>;
    hidePublishedCatalogRecord(input: HidePublishedCatalogInput): Promise<HidePublishedCatalogResult>;
    restorePublishedCatalogVisibility(
      input: RestorePublishedCatalogVisibilityInput,
    ): Promise<RestorePublishedCatalogVisibilityResult>;
    unpublishPublishedCatalogRecord(input: UnpublishPublishedCatalogInput): Promise<UnpublishPublishedCatalogResult>;
  };
  migration: {
    assertPublishedCatalogRuntimeReady(): Promise<MigrationPreflightRecord>;
    getPublishedCatalogMigrationPreflight(): Promise<MigrationPreflightRecord>;
  };
}

interface FinalLaunchValidationServiceDependencies {
  repository: Pick<
    PublishedCatalogServiceDependencies["repository"],
    "queryPublishedCatalog" | "queryAdminPublishedCatalog" | "getPublishedDetailByPublicId" | "resolvePublishedWatch"
  >;
  migration: {
    getPublishedCatalogMigrationPreflight(): Promise<MigrationPreflightRecord>;
  };
  health: {
    getIngestLaunchValidationEvidence(): Promise<IngestLaunchValidationEvidenceRecord>;
    getRecoveryReadiness(): Promise<RecoveryReadinessRecord>;
    listAdminQueueFailures(): Promise<AdminQueueFailureItemRecord[]>;
    listAdminRepairQueue(): Promise<AdminRepairQueueItemRecord[]>;
  };
}

async function getDefaultPublishedCatalogDependencies(): Promise<PublishedCatalogServiceDependencies> {
  const { createDefaultPublishedCatalogRepository } = await import("../../db/repositories/catalog");
  const repository = createDefaultPublishedCatalogRepository();

  return {
    repository,
    migration: {
      assertPublishedCatalogRuntimeReady: () => assertMigrationPreflightReady("published_catalog_runtime"),
      getPublishedCatalogMigrationPreflight: () => getMigrationPreflightRecord("published_catalog_runtime"),
    },
  };
}

async function getDefaultFinalLaunchValidationDependencies(): Promise<FinalLaunchValidationServiceDependencies> {
  const { createDefaultPublishedCatalogRepository } = await import("../../db/repositories/catalog");
  const repository = createDefaultPublishedCatalogRepository();
  const healthRepository = createDefaultSourceHealthRepository();

  return {
    repository,
    migration: {
      getPublishedCatalogMigrationPreflight: () => getMigrationPreflightRecord("published_catalog_runtime"),
    },
    health: {
      getIngestLaunchValidationEvidence: () => healthRepository.getIngestLaunchValidationEvidence(),
      getRecoveryReadiness: () => healthRepository.getRecoveryReadiness(),
      listAdminQueueFailures: () => healthRepository.listAdminQueueFailures(),
      listAdminRepairQueue: () => healthRepository.listAdminRepairQueue(),
    },
  };
}

function buildAdminAccessEvidence(access: ReturnType<typeof requirePrivilegedAdminAccess>) {
  return {
    currentActorId: access.actorId ?? null,
    currentRole: access.role ?? null,
    currentSource: access.source,
    privilegedSessionValidated: hasSufficientAdminRole(access.role, "operator"),
    anonymousDenied: !hasSufficientAdminRole(resolveAdminAccessFromValues({}).role, "operator"),
    viewerDenied: !hasSufficientAdminRole(resolveAdminAccessFromValues({ envRole: "viewer" }).role, "operator"),
    operatorAllowed: hasSufficientAdminRole(resolveAdminAccessFromValues({ envRole: "operator" }).role, "operator"),
  };
}

function buildHealthEvidence(
  queueFailures: AdminQueueFailureItemRecord[],
  repairQueue: AdminRepairQueueItemRecord[],
) {
  return {
    queueFailureCount: queueFailures.length,
    failedQueueFailureCount: queueFailures.filter((item) => item.visibilityState === "failed").length,
    retryingQueueFailureCount: queueFailures.filter((item) => item.visibilityState === "retrying").length,
    openRepairCount: repairQueue.filter((item) => item.status === "open").length,
    inProgressRepairCount: repairQueue.filter((item) => item.status === "in_progress").length,
    waitingProviderRepairCount: repairQueue.filter((item) => item.status === "waiting_provider").length,
  };
}

export async function getFinalLaunchValidation(
  dependencies?: FinalLaunchValidationServiceDependencies,
): Promise<FinalLaunchValidationRecord> {
  const access = requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultFinalLaunchValidationDependencies());
  const [ingestValidation, migrationPreflight, recoveryReadiness, queueFailures, repairQueue, publicPage, adminPage] =
    await Promise.all([
      resolvedDependencies.health.getIngestLaunchValidationEvidence(),
      resolvedDependencies.migration.getPublishedCatalogMigrationPreflight(),
      resolvedDependencies.health.getRecoveryReadiness(),
      resolvedDependencies.health.listAdminQueueFailures(),
      resolvedDependencies.health.listAdminRepairQueue(),
      resolvedDependencies.repository.queryPublishedCatalog({
        scope: "all",
        page: 1,
        pageSize: 1,
      }),
      resolvedDependencies.repository.queryAdminPublishedCatalog({
        page: 1,
        pageSize: 1,
      }),
    ]);

  const sampleCard = publicPage.items[0] ?? null;
  const sampleAdminItem = adminPage.items[0] ?? null;
  const sampleMediaPublicId = sampleCard?.publicId ?? sampleAdminItem?.publicId ?? null;
  const detail = sampleMediaPublicId
    ? await resolvedDependencies.repository.getPublishedDetailByPublicId(sampleMediaPublicId)
    : null;
  const watch = sampleMediaPublicId
    ? await resolvedDependencies.repository.resolvePublishedWatch({
        mediaPublicId: sampleMediaPublicId,
        episodePublicId: detail?.defaultEpisodePublicId,
      })
    : null;

  return buildFinalLaunchValidationRecord({
    ingestValidation,
    migrationPreflight,
    recoveryReadiness,
    adminAccessEvidence: buildAdminAccessEvidence(access),
    healthEvidence: buildHealthEvidence(queueFailures, repairQueue),
    catalogEvidence: {
      adminPublishedCount: adminPage.summary.totalItems,
      publicPublishedCount: publicPage.totalItems,
      sampleMediaPublicId,
      sampleMediaTitle: sampleCard?.title ?? sampleAdminItem?.title ?? null,
      sampleCanonicalWatchHref: sampleCard?.canonicalWatchHref ?? sampleAdminItem?.canonicalWatchHref ?? null,
      sampleDetailAvailable: Boolean(detail),
      sampleWatchAvailable: Boolean(watch),
      sampleSourceResolutionReason: watch?.sourceResolutionReason ?? null,
      sampleSelectedResourceHealthState: watch?.selectedResource?.healthState ?? null,
    },
  });
}

export async function getPublishedCatalogMigrationPreflight(
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<MigrationPreflightRecord> {
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  return resolvedDependencies.migration.getPublishedCatalogMigrationPreflight();
}

export async function getPublishedCatalogPage(
  input: PublishedCatalogQueryInput,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<PublishedCatalogPageRecord> {
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  await resolvedDependencies.migration.assertPublishedCatalogRuntimeReady();
  return resolvedDependencies.repository.queryPublishedCatalog(input);
}

export async function getAdminPublishedCatalogPage(
  input: AdminPublishedCatalogQuery = {},
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<AdminPublishedCatalogPageRecord> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  await resolvedDependencies.migration.assertPublishedCatalogRuntimeReady();
  return resolvedDependencies.repository.queryAdminPublishedCatalog(input);
}

export async function getPublishedCatalogDetailBySlug(
  slug: string,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<PublishedDetailRecord | null> {
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  await resolvedDependencies.migration.assertPublishedCatalogRuntimeReady();
  return resolvedDependencies.repository.getPublishedDetailBySlug(slug);
}

export async function getPublishedCatalogDetailByPublicId(
  publicId: string,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<PublishedDetailRecord | null> {
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  await resolvedDependencies.migration.assertPublishedCatalogRuntimeReady();
  return resolvedDependencies.repository.getPublishedDetailByPublicId(publicId);
}

export async function getAdminPublishedCatalogDetailByPublicId(
  publicId: string,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<AdminPublishedCatalogDetailRecord | null> {
  requirePrivilegedAdminAccess("operator");
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  await resolvedDependencies.migration.assertPublishedCatalogRuntimeReady();
  return resolvedDependencies.repository.getAdminPublishedCatalogDetailByPublicId(publicId);
}

export async function resolvePublishedCatalogWatch(
  query: PublishedWatchQuery,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<PublishedWatchRecord | null> {
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  await resolvedDependencies.migration.assertPublishedCatalogRuntimeReady();
  return resolvedDependencies.repository.resolvePublishedWatch(query);
}

export async function getPublishedCatalogListByPublicId(
  publicId: string,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<PublishedListRecord | null> {
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  await resolvedDependencies.migration.assertPublishedCatalogRuntimeReady();
  return resolvedDependencies.repository.getPublishedListByPublicId(publicId);
}

export async function getPublishedCatalogListDirectory(
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<PublishedListDirectoryRecord> {
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  await resolvedDependencies.migration.assertPublishedCatalogRuntimeReady();
  return resolvedDependencies.repository.getPublishedListDirectory();
}

export async function getPublishedCatalogFeaturedLists(
  limit = 3,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<PublishedListSummaryRecord[]> {
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  await resolvedDependencies.migration.assertPublishedCatalogRuntimeReady();
  return resolvedDependencies.repository.getPublishedFeaturedLists(limit);
}

export async function getPublishedCatalogFeaturedListDiscovery(
  limit = 3,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<PublishedFeaturedListDiscoveryRecord> {
  const resolvedDependencies = dependencies ?? (await getDefaultPublishedCatalogDependencies());
  await resolvedDependencies.migration.assertPublishedCatalogRuntimeReady();

  return {
    title: "Featured Lists",
    description: "Public featured list discovery backed by published canonical catalog records.",
    items: await resolvedDependencies.repository.getPublishedFeaturedLists(limit),
  };
}

export async function unpublishPublishedCatalogRecord(
  input: UnpublishPublishedCatalogInput,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<UnpublishPublishedCatalogResult> {
  requirePrivilegedAdminAccess("operator");

  if (dependencies) {
    return dependencies.repository.unpublishPublishedCatalogRecord(input);
  }

  return runInTransaction(
    {
      name: "catalog.unpublishPublishedCatalogRecord",
    },
    async (context) => createPublishedCatalogRepository(context).unpublishPublishedCatalogRecord(input),
    {
      actorId: input.actorId,
      requestId: input.requestId,
    },
  );
}

export async function hidePublishedCatalogRecord(
  input: HidePublishedCatalogInput,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<HidePublishedCatalogResult> {
  requirePrivilegedAdminAccess("operator");

  if (dependencies) {
    return dependencies.repository.hidePublishedCatalogRecord(input);
  }

  return runInTransaction(
    {
      name: "catalog.hidePublishedCatalogRecord",
    },
    async (context) => createPublishedCatalogRepository(context).hidePublishedCatalogRecord(input),
    {
      actorId: input.actorId,
      requestId: input.requestId,
    },
  );
}

export async function restorePublishedCatalogVisibility(
  input: RestorePublishedCatalogVisibilityInput,
  dependencies?: PublishedCatalogServiceDependencies,
): Promise<RestorePublishedCatalogVisibilityResult> {
  requirePrivilegedAdminAccess("operator");

  if (dependencies) {
    return dependencies.repository.restorePublishedCatalogVisibility(input);
  }

  return runInTransaction(
    {
      name: "catalog.restorePublishedCatalogVisibility",
    },
    async (context) => createPublishedCatalogRepository(context).restorePublishedCatalogVisibility(input),
    {
      actorId: input.actorId,
      requestId: input.requestId,
    },
  );
}
