import "server-only";

import { randomUUID } from "node:crypto";

import type { Prisma } from "@prisma/client";

import type { RepositoryContext } from "../types";
import { BaseRepository, createRepositoryContext } from "../types";
import { requireDb } from "../../client";

import type { SourceInventoryRepository as SourceInventoryRepositoryContract } from "./types";
import type { SourceHealthState } from "../../../server/provider";
import type {
  AdminSourceInventoryItemRecord,
  SourceInventoryQuery,
  SourceInventoryRecord,
  SourceOrderingOrigin,
  SourceOrderingUpdate,
  UpsertSourceInventoryInput,
} from "../../../server/source";

const resourceKindMap = {
  stream: "STREAM",
  download: "DOWNLOAD",
  subtitle: "SUBTITLE",
  trailer: "TRAILER",
} as const;

const resourceProviderMap = {
  internal: "INTERNAL",
  m3u8: "M3U8",
  mp4: "MP4",
  quark: "QUARK",
  baidu: "BAIDU",
  aliyun: "ALIYUN",
  magnet: "MAGNET",
  other: "OTHER",
} as const;

const resourceStatusMap = {
  online: "ONLINE",
  degraded: "DEGRADED",
  offline: "OFFLINE",
  reported: "REPORTED",
  pending: "PENDING",
} as const;

const sourceHealthStateMap = {
  healthy: "HEALTHY",
  degraded: "DEGRADED",
  broken: "BROKEN",
  replaced: "REPLACED",
  offline: "OFFLINE",
} as const;

const sourceOrderingOriginMap = {
  automated: "AUTOMATED",
  manual: "MANUAL",
} as const;

function toDate(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(value);
}

function mapResourceKind(value: SourceInventoryRecord["kind"]) {
  return resourceKindMap[value];
}

function mapResourceProvider(value: SourceInventoryRecord["provider"]) {
  return resourceProviderMap[value];
}

function mapResourceStatus(value: SourceInventoryRecord["status"]) {
  return resourceStatusMap[value];
}

function mapSourceHealthState(value: SourceHealthState) {
  return sourceHealthStateMap[value];
}

function mapSourceOrderingOrigin(value: SourceOrderingOrigin) {
  return sourceOrderingOriginMap[value];
}

function unmapResourceKind(value: string): SourceInventoryRecord["kind"] {
  switch (value) {
    case "STREAM":
      return "stream";
    case "DOWNLOAD":
      return "download";
    case "SUBTITLE":
      return "subtitle";
    case "TRAILER":
      return "trailer";
  }

  throw new Error(`Unsupported resource kind: ${value}`);
}

function unmapResourceProvider(value: string): SourceInventoryRecord["provider"] {
  switch (value) {
    case "INTERNAL":
      return "internal";
    case "M3U8":
      return "m3u8";
    case "MP4":
      return "mp4";
    case "QUARK":
      return "quark";
    case "BAIDU":
      return "baidu";
    case "ALIYUN":
      return "aliyun";
    case "MAGNET":
      return "magnet";
    case "OTHER":
      return "other";
  }

  throw new Error(`Unsupported resource provider: ${value}`);
}

function unmapResourceStatus(value: string): SourceInventoryRecord["status"] {
  switch (value) {
    case "ONLINE":
      return "online";
    case "DEGRADED":
      return "degraded";
    case "OFFLINE":
      return "offline";
    case "REPORTED":
      return "reported";
    case "PENDING":
      return "pending";
  }

  throw new Error(`Unsupported resource status: ${value}`);
}

function unmapSourceHealthState(value: string): SourceHealthState {
  switch (value) {
    case "HEALTHY":
      return "healthy";
    case "DEGRADED":
      return "degraded";
    case "BROKEN":
      return "broken";
    case "REPLACED":
      return "replaced";
    case "OFFLINE":
      return "offline";
  }

  throw new Error(`Unsupported source health state: ${value}`);
}

