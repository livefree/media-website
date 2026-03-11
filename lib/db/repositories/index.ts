import "server-only";

import { requireDb } from "../client";

export * from "./types";

import { createRepositoryContext } from "./types";

export const repositoryNamespaces = ["catalog", "ingest", "review", "source", "health", "search"] as const;

export type RepositoryNamespace = (typeof repositoryNamespaces)[number];

export function createDefaultRepositoryContext(metadata?: { actorId?: string; requestId?: string }) {
  return createRepositoryContext(requireDb(), metadata);
}
