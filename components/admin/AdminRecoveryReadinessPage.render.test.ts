import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import type { AdminRecoveryReadinessPageRecord } from "../../lib/server/admin";

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

function createRecoveryPage(): AdminRecoveryReadinessPageRecord {
  return {
    title: "Recovery Readiness",
    description: "Operator recovery guardrail state for backup freshness and restore rehearsal health.",
    readiness: {
      state: "degraded",
      reasonCode: "backup_stale",
      summary: "Recovery readiness is degraded. The latest recorded backup artifact is stale.",
      checkedAt: new Date("2026-03-11T18:00:00.000Z"),
      backupArtifact: {
        id: "backup_1",
        artifactKey: "backup-2026-03-09",
        summary: "Nightly encrypted backup",
        artifactRef: "s3://ops/backups/2026-03-09",
        coverageScope: "catalog + review",
        completedAt: new Date("2026-03-09T10:00:00.000Z"),
        expiresAt: new Date("2026-03-16T10:00:00.000Z"),
        metadata: null,
      },
      latestRestoreRehearsal: {
        id: "restore_1",
        backupArtifactId: "backup_1",
        status: "partial",
        summary: "Restore rehearsal completed with partial verification gaps.",
        notes: "Subtitle assets skipped during rehearsal.",
        actorId: "ops-user",
        requestId: "req_restore_1",
        rehearsedAt: new Date("2026-03-03T18:00:00.000Z"),
        metadata: null,
      },
      policy: {
        backupMaxAgeHours: 48,
        restoreMaxAgeHours: 336,
      },
      contributingReasonCodes: ["backup_stale", "restore_rehearsal_partial"],
      backupAgeHours: 56,
      restoreAgeHours: 192,
    },
  };
}

async function renderAdminRecoveryReadinessPage(props: {
  page?: AdminRecoveryReadinessPageRecord;
  errorMessage?: string;
}) {
  const module = await import("./AdminRecoveryReadinessPage.tsx");
  const element = createElement(module.AdminRecoveryReadinessPage, props);
  return renderToStaticMarkup(element);
}

test("AdminRecoveryReadinessPage renders readiness state, backup freshness, rehearsal context, and reasons", async () => {
  const markup = await renderAdminRecoveryReadinessPage({
    page: createRecoveryPage(),
  });

  assert.ok(markup.includes("Recovery Readiness"));
  assert.ok(markup.includes("degraded"));
  assert.ok(markup.includes("Primary reason backup stale"));
  assert.ok(markup.includes("Latest backup freshness"));
  assert.ok(markup.includes("56h old"));
  assert.ok(markup.includes("Nightly encrypted backup"));
  assert.ok(markup.includes("Restore rehearsal completed with partial verification gaps."));
  assert.ok(markup.includes("Latest backup artifact is stale"));
  assert.ok(markup.includes("Latest restore rehearsal completed only partially"));
});

test("AdminRecoveryReadinessPage keeps backend unavailable feedback visible", async () => {
  const markup = await renderAdminRecoveryReadinessPage({
    errorMessage: "Recovery-readiness backend is unavailable.",
  });

  assert.ok(markup.includes("Recovery-readiness backend is unavailable."));
  assert.ok(markup.includes("Recovery Readiness"));
});
