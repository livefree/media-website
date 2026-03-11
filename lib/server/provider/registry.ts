import "server-only";

import { BackendError } from "../errors";

import type { ProviderAdapter } from "./types";

export class ProviderRegistry {
  readonly #adapters: Map<string, ProviderAdapter>;

  constructor(adapters: ProviderAdapter[] = []) {
    this.#adapters = new Map();

    for (const adapter of adapters) {
      this.register(adapter);
    }
  }

  register(adapter: ProviderAdapter): void {
    if (this.#adapters.has(adapter.metadata.key)) {
      throw new BackendError(`Provider adapter '${adapter.metadata.key}' is already registered.`, {
        status: 500,
        code: "provider_registry_duplicate",
      });
    }

    this.#adapters.set(adapter.metadata.key, adapter);
  }

  get(providerKey: string): ProviderAdapter {
    const adapter = this.#adapters.get(providerKey);

    if (!adapter) {
      throw new BackendError(`Provider adapter '${providerKey}' is not registered.`, {
        status: 404,
        code: "provider_not_registered",
      });
    }

    return adapter;
  }

  list(): ProviderAdapter[] {
    return [...this.#adapters.values()];
  }
}

export function createProviderRegistry(adapters: ProviderAdapter[] = []): ProviderRegistry {
  return new ProviderRegistry(adapters);
}
