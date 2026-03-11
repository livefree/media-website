import "server-only";

import { requireDb } from "../client";
import { createRepositoryContext, type RepositoryContext } from "../repositories";
import { logger } from "../../server/logging";

import type { RequestContextMetadata, TransactionBoundaryOptions } from "../../../types/backend";

const transactionLogger = logger.child({ subsystem: "db.transactions" });

export async function runInTransaction<T>(
  options: TransactionBoundaryOptions,
  callback: (context: RepositoryContext) => Promise<T>,
  metadata: RequestContextMetadata = {},
): Promise<T> {
  const db = requireDb();

  return db.$transaction(
    async (transaction) => {
      transactionLogger.debug("Opening transaction boundary", {
        name: options.name,
        actorId: metadata.actorId,
        requestId: metadata.requestId,
      });

      return callback(createRepositoryContext(transaction, metadata));
    },
    {
      maxWait: options.maxWaitMs,
      timeout: options.timeoutMs,
    },
  );
}
