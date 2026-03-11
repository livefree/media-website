import "server-only";

import type { SourceHealthState } from "../provider";

export const sourceOrderingOrigins = ["automated", "manual"] as const;

export type SourceOrderingOrigin = (typeof sourceOrderingOrigins)[number];

export interface SourceInventoryRecord {
  id: string;
  publicId: string;
  mediaId: string;
  episodeId?: string | null;
  providerId?: string | null;
  providerItemId?: string | null;
  providerLineKey?: string | null;
  kind: "stream" | "download" | "subtitle" | "trailer";
  provider: "internal" | "m3u8" | "mp4" | "quark" | "baidu" | "aliyun" | "magnet" | "other";
  format: string;
  label: string;
  quality?: string | null;
  url: string;
  maskedUrl?: string | null;
  accessCode?: string | null;
  status: "online" | "degraded" | "offline" | "reported" | "pending";
  healthState: SourceHealthState;
  healthSummary?: string | null;
  priority: number;
  mirrorOrder: number;
  isPreferred: boolean;
  orderingOrigin: SourceOrderingOrigin;
  isActive: boolean;
  isPublic: boolean;
  replacementResourceId?: string | null;
  replacementPublicId?: string | null;
  lastCheckedAt?: Date | null;
  lastHealthyAt?: Date | null;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertSourceInventoryInput {
  id?: string;
  publicId?: string;
  mediaId: string;
  episodeId?: string | null;
  providerId?: string | null;
  providerItemId?: string | null;
  providerLineKey?: string | null;
  kind: SourceInventoryRecord["kind"];
  provider: SourceInventoryRecord["provider"];
  format: string;
  label: string;
  quality?: string | null;
  url: string;
  maskedUrl?: string | null;
  accessCode?: string | null;
  status?: SourceInventoryRecord["status"];
  healthState?: SourceHealthState;
  healthSummary?: string | null;
  priority?: number;
  mirrorOrder?: number;
  isPreferred?: boolean;
  orderingOrigin?: SourceOrderingOrigin;
  isActive?: boolean;
  isPublic?: boolean;
  replacementResourceId?: string | null;
  lastCheckedAt?: string;
  lastHealthyAt?: string;
  failureCount?: number;
}

export interface SourceOrderingUpdate {
  resourceId: string;
  priority: number;
  mirrorOrder?: number;
  isPreferred?: boolean;
  orderingOrigin?: SourceOrderingOrigin;
}
