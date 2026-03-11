import type {
  PublishedListDirectoryRecord,
  PublishedListItemRecord,
  PublishedListRecord,
  PublishedListSummaryRecord,
} from "../lib/server/catalog/types";
import type { PublicListDirectoryRecord, PublicMediaList, PublicMediaListItem, PublicMediaListPageRecord } from "../types/media";

export type PublicListSummaryView = PublicMediaList | PublishedListSummaryRecord;
export type PublicListDirectoryView = PublicListDirectoryRecord | PublishedListDirectoryRecord;
export type PublicListPageView = PublicMediaListPageRecord | PublishedListRecord;
export type PublicListItemView = PublicMediaListItem | PublishedListItemRecord;

const PUBLIC_LIST_VISIBILITY_LABEL = "Public list";

export function getPublicListVisibilityLabel() {
  return PUBLIC_LIST_VISIBILITY_LABEL;
}

export function getPublicListFirstItemWatchHref(list: PublicListSummaryView | PublicListPageView) {
  if ("firstItemWatchHref" in list) {
    return list.firstItemWatchHref;
  }

  if ("items" in list) {
    return list.items[0]?.canonicalWatchHref;
  }

  return undefined;
}

export function getPublicListItemTitle(item: PublicListItemView) {
  return "title" in item ? item.title : item.mediaTitle;
}

export function getPublicListCoverPosterUrl(list: PublicListSummaryView | PublicListPageView) {
  return list.coverPosterUrl ?? undefined;
}

export function getPublicListItemPosterUrl(item: PublicListItemView) {
  return item.posterUrl ?? undefined;
}
