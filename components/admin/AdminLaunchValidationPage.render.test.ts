import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

import type { AdminFinalLaunchValidationPageRecord } from "../../lib/server/admin";

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

function createLaunchValidationPage(): AdminFinalLaunchValidationPageRecord {
  return {
    title: "Final Launch Validation",
    description: "Bounded launch-validation summary for the accepted backend scope and operator guardrails.",
    validation: {
      state: "blocked",
      reasonCode: "admin_access_validation_failed",
      summary:
        "Final launch validation is blocked. Privileged admin access validation is not passing. Recovery guardrails are degraded.",
      checkedAt: new Date("2026-03-12T18:30:00.000Z"),
      contributingReasonCodes: ["admin_access_validation_failed", "recovery_guardrail_degraded"],
      ingestValidation: {
        state: "ready",
        reasonCode: "ready",
        summary: "Accepted provider-lane ingest validation is healthy.",
        checkedAt: new Date("2026-03-12T18:00:00.000Z"),
        acceptedProviderLane: "jszyapi_vod_json",
        providerPageFreshnessHours: 2,
        scheduledRefreshFreshnessHours: 1,
        scheduledProbeFreshnessHours: 1,
        queueFailureCount: 0,
        failedQueueFailureCount: 0,
        retryingQueueFailureCount: 0,
        openRepairCount: 0,
        inProgressRepairCount: 0,
        waitingProviderRepairCount: 0,
        contributingReasonCodes: ["ready"],
      },
      catalogEvidence: {
        adminPublishedCount: 12,
        publicPublishedCount: 12,
        sampleMediaPublicId: "pub_001",
        sampleMediaTitle: "Golden Path Sample",
        sampleCanonicalWatchHref: "/watch?media=pub_001",
        sampleDetailAvailable: true,
        sampleWatchAvailable: true,
        sampleSourceResolutionReason: "preferred_healthy",
        sampleSelectedResourceHealthState: "healthy",
      },
      healthEvidence: {
        queueFailureCount: 1,
        failedQueueFailureCount: 1,
        retryingQueueFailureCount: 0,
        openRepairCount: 0,
        inProgressRepairCount: 1,
        waitingProviderRepairCount: 0,
      },
      adminAccessEvidence: {
        currentActorId: "operator-42",
        currentRole: "operator",
        currentSource: "header",
        privilegedSessionValidated: false,
        anonymousDenied: true,
        viewerDenied: true,
        operatorAllowed: true,
      },
      migrationPreflight: {
        status: "ready",
        reasonCode: "ready",
        summary: "Published catalog migration preflight is ready.",
        checkedAt: new Date("2026-03-12T18:25:00.000Z"),
        expectedSchemaDigest: "schema:v1",
        actualSchemaDigest: "schema:v1",
        pendingMigrations: [],
        driftSummary: [],
      },
      recoveryReadiness: {
        state: "degraded",
        reasonCode: "backup_stale",
        summary: "Recovery readiness is degraded. The latest recorded backup artifact is stale.",
        checkedAt: new Date("2026-03-12T18:20:00.000Z"),
        backupArtifact: {
          id: "backup_1",
          artifactKey: "backup-2026-03-10",
          summary: "Nightly encrypted backup",
          artifactRef: "s3://ops/backups/2026-03-10",
          coverageScope: "catalog + review",
          completedAt: new Date("2026-03-10T10:00:00.000Z"),
          expiresAt: new Date("2026-03-17T10:00:00.000Z"),
          metadata: null,
        },
        latestRestoreRehearsal: {
          id: "restore_1",
          backupArtifactId: "backup_1",
          status: "succeeded",
          summary: "Restore rehearsal completed successfully.",
          notes: null,
          actorId: "ops-user",
          requestId: "req_restore_1",
          rehearsedAt: new Date("2026-03-11T16:00:00.000Z"),
          metadata: null,
        },
        policy: {
          backupMaxAgeHours: 48,
          restoreMaxAgeHours: 336,
        },
        contributingReasonCodes: ["backup_stale"],
        backupAgeHours: 54,
        restoreAgeHours: 26,
      },
      domains: [
        {
          domain: "ingest",
          state: "ready",
          reasonCode: "ready",
          summary: "Accepted provider-lane ingest validation is ready.",
          observedAt: new Date("2026-03-12T18:00:00.000Z"),
          supportingEvidence: {
            acceptedProviderLane: "jszyapi_vod_json",
            ingestReasonCode: "ready",
          },
        },
        {
          domain: "catalog_publishing",
          state: "ready",
          reasonCode: "ready",
          summary: "Published catalog list and detail launch evidence is available.",
          observedAt: new Date("2026-03-12T18:30:00.000Z"),
          supportingEvidence: {
            adminPublishedCount: 12,
            publicPublishedCount: 12,
            sampleMediaTitle: "Golden Path Sample",
          },
        },
        {
          domain: "source_health",
          state: "ready",
          reasonCode: "ready",
          summary: "Published watch resolution and operator source-health guardrails are healthy.",
          observedAt: new Date("2026-03-12T18:30:00.000Z"),
          supportingEvidence: {
            sampleSourceResolutionReason: "preferred_healthy",
            sampleSelectedResourceHealthState: "healthy",
            queueFailureCount: 1,
          },
        },
        {
          domain: "admin_access",
          state: "blocked",
          reasonCode: "admin_access_validation_failed",
          summary: "Privileged admin access validation is not passing for the accepted operator boundary.",
          observedAt: new Date("2026-03-12T18:30:00.000Z"),
          supportingEvidence: {
            currentActorId: "operator-42",
            currentRole: "operator",
            privilegedSessionValidated: false,
            anonymousDenied: true,
            viewerDenied: true,
            operatorAllowed: true,
          },
        },
        {
          domain: "guardrails",
          state: "degraded",
          reasonCode: "recovery_guardrail_degraded",
          summary: "Recovery readiness is degraded for final launch validation.",
          observedAt: new Date("2026-03-12T18:20:00.000Z"),
          supportingEvidence: {
            migrationStatus: "ready",
            recoveryState: "degraded",
            contributingReasonCodes: ["backup_stale"],
          },
        },
      ],
    },
  };
}

async function renderAdminLaunchValidationPage(props: {
  page?: AdminFinalLaunchValidationPageRecord;
  errorMessage?: string;
}) {
  const module = await import("./AdminLaunchValidationPage.tsx");
  const element = createElement(module.AdminLaunchValidationPage, props);
  return renderToStaticMarkup(element);
}

test("AdminLaunchValidationPage renders launch state, explicit reasons, domain outcomes, and supporting evidence", async () => {
  const markup = await renderAdminLaunchValidationPage({
    page: createLaunchValidationPage(),
  });

  assert.ok(markup.includes("Final Launch Validation"));
  assert.ok(markup.includes("blocked"));
  assert.ok(markup.includes("Primary reason admin access validation failed"));
  assert.ok(markup.includes("Golden Path Sample"));
  assert.ok(markup.includes("admin access"));
  assert.ok(markup.includes("Privileged admin access validation is not passing for the accepted operator boundary."));
  assert.ok(markup.includes("recovery guardrail degraded"));
  assert.ok(markup.includes("operator-42"));
  assert.ok(markup.includes("Published titles"));
});

test("AdminLaunchValidationPage keeps backend unavailable feedback visible", async () => {
  const markup = await renderAdminLaunchValidationPage({
    errorMessage: "Final launch-validation backend is unavailable.",
  });

  assert.ok(markup.includes("Final launch-validation backend is unavailable."));
  assert.ok(markup.includes("Final Launch Validation"));
});
