import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import type { ReviewQueueDetailRecord } from "../../lib/db/repositories/review";

const cssStubSource = "export default new Proxy({}, { get: (_, prop) => String(prop) });";
const linkStubSource = `
  export default function Link({ children }) {
    return children ?? null;
  }
`;
const actionsStubSource = `
  export async function clearScheduledPublicationAction() {}
  export async function publishDecisionAction() {}
  export async function schedulePublicationAction() {}
  export async function startReviewAction() {}
  export async function submitDecisionAction() {}
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

    if (specifier.endsWith("/app/admin/review/actions") || specifier === "../../app/admin/review/actions") {
      return {
        shortCircuit: true,
        url: createDataModuleUrl(actionsStubSource),
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

function createReviewQueueDetailRecord(): ReviewQueueDetailRecord {
  return {
    queueEntry: {
      id: "queue-1",
      normalizedCandidateId: "candidate-1",
      status: "approved_for_publish",
      assignedReviewerId: "operator-1",
      latestDecisionType: "approve",
      latestDecisionSummary: "Approved for launch window.",
      scheduledPublishAt: new Date("2026-03-12T15:00:00.000Z"),
      queuedAt: new Date("2026-03-11T10:00:00.000Z"),
      startedAt: new Date("2026-03-11T11:00:00.000Z"),
      reviewedAt: new Date("2026-03-11T12:00:00.000Z"),
      createdAt: new Date("2026-03-11T10:00:00.000Z"),
      updatedAt: new Date("2026-03-11T12:00:00.000Z"),
    },
    candidate: {
      id: "candidate-1",
      sourceProviderKey: "fixture",
      sourceRecordId: "src-1",
      mediaType: "series",
      releaseYear: 2026,
      region: "JP",
      language: "ja",
      title: {
        display: "Harbor Line",
        normalized: "harbor line",
        original: "Harbor Line",
      },
      summary: "Governance test fixture.",
      warnings: [],
      normalizationNotes: [],
      seasonEpisodeHints: {
        isEpisodic: true,
        seasonNumbers: [1],
        episodeNumbers: [1, 2],
      },
      createdAt: new Date("2026-03-11T10:00:00.000Z"),
      updatedAt: new Date("2026-03-11T12:00:00.000Z"),
    },
    aliases: [],
    matchSuggestions: [],
    duplicateSignals: [],
    decisions: [
      {
        id: "decision-1",
        queueEntryId: "queue-1",
        decisionType: "approve",
        targetCanonicalMediaId: "media-1",
        notes: "Ready for scheduled release.",
        actorId: "operator-1",
        createdAt: new Date("2026-03-11T12:00:00.000Z"),
      },
    ],
    publishOperations: [],
    audits: [],
  };
}

async function renderAdminReviewDetailPage(props: {
  detail?: ReviewQueueDetailRecord;
  queueEntryId?: string;
  errorMessage?: string;
  flashMessage?: string;
}) {
  const module = await import("./AdminReviewDetailPage.tsx");
  const element = createElement(module.AdminReviewDetailPage, props);
  return renderToStaticMarkup(element);
}

test("AdminReviewDetailPage renders publish scheduling controls and scheduled state on the review surface", async () => {
  const detail = createReviewQueueDetailRecord();
  const markup = await renderAdminReviewDetailPage({
    detail,
    flashMessage: "Publication scheduled.",
  });

  assert.ok(markup.includes("Publish scheduling"));
  assert.ok(markup.includes("Reschedule publication"));
  assert.ok(markup.includes("Clear scheduled publish"));
  assert.ok(markup.includes("Publish at"));
  assert.ok(markup.includes("Scheduled"));
  assert.ok(markup.includes("Publication scheduled."));
});

test("AdminReviewDetailPage shows unavailable-state feedback when the detail is missing", async () => {
  const markup = await renderAdminReviewDetailPage({
    queueEntryId: "missing-queue-entry",
    errorMessage: "Review queue entry was not found.",
    flashMessage: "Scheduled publication cleared.",
  });

  assert.ok(markup.includes("Scheduled publication cleared."));
  assert.ok(markup.includes("Review queue entry was not found."));
  assert.ok(markup.includes("Back to queue"));
});