function unmapSourceOrderingOrigin(value: string): SourceOrderingOrigin {
  switch (value) {
    case "AUTOMATED":
      return "automated";
    case "MANUAL":
      return "manual";
  }

  throw new Error(`Unsupported source ordering origin: ${value}`);
}

function buildSourcePublicId() {
  return `src_${randomUUID().replace(/-/g, "").slice(0, 20)}`;
}

function mapResourceFormat(
  value: string,
  kind: SourceInventoryRecord["kind"],
): "HLS" | "MP4" | "MKV" | "HTML" | "NETDISK" | "TEXT" {
  const normalized = value.trim().toLowerCase();

  switch (normalized) {
    case "hls":
    case "m3u8":
      return "HLS";
    case "mp4":
      return "MP4";
    case "mkv":
      return "MKV";
    case "html":
      return "HTML";
    case "netdisk":
    case "cloud":
    case "folder":
      return "NETDISK";
    case "text":
    case "srt":
    case "vtt":
    case "ass":
      return "TEXT";
  }

  if (kind === "subtitle") {
    return "TEXT";
  }

  return "HTML";
}

function mapSourceInventoryRecord(
  record: Prisma.ResourceGetPayload<{
    include: {
      replacementResource: {
        select: {
          id: true;
          publicId: true;
        };
      };
    };
  }>,
): SourceInventoryRecord {
  return {
    id: record.id,
    publicId: record.publicId,
    mediaId: record.mediaId,
    episodeId: record.episodeId,
    providerId: record.providerId,
    providerItemId: record.providerItemId,
    providerLineKey: record.providerLineKey,
    kind: unmapResourceKind(record.kind),
    provider: unmapResourceProvider(record.provider),
    format: record.format.toLowerCase(),
    label: record.label,
    quality: record.quality,
    url: record.url,
    maskedUrl: record.maskedUrl,
    accessCode: record.accessCode,
    status: unmapResourceStatus(record.status),
    healthState: unmapSourceHealthState(record.healthState),
    healthSummary: record.healthSummary,
    priority: record.priority,
    mirrorOrder: record.mirrorOrder,
    isPreferred: record.isPreferred,
    orderingOrigin: unmapSourceOrderingOrigin(record.orderingOrigin),
    isActive: record.isActive,
    isPublic: record.isPublic,
    replacementResourceId: record.replacementResourceId,
    replacementPublicId: record.replacementResource?.publicId ?? null,
    lastCheckedAt: record.lastCheckedAt,
    lastHealthyAt: record.lastHealthyAt,
    failureCount: record.failureCount,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function buildSourceWhere(filters?: SourceInventoryQuery): Prisma.ResourceWhereInput {
  const search = filters?.search?.trim();

  return {
    mediaId: filters?.mediaId,
    episodeId: filters?.episodeId,
    providerId: filters?.providerId,
    kind: filters?.kind ? mapResourceKind(filters.kind) : undefined,
    healthState: filters?.healthStates?.length
      ? {
          in: filters.healthStates.map((state) => mapSourceHealthState(state)),
        }
      : undefined,
    status: filters?.statuses?.length
      ? {
          in: filters.statuses.map((status) => mapResourceStatus(status)),
        }
      : undefined,
    isActive: filters?.includeInactive ? undefined : true,
    isPublic: filters?.includePrivate ? undefined : true,
    OR: search
      ? [
          {
            label: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            media: {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  originalTitle: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
          {
            episode: {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
          {
            providerRegistry: {
              displayName: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ]
      : undefined,
  };
}

function buildEpisodeLabel(record: {
  episode?: {
    episodeNumber: number | null;
    title: string;
  } | null;
}) {
  if (!record.episode) {
    return null;
  }

  if (record.episode.episodeNumber) {
    return `E${String(record.episode.episodeNumber).padStart(2, "0")} · ${record.episode.title}`;
  }

  return record.episode.title;
}

function mapAdminSourceInventoryItemRecord(
  record: Prisma.ResourceGetPayload<{
    include: {
      replacementResource: {
        select: {
          id: true;
          publicId: true;
        };
      };
      media: {
        select: {
          publicId: true;
          title: true;
          slug: true;
        };
      };
      episode: {
        select: {
          publicId: true;
          title: true;
          episodeNumber: true;
        };
      };
      providerRegistry: {
        select: {
          adapterKey: true;
          displayName: true;
        };
      };
      repairQueueEntries: {
        select: {
          id: true;
        };
      };
    };
  }>,
): AdminSourceInventoryItemRecord {
  const base = mapSourceInventoryRecord(record);

  return {
    ...base,
    mediaPublicId: record.media.publicId,
    mediaTitle: record.media.title,
    mediaSlug: record.media.slug,
    episodePublicId: record.episode?.publicId ?? null,
    episodeTitle: record.episode?.title ?? null,
    episodeLabel: buildEpisodeLabel(record),
    providerAdapterKey: record.providerRegistry?.adapterKey ?? null,
    providerDisplayName: record.providerRegistry?.displayName ?? null,
    repairOpenCount: record.repairQueueEntries.length,
  };
}

function buildSourceOrderBy(): Prisma.ResourceOrderByWithRelationInput[] {
  return [
    { isPreferred: "desc" },
    { priority: "desc" },
    { mirrorOrder: "asc" },
    { createdAt: "asc" },
  ];
}

function buildSourceData(input: UpsertSourceInventoryInput) {
  return {
    mediaId: input.mediaId,
    episodeId: input.episodeId ?? null,
    providerId: input.providerId ?? null,
    providerItemId: input.providerItemId ?? null,
    providerLineKey: input.providerLineKey ?? null,
    kind: mapResourceKind(input.kind),
    provider: mapResourceProvider(input.provider),
    format: mapResourceFormat(input.format, input.kind),
    label: input.label,
    quality: input.quality ?? null,
    url: input.url,
    maskedUrl: input.maskedUrl ?? null,
    accessCode: input.accessCode ?? null,
    status: mapResourceStatus(input.status ?? "online"),
    healthState: mapSourceHealthState(input.healthState ?? "healthy"),
    healthSummary: input.healthSummary ?? null,
    priority: input.priority ?? 0,
    mirrorOrder: input.mirrorOrder ?? 0,
    isPreferred: input.isPreferred ?? false,
    orderingOrigin: mapSourceOrderingOrigin(input.orderingOrigin ?? "automated"),
    isActive: input.isActive ?? true,
    isPublic: input.isPublic ?? true,
    replacementResourceId: input.replacementResourceId ?? null,
    lastCheckedAt: toDate(input.lastCheckedAt),
    lastHealthyAt: toDate(input.lastHealthyAt),
    failureCount: input.failureCount ?? 0,
  };
}

export class SourceInventoryRepository extends BaseRepository implements SourceInventoryRepositoryContract {
  public constructor(context: RepositoryContext) {
    super(context);
  }

  async listSourceInventory(filters?: SourceInventoryQuery): Promise<SourceInventoryRecord[]> {
    const records = await this.db.resource.findMany({
      where: buildSourceWhere(filters),
      include: {
        replacementResource: {
          select: {
            id: true,
            publicId: true,
          },
        },
      },
      orderBy: buildSourceOrderBy(),
    });

    return records.map((record) => mapSourceInventoryRecord(record));
  }

  async listAdminSourceInventory(filters?: SourceInventoryQuery): Promise<AdminSourceInventoryItemRecord[]> {
    const records = await this.db.resource.findMany({
      where: buildSourceWhere({
        ...filters,
        includeInactive: filters?.includeInactive ?? true,
        includePrivate: filters?.includePrivate ?? true,
      }),
      include: {
        replacementResource: {
          select: {
            id: true,
            publicId: true,
          },
        },
        media: {
          select: {
            publicId: true,
            title: true,
            slug: true,
          },
        },
        episode: {
          select: {
            publicId: true,
            title: true,
            episodeNumber: true,
          },
        },
        providerRegistry: {
          select: {
            adapterKey: true,
            displayName: true,
          },
        },
        repairQueueEntries: {
          where: {
            status: {
              in: ["OPEN", "IN_PROGRESS", "WAITING_PROVIDER"],
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: buildSourceOrderBy(),
    });

    return records.map((record) => mapAdminSourceInventoryItemRecord(record));
  }

  async getSourceInventoryByPublicId(publicId: string): Promise<SourceInventoryRecord | null> {
    const record = await this.db.resource.findUnique({
      where: {
        publicId,
      },
      include: {
        replacementResource: {
          select: {
            id: true,
            publicId: true,
          },
        },
      },
    });

    return record ? mapSourceInventoryRecord(record) : null;
  }

  async upsertSourceInventory(input: UpsertSourceInventoryInput): Promise<SourceInventoryRecord> {
    const data = buildSourceData(input);
    const include = {
      replacementResource: {
        select: {
          id: true,
          publicId: true,
        },
      },
    } satisfies Prisma.ResourceInclude;

    let record:
      | Prisma.ResourceGetPayload<{
          include: typeof include;
        }>;

    if (input.id) {
      record = await this.db.resource.upsert({
        where: { id: input.id },
        create: {
          id: input.id,
          publicId: input.publicId ?? buildSourcePublicId(),
          ...data,
        },
        update: data,
        include,
      });
    } else if (input.publicId) {
      record = await this.db.resource.upsert({
        where: { publicId: input.publicId },
        create: {
          publicId: input.publicId,
          ...data,
        },
        update: data,
        include,
      });
    } else if (input.providerId && input.providerItemId && input.providerLineKey) {
      const existing = await this.db.resource.findFirst({
        where: {
          mediaId: input.mediaId,
          episodeId: input.episodeId ?? null,
          providerId: input.providerId,
          providerItemId: input.providerItemId,
          providerLineKey: input.providerLineKey,
          kind: mapResourceKind(input.kind),
        },
        include,
      });

      record = existing
        ? await this.db.resource.update({
            where: { id: existing.id },
            data,
            include,
          })
        : await this.db.resource.create({
            data: {
              publicId: input.publicId ?? buildSourcePublicId(),
              ...data,
            },
            include,
          });
    } else {
      record = await this.db.resource.create({
        data: {
          publicId: input.publicId ?? buildSourcePublicId(),
          ...data,
        },
        include,
      });
    }

    return mapSourceInventoryRecord(record);
  }

  async updateSourceOrdering(updates: SourceOrderingUpdate[]): Promise<SourceInventoryRecord[]> {
    if (updates.length === 0) {
      return [];
    }

    await Promise.all(
      updates.map((update) =>
        this.db.resource.update({
          where: { id: update.resourceId },
          data: {
            priority: update.priority,
            mirrorOrder: update.mirrorOrder,
            isPreferred: update.isPreferred,
            orderingOrigin: update.orderingOrigin ? mapSourceOrderingOrigin(update.orderingOrigin) : undefined,
          },
        }),
      ),
    );

    const records = await this.db.resource.findMany({
      where: {
        id: {
          in: updates.map((update) => update.resourceId),
        },
      },
      include: {
        replacementResource: {
          select: {
            id: true,
            publicId: true,
          },
        },
      },
      orderBy: buildSourceOrderBy(),
    });

    return records.map((record) => mapSourceInventoryRecord(record));
  }
}

export function createSourceInventoryRepository(context: RepositoryContext) {
  return new SourceInventoryRepository(context);
}

export function createDefaultSourceInventoryRepository() {
  return createSourceInventoryRepository(createRepositoryContext(requireDb()));
}

export * from "./types";
