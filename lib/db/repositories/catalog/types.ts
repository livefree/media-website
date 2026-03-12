import "server-only";

import type {
  AdminPublishedCatalogDetailRecord,
  AdminPublishedCatalogPageRecord,
  AdminPublishedCatalogQuery,
} from "../../../server/admin";
import type {
  HidePublishedCatalogInput,
  HidePublishedCatalogResult,
  PublishedCatalogPageRecord,
  PublishedCatalogQueryInput,
  PublishedDetailRecord,
  PublishedFeaturedListDiscoveryRecord,
  PublishedListDirectoryRecord,
  PublishedListRecord,
  PublishedListSummaryRecord,
  RestorePublishedCatalogVisibilityInput,
  RestorePublishedCatalogVisibilityResult,
  UnpublishPublishedCatalogInput,
  UnpublishPublishedCatalogResult,
  PublishedWatchQuery,
  PublishedWatchRecord,
} from "../../../server/catalog";

export interface PublishedCatalogRepository {
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
  restorePublishedCatalogVisibility(input: RestorePublishedCatalogVisibilityInput): Promise<RestorePublishedCatalogVisibilityResult>;
  unpublishPublishedCatalogRecord(input: UnpublishPublishedCatalogInput): Promise<UnpublishPublishedCatalogResult>;
}
