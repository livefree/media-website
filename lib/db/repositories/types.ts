import "server-only";

import type { Prisma, PrismaClient } from "@prisma/client";

import type { RequestContextMetadata } from "../../../types/backend";

export type DbExecutor = PrismaClient | Prisma.TransactionClient;

export interface RepositoryContext extends RequestContextMetadata {
  db: DbExecutor;
}

export function createRepositoryContext(db: DbExecutor, metadata: RequestContextMetadata = {}): RepositoryContext {
  return {
    db,
    actorId: metadata.actorId,
    requestId: metadata.requestId,
  };
}

export abstract class BaseRepository {
  protected readonly context: RepositoryContext;

  protected constructor(context: RepositoryContext) {
    this.context = context;
  }

  protected get db(): DbExecutor {
    return this.context.db;
  }
}
