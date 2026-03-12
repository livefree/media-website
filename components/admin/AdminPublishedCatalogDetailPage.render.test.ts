import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import type { AdminPublishedCatalogDetailRecord } from "../../lib/server/admin";

const cssStubSource = "export default new Proxy({}, { get: (_, prop) => String(prop) });";
const linkStubSource = `
  export default function Link({ children }) {
    return children ?? null;
  }
`;
const actionsStubSource = `
  export async function submitPublishedCatalogHideAction() {}
  export async function submitPublishedCatalogRestoreVisibilityAction() {}
  export async function submitPublishedCatalogUnpublishAction() {}
  export async function submitPublishedSourceReorderAction() {}
  export async function submitPublishedSourceReplaceAction() {}
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

    if (specifier.endsWith("/app/admin/catalog/actions") || specifier === "../../app/admin/catalog/actions") {
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

function createPublishedCatalogDetailRecord(): AdminPublishedCatalogDetailRecord {
  return {
    media: {
      id: "media-1",
      publicId: "med_public_1",
      slug: "harbor-line",
      title: "Harbor Line",
      originalTitle: "Harbor Line",
      summary: "A narrow lifecycle test fixture.",
      description: "Fixture description.",
      tagline: "Fixture tagline.",
      type: "series",
      status: "ongoing",
      releaseYear: 2026,
      endYear: null,
      originCountry: "JP",
      language: "ja",
      runtimeMinutes: 48,
      episodeRuntimeMinutes: 24,
      seasonCount: 1,
      episodeCount: 12,
      visibilityState: "visible",
      posterUrl: null,
      backdropUrl: null,
      canonicalWatchHref: "/watch?v=med_public_1",
      compatibilityHref: "/media/harbor-line",
      publishedAt: "2026-03-11T10:00:00.000Z",
      updatedAt: "2026-03-11T12:00:00.000Z",
    },
    seasons: [],
    streamResources: [
      {
        id: "resource-1",
        publicId: "src_public_1",
        mediaPublicId: "med_public_1",
        kind: "stream",
        provider: "m3u8",
        format: "hls",
        label: "Primary",
        quality: "1080p",
        status: "online",
        healthState: "healthy",
        priority: 20,
        mirrorOrder: 0,
        isPreferred: true,
        isUsable: true,
        url: "https://example.com/one.m3u8",
        canonicalWatchHref: "/watch?v=med_public_1&r=src_public_1",
        watchQuery: {
          mediaPublicId: "med_public_1",
          resourcePublicId: "src_public_1",
        },
        openRepairCount: 0,
        providerDisplayName: "Northline",
      },
      {
        id: "resource-2",
        publicId: "src_public_2",
        mediaPublicId: "med_public_1",
        kind: "stream",
        provider: "m3u8",
        format: "hls",
        label: "Backup",
        quality: "720p",
        status: "online",
        healthState: "degraded",
        priority: 10,
        mirrorOrder: 1,
        isPreferred: false,
        isUsable: true,
        url: "https://example.com/two.m3u8",
        canonicalWatchHref: "/watch?v=med_public_1&r=src_public_2",
        watchQuery: {
          mediaPublicId: "med_public_1",
          resourcePublicId: "src_public_2",
        },
        openRepairCount: 1,
        providerDisplayName: "Southline",
        replacementPublicId: "src_public_1",
      },
    ],
    downloadResources: [],
    subtitleResources: [],
    sourceSummary: {
      totalResources: 2,
      streamCount: 2,
      healthyStreamCount: 1,
      degradedStreamCount: 1,
      brokenOrOfflineCount: 0,
      downloadCount: 0,
      subtitleCount: 0,
      openRepairCount: 1,
    },
    episodeDiagnostics: [],
    recentAudits: [],
    reviewContext: {
      queueEntryId: "review-queue-1",
      status: "published",
      latestDecisionType: "approve",
      latestDecisionSummary: "Approved for release.",
      scheduledPublishAt: "2026-03-12T15:00:00.000Z",
      updatedAt: "2026-03-11T11:00:00.000Z",
    },
  };
}

async function renderAdminPublishedCatalogDetailPage(props: {
  backHref: string;
  detail?: AdminPublishedCatalogDetailRecord;
  errorMessage?: string;
  flashMessage?: string;
  publicId?: string;
}) {
  const module = await import("./AdminPublishedCatalogDetailPage.tsx");
  const element = createElement(module.AdminPublishedCatalogDetailPage, props);
  return renderToStaticMarkup(element);
}

function countOccurrences(markup: string, needle: string) {
  return markup.split(needle).length - 1;
}

test("AdminPublishedCatalogDetailPage renders reorder, replace, and unpublish controls on the published detail surface", async () => {
  const detail = createPublishedCatalogDetailRecord();
  const markup = await renderAdminPublishedCatalogDetailPage({
    backHref: "/admin/catalog?q=harbor&page=2",
    detail,
    flashMessage: "Published source ordering updated.",
    errorMessage: "Published source replacement failed.",
    publicId: detail.media.publicId,
  });

  assert.equal(countOccurrences(markup, "Reorder source"), 2);
  assert.equal(countOccurrences(markup, "Replacement target"), 2);
  assert.equal(countOccurrences(markup, "Save ordering"), 2);
  assert.equal(countOccurrences(markup, "Unpublish record"), 1);
  assert.equal(countOccurrences(markup, "Hide visibility"), 1);
  assert.ok(markup.includes("visible"));
  assert.ok(markup.includes("Withdrawal notes"));
  assert.equal(countOccurrences(markup, "Select replacement line"), 2);
  assert.ok(markup.includes("Scheduled publish"));
  assert.ok(markup.includes("Published source ordering updated."));
  assert.ok(markup.includes("Published source replacement failed."));
});

test("AdminPublishedCatalogDetailPage renders restore visibility controls for hidden published records", async () => {
  const detail = createPublishedCatalogDetailRecord();
  detail.media.visibilityState = "hidden";
  const markup = await renderAdminPublishedCatalogDetailPage({
    backHref: "/admin/catalog",
    detail,
    flashMessage: "Published visibility restored.",
  });

  assert.equal(countOccurrences(markup, "Restore visibility"), 1);
  assert.equal(countOccurrences(markup, "Hide visibility"), 0);
  assert.ok(markup.includes("Published visibility restored."));
  assert.ok(markup.includes("hidden"));
});

test("AdminPublishedCatalogDetailPage renders unavailable-state feedback on the visible surface", async () => {
  const markup = await renderAdminPublishedCatalogDetailPage({
    backHref: "/admin/catalog?q=harbor&page=2",
    publicId: "missing_public_id",
    flashMessage: "Published source replaced.",
  });

  assert.ok(markup.includes("Published source replaced."));
  assert.ok(markup.includes("Published catalog record &#x27;missing_public_id&#x27; is unavailable."));
  assert.ok(markup.includes("Back to catalog"));
});
