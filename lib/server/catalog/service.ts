import "server-only";

import { createDefaultPublishedCatalogRepository } from "../../db/repositories/catalog";

import type {
  PublishedCatalogPageRecord,
  PublishedCatalogQueryInput,
  PublishedDetailRecord,
  PublishedListDirectoryRecord,
  PublishedListRecord,
  PublishedWatchQuery,
  PublishedWatchRecord,
} from "./types";

export async function getPublishedCatalogPage(input: PublishedCatalogQueryInput): Promise<PublishedCatalogPageRecord> {
  return createDefaultPublishedCatalogRepository().queryPublishedCatalog(input);
}

export async function getPublishedCatalogDetailBySlug(slug: string): Promise<PublishedDetailRecord | null> {
  return createDefaultPublishedCatalogRepository().getPublishedDetailBySlug(slug);
}

export async function getPublishedCatalogDetailByPublicId(publicId: string): Promise<PublishedDetailRecord | null> {
  return createDefaultPublishedCatalogRepository().getPublishedDetailByPublicId(publicId);
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
