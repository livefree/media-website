import "server-only";

import type {
  PublishedCatalogPageRecord,
  PublishedCatalogQueryInput,
  PublishedDetailRecord,
  PublishedListDirectoryRecord,
  PublishedListRecord,
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
}
