import "server-only";

import type { PersistedCandidateAliasRecord, PersistedNormalizedCandidateRecord } from "../../db/repositories/normalization/types";
import type { ReviewDecisionType } from "../review";

export interface CatalogPublishInput {
  decisionType: Exclude<ReviewDecisionType, "reject">;
  normalizedCandidate: PersistedNormalizedCandidateRecord;
  aliases: PersistedCandidateAliasRecord[];
  targetCanonicalMediaId?: string;
  actorId?: string;
  performedAt: Date;
}

export interface CatalogPublishResult {
  mediaId: string;
  action: "created" | "merged" | "replaced" | "unpublished";
  alternateTitleCount: number;
  seasonCountDelta: number;
  episodeCountDelta: number;
}
