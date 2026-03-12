import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import type { AdminPendingNormalizedCandidatesPageRecord } from "../../lib/server/admin/types";
import type { AdminPendingNormalizedPageProps } from "./AdminPendingNormalizedPage";

const cssStubSource = "export default new Proxy({}, { get: (_, prop) => String(prop) });";
const linkStubSource = `
  export default function Link({ children }) {
    return children ?? null;
  }
`;
const actionsStubSource = `
  export async function queueNormalizedCandidateAction() {}
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

    if (specifier.endsWith("/app/admin/normalized/actions")) {
      return {
        shortCircuit: true,
        url: createDataModuleUrl(actionsStubSource),
      };
    }

    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
      const parentFilename = fileURLToPath(context.parentURL);
      const basePath = path.resolve(path.dirname(parentFilename), specifier);
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

    if (url.endsWith(".tsx") || url.endsWith(".ts")) {
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

function createPageRecord(): AdminPendingNormalizedCandidatesPageRecord {
  return {
    title: "Pending normalized candidates",
    description: "fixture",
    summary: {
      totalCandidates: 2,
      normalizedCandidates: 1,
      warningCandidates: 1,
      totalAliases: 3,
      totalMatchSuggestions: 2,
      totalDuplicateSignals: 1,
    },
    items: [
      {
        candidate: {
          id: "candidate-1",
          stagingCandidateId: "staging-1",
          providerId: "fixture",
          providerItemId: "provider-item-1",
          status: "normalized",
          title: { display: "Harbor Line", normalized: "harbor line" },
          mediaType: "series",
          releaseYear: 2026,
          region: "JP",
          language: "ja",
          warnings: [],
          normalizationNotes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        aliasCount: 2,
        matchSuggestionCount: 1,
        duplicateSignalCount: 0,
      },
    ],
  };
}

async function renderPendingNormalizedPage(props: AdminPendingNormalizedPageProps) {
  const module = await import("./AdminPendingNormalizedPage.tsx");
  const element = createElement(module.AdminPendingNormalizedPage, props);
  return renderToStaticMarkup(element);
}

test("AdminPendingNormalizedPage renders candidate cards and queue action", async () => {
  const markup = await renderPendingNormalizedPage({ page: createPageRecord() });

  assert.ok(markup.includes("Pending Normalized Candidates"));
  assert.ok(markup.includes("Harbor Line"));
  assert.ok(markup.includes("Queue for review"));
});

test("AdminPendingNormalizedPage shows warning state when backend fails", async () => {
  const markup = await renderPendingNormalizedPage({ errorMessage: "Backend unavailable." });

  assert.ok(markup.includes("Backend unavailable."));
});
