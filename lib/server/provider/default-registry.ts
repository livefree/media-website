import "server-only";

import { createProviderRegistry } from "./registry";
import { jszyapiVodJsonProviderAdapter } from "./jszyapi";

export function createDefaultProviderRegistry() {
  return createProviderRegistry([jszyapiVodJsonProviderAdapter]);
}
