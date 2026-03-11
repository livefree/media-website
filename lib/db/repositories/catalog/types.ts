import "server-only";

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
} from "../../../server/catalog";

export interface PublishedCatalogRepository {
  queryPublishedCatalog(input: PublishedCatalogQueryInput): Promise<PublishedCatalogPageRecord>;
  getPublishedDetailBySlug(slug: string): Promise<PublishedDetailRecord | null>;
  getPublishedDetailByPublicId(publicId: string): Promise<PublishedDetailRecord | null>;
  resolvePublishedWatch(query: PublishedWatchQuery): Promise<PublishedWatchRecord | null>;
  getPublishedListByPublicId(publicId: string): Promise<PublishedListRecord | null>;
  getPublishedListDirectory(): Promise<PublishedListDirectoryRecord>;
  getPublishedFeaturedLists(limit?: number): Promise<PublishedListSummaryRecord[]>;
}
