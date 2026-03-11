import "server-only";

import { BackendError } from "../errors";
import { logger } from "../logging";

import type { ProviderHttpClient } from "./types";

const providerHttpLogger = logger.child({ subsystem: "provider.http" });

async function readResponseBody(response: Response): Promise<string> {
  const body = await response.text();

  if (!response.ok) {
    throw new BackendError("Provider request failed.", {
      status: 502,
      code: "provider_request_failed",
      details: {
        status: response.status,
        statusText: response.statusText,
        bodyPreview: body.slice(0, 500),
      },
    });
  }

  return body;
}

export function createProviderHttpClient(fetchImpl: typeof fetch = fetch): ProviderHttpClient {
  return {
    async fetchJson<T>(url: string, init?: RequestInit) {
      providerHttpLogger.debug("Fetching provider json payload", { url, method: init?.method ?? "GET" });
      const response = await fetchImpl(url, init);
      const body = await readResponseBody(response);

      try {
        return JSON.parse(body) as T;
      } catch (error) {
        throw new BackendError("Provider response was not valid JSON.", {
          status: 502,
          code: "provider_invalid_json",
          details: {
            url,
            bodyPreview: body.slice(0, 500),
            reason: error instanceof Error ? error.message : "unknown",
          },
        });
      }
    },
    async fetchText(url: string, init?: RequestInit) {
      providerHttpLogger.debug("Fetching provider text payload", { url, method: init?.method ?? "GET" });
      const response = await fetchImpl(url, init);
      return readResponseBody(response);
    },
  };
}
