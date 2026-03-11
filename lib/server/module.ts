import "server-only";

import type { BackendModuleBoundary } from "../../types/backend";

export function defineServerModule(boundary: BackendModuleBoundary): BackendModuleBoundary {
  return boundary;
}
