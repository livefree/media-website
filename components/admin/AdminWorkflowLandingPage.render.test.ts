import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import type { AdminWorkflowLandingPageRecord } from "../../lib/server/admin/types";

const cssStubSource = "export default new Proxy({}, { get: (_, prop) => String(prop) });";
const linkStubSource = "export default function Link({ children, href }) { return children ?? href ?? null; }";

function createDataModuleUrl(source: string) {
  return `data:text/javascript,${encodeURIComponent(source)}`;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/link") {
      return { shortCircuit: true, url: createDataModuleUrl(linkStubSource) };
    }

    if (specifier.endsWith(".module.css")) {
      return { shortCircuit: true, url: createDataModuleUrl(cssStubSource) };
    }

    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
      const parentFilename = new URL(context.parentURL);
      const basePath = path.resolve(path.dirname(parentFilename.pathname), specifier);
      const withKnownExtension = [".tsx", ".ts", ".js"].find((extension) => existsSync(`${basePath}${extension}`));

      if (withKnownExtension) {
        return { shortCircuit: true, url: new URL(`${basePath}${withKnownExtension}`, "file://").href };
      }
    }

    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("data:text/javascript,")) {
      return { format: "module", shortCircuit: true, source: decodeURIComponent(url.slice("data:text/javascript,".length)) };
    }

    if (url.endsWith(".tsx") || url.endsWith(".ts")) {
      const filename = new URL(url);
      const source = readFileSync(filename, "utf8");
      const transpiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
        fileName: filename.pathname,
      });

      return { format: "module", shortCircuit: true, source: transpiled.outputText };
    }

    return nextLoad(url, context);
  },
});

async function renderLandingPage(props: Parameters<typeof import("./AdminWorkflowLandingPage").AdminWorkflowLandingPage>[0]) {
  const module = await import("./AdminWorkflowLandingPage.tsx");
  const element = createElement(module.AdminWorkflowLandingPage, props);
  return renderToStaticMarkup(element);
}

function createWorkflowLandingRecord(): AdminWorkflowLandingPageRecord {
  return {
    title: "Workflow Overview",
    description: "Operator snapshot",
    summary: {
      pendingNormalized: { totalCandidates: 4, warningCandidates: 1, href: "/admin/normalized" },
      reviewQueue: { totalEntries: 6, pendingEntries: 2, href: "/admin/review" },
      catalog: { totalTitles: 120, titlesWithRepairs: 4, episodicTitles: 48, href: "/admin/catalog" },
      sourceHealth: {
        unhealthySources: 3,
        openRepairItems: 5,
        failedQueueJobs: 2,
        hrefs: { sources: "/admin/sources", repair: "/admin/repair", queueFailures: "/admin/queue-failures" },
      },
      launchReadiness: {
        recoveryState: "ready",
        launchState: "ready",
        hrefs: { recovery: "/admin/recovery-readiness", launch: "/admin/final-launch-validation" },
      },
    },
  };
}

test("AdminWorkflowLandingPage renders summary cards", async () => {
  const markup = await renderLandingPage({ page: createWorkflowLandingRecord() });

  assert.ok(markup.includes("Workflow Overview"));
  assert.ok(markup.includes("Pending normalized"));
  assert.ok(markup.includes("Review queue"));
  assert.ok(markup.includes("Catalog attention"));
  assert.ok(markup.includes("Source health"));
  assert.ok(markup.includes("Launch readiness"));
});

test("AdminWorkflowLandingPage shows backend errors", async () => {
  const markup = await renderLandingPage({ errorMessage: "Backend unavailable" });
  assert.ok(markup.includes("Backend unavailable"));
});
