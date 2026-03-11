import "server-only";

import { createDefaultPublishedCatalogRepository } from "../../db/repositories/catalog";
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

export async function getPublishedCatalogPage(input: PublishedCatalogQueryInput): Promise<PublishedCatalogPageRecord> {
  return createDefaultPublishedCatalogRepository().queryPublishedCatalog(input);
}

export async function getAdminPublishedCatalogPage(input: AdminPublishedCatalogQuery = {}): Promise<AdminPublishedCatalogPageRecord> {
  return createDefaultPublishedCatalogRepository().queryAdminPublishedCatalog(input);
}

export async function getPublishedCatalogDetailBySlug(slug: string): Promise<PublishedDetailRecord | null> {
  return createDefaultPublishedCatalogRepository().getPublishedDetailBySlug(slug);
}

export async function getPublishedCatalogDetailByPublicId(publicId: string): Promise<PublishedDetailRecord | null> {
  return createDefaultPublishedCatalogRepository().getPublishedDetailByPublicId(publicId);
}

export async function getAdminPublishedCatalogDetailByPublicId(publicId: string): Promise<AdminPublishedCatalogDetailRecord | null> {
  return createDefaultPublishedCatalogRepository().getAdminPublishedCatalogDetailByPublicId(publicId);
}

export async function resolvePublishedCatalogWatch(query: PublishedWatchQuery): Promise<PublishedWatchRecord | null> {
  return createDefaultPublishedCatalogRepository().resolvePublishedWatch(query);
}

export async function getPublishedCatalogListByPublicId(publicId: string): Promise<PublishedListRecord | null> {
  return createDefaultPublishedCatalogRepository().getPublishedListByPublicId(publicId);
}

export async function getPublishedCatalogListDirectory(): Promise<PublishedListDirectoryRecord> {
  return createDefaultPublishedCatalogRepository().getPublishedListDirectory();
}

export async function getPublishedCatalogFeaturedLists(limit = 3): Promise<PublishedListSummaryRecord[]> {
  return createDefaultPublishedCatalogRepository().getPublishedFeaturedLists(limit);
}

export async function getPublishedCatalogFeaturedListDiscovery(limit = 3): Promise<PublishedFeaturedListDiscoveryRecord> {
  return {
    title: "Featured Lists",
    description: "Public featured list discovery backed by published canonical catalog records.",
    items: await getPublishedCatalogFeaturedLists(limit),
  };
}
