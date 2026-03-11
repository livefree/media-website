import "server-only";

import { requirePrivilegedAdminAccess } from "../admin/access";

import {
  assertMigrationPreflightReady,
  getMigrationPreflightRecord,
  type MigrationPreflightRecord,
} from "../../db/migration-safety";
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
  PublishedWatchQuery,
  PublishedWatchRecord,
} from "./types";

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
  };
  migration: {
    assertPublishedCatalogRuntimeReady(): Promise<MigrationPreflightRecord>;
    getPublishedCatalogMigrationPreflight(): Promise<MigrationPreflightRecord>;
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
