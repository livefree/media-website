import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import type { AdminQueueFailureMonitoringPageRecord } from "../../lib/server/admin";

const cssStubSource = "export default new Proxy({}, { get: (_, prop) => String(prop) });";
const linkStubSource = `
  export default function Link({ children }) {
    return children ?? null;
  }
`;

function createDataModuleUrl(source: string) {
  return `data:text/javascript,${encodeURIComponent(source)}`;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/link") {
      return {
        shortCircuit: true,
        url: createDataModuleUrl(linkStubSource),
      };
    }

    if (specifier.endsWith(".module.css")) {
      return {
        shortCircuit: true,
        url: createDataModuleUrl(cssStubSource),
      };
    }

    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
      const parentPath = fileURLToPath(context.parentURL);
      const basePath = path.resolve(path.dirname(parentPath), specifier);
      const withKnownExtension = [".tsx", ".ts", ".js"].find((extension) => existsSync(`${basePath}${extension}`));

      if (withKnownExtension) {
        return {
          shortCircuit: true,
          url: pathToFileURL(`${basePath}${withKnownExtension}`).href,
        };
      }
    }

    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("data:text/javascript,")) {
      return {
        format: "module",
        shortCircuit: true,
        source: decodeURIComponent(url.slice("data:text/javascript,".length)),
      };
    }

    if (url.endsWith(".tsx")) {
      const filename = fileURLToPath(url);
      const source = readFileSync(filename, "utf8");
      const transpiled = ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
        },
        fileName: filename,
      });

      return {
        format: "module",
        shortCircuit: true,
        source: transpiled.outputText,
      };
    }

    return nextLoad(url, context);
  },
});

function createQueueFailurePage(): AdminQueueFailureMonitoringPageRecord {
  return {
    title: "Queue Failures",
    description: "Operator triage view for failed and retrying ingest, refresh, and probe jobs.",
    appliedFilters: {},
    summary: {
      totalItems: 2,
      failedItems: 1,
      retryingItems: 1,
      providerPageIngestItems: 1,
      sourceRefreshItems: 1,
      sourceProbeItems: 0,
    },
    items: [
      {
        jobId: "job_failed_1",
        runId: "run_failed_1",
        providerId: "provider_jszy",
        providerKey: "jszyapi_vod_json",
        providerDisplayName: "JSZY API",
        visibilityState: "failed",
        status: "failed",
        jobType: "provider_page_ingest",
        scope: "page",
        mode: "backfill",
        requestId: "req_failed",
        actorId: "system",
        providerItemId: "vod-001",
        attemptCount: 2,
        retryState: "terminal_failure",
        failureSignal: {
          severity: "operator_action_required",
          alertReady: true,
          escalationReason: "terminal_failure",
        },
        startedAt: new Date("2026-03-11T10:00:00.000Z"),
        finishedAt: new Date("2026-03-11T10:00:04.000Z"),
        durationMs: 4000,
        lastErrorSummary: "Provider response 'msg' indicated an error: provider failed.",
        failure: {
          category: "provider_response",
          code: "provider_payload_invalid",
          status: 502,
          retryable: false,
          errorName: "BackendError",
        },
        target: {
          sourceId: "src_001",
          providerItemId: "vod-001",
          sourceKind: "stream",
          providerLineKey: "lineA",
          urls: ["https://example.com/stream.m3u8"],
        },
        request: {
          page: 3,
          pageSize: 30,
          cursor: "cursor-3",
          updatedAfter: null,
          updatedBefore: null,
        },
        checkpoint: {
          cursor: "cursor-3",
          page: 3,
        },
        counts: {
          itemCount: 0,
          rawPayloadCount: 1,
          warningCount: 1,
        },
      },
      {
        jobId: "job_retry_1",
        runId: "run_retry_1",
        providerId: "provider_jszy",
        providerKey: "jszyapi_vod_json",
        providerDisplayName: "JSZY API",
        visibilityState: "retrying",
        status: "running",
        jobType: "scheduled_source_refresh",
        scope: "source_refresh",
        mode: "incremental",
        requestId: "req_retry",
        actorId: "scheduler",
        providerItemId: "vod-002",
        attemptCount: 3,
        retryState: "retrying",
        failureSignal: {
          severity: "degraded_attention",
          alertReady: false,
          escalationReason: "repeated_retryable_failure",
        },
        startedAt: new Date("2026-03-11T10:05:00.000Z"),
        finishedAt: null,
        durationMs: null,
        lastErrorSummary: "Previous refresh failed.",
        failure: {
          category: "provider_request",
          code: "provider_request_failed",
          status: 504,
          retryable: true,
          errorName: "BackendError",
        },
        target: {
          sourceId: "src_002",
          providerItemId: "vod-002",
          sourceKind: "stream",
          providerLineKey: "lineB",
          urls: ["https://example.com/stream-2.m3u8"],
        },
        request: null,
        checkpoint: {
          cursor: null,
          page: null,
        },
        counts: {
          itemCount: 1,
          rawPayloadCount: 2,
          warningCount: 0,
        },
      },
    ],
  };
}

async function renderAdminQueueFailureMonitoringPage(props: {
  page?: AdminQueueFailureMonitoringPageRecord;
  errorMessage?: string;
  searchState: {
    q: string;
    visibility: string;
    provider: string;
    jobType: string;
  };
}) {
  const module = await import("./AdminQueueFailureMonitoringPage.tsx");
  const element = createElement(module.AdminQueueFailureMonitoringPage, props);
  return renderToStaticMarkup(element);
}

test("AdminQueueFailureMonitoringPage renders alert-ready severity and escalation states on the visible surface", async () => {
  const markup = await renderAdminQueueFailureMonitoringPage({
    page: createQueueFailurePage(),
    searchState: {
      q: "",
      visibility: "",
      provider: "",
      jobType: "",
    },
  });

  assert.ok(markup.includes("operator action required"));
  assert.ok(markup.includes("Alert-ready"));
  assert.ok(markup.includes("Escalation reason: terminal failure"));
  assert.ok(markup.includes("Operator action required"));
  assert.ok(markup.includes("degraded attention"));
  assert.ok(markup.includes("Monitoring only"));
  assert.ok(markup.includes("Escalation reason: repeated retryable failure"));
});

test("AdminQueueFailureMonitoringPage keeps unavailable-state feedback visible when the backend is unavailable", async () => {
  const markup = await renderAdminQueueFailureMonitoringPage({
    errorMessage: "Queue failure backend unavailable.",
    searchState: {
      q: "",
      visibility: "",
      provider: "",
      jobType: "",
    },
  });

  assert.ok(markup.includes("Queue failure backend unavailable."));
  assert.ok(markup.includes("Failure Filters"));
});
