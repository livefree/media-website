import {
  manualSubmissionStatuses,
  manualTitleTypeHints,
  moderationReportKinds,
  moderationReportStatuses,
} from "../../lib/server/review/types";

import type { ManualSourceSubmissionQuery, SourceInventoryRecord } from "../../lib/server/source/types";
import type { ManualTitleSubmissionQuery, ModerationReportQuery } from "../../lib/server/review/types";

type RouteSearchParams = Record<string, string | string[] | undefined>;

export interface AdminModerationSearchState {
  q: string;
  kind: string;
  status: string;
}

export interface AdminManualTitleSubmissionSearchState {
  q: string;
  status: string;
  typeHint: string;
  submission: string;
}

export interface AdminManualSourceSubmissionSearchState {
  q: string;
  status: string;
  kind: string;
  submission: string;
}

const sourceKindOptions = ["stream", "download", "subtitle", "trailer"] as const satisfies SourceInventoryRecord["kind"][];

function getStringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0].trim() : "";
  }

  return "";
}

export function parseAdminModerationSearch(searchParams?: RouteSearchParams): {
  query: ModerationReportQuery;
  searchState: AdminModerationSearchState;
  returnTo: string;
  flashMessage?: string;
} {
  const q = getStringParam(searchParams?.q);
  const kind = getStringParam(searchParams?.kind);
  const status = getStringParam(searchParams?.status);
  const flashMessage = getStringParam(searchParams?.flash) || undefined;

  const query: ModerationReportQuery = {};

  if (q) {
    query.q = q;
  }

  if (moderationReportKinds.includes(kind as (typeof moderationReportKinds)[number])) {
    query.kinds = [kind as (typeof moderationReportKinds)[number]];
  }

  if (moderationReportStatuses.includes(status as (typeof moderationReportStatuses)[number])) {
    query.statuses = [status as (typeof moderationReportStatuses)[number]];
  }

  const searchState = {
    q,
    kind: query.kinds?.[0] ?? "",
    status: query.statuses?.[0] ?? "",
  };

  return {
    query,
    searchState,
    returnTo: buildAdminModerationPath(searchState),
    flashMessage,
  };
}

export function buildAdminModerationPath(state: Partial<AdminModerationSearchState>) {
  const params = new URLSearchParams();

  if (state.q) {
    params.set("q", state.q);
  }

  if (state.kind) {
    params.set("kind", state.kind);
  }

  if (state.status) {
    params.set("status", state.status);
  }

  const serialized = params.toString();
  return serialized ? `/admin/moderation?${serialized}` : "/admin/moderation";
}

export function normalizeAdminModerationReturnTo(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith("/admin/moderation")) {
    return "/admin/moderation";
  }

  return returnTo;
}

export function parseAdminManualTitleSubmissionSearch(searchParams?: RouteSearchParams): {
  query: ManualTitleSubmissionQuery;
  searchState: AdminManualTitleSubmissionSearchState;
  returnTo: string;
  flashMessage?: string;
} {
  const q = getStringParam(searchParams?.q);
  const status = getStringParam(searchParams?.status);
  const typeHint = getStringParam(searchParams?.typeHint);
  const submission = getStringParam(searchParams?.submission);
  const flashMessage = getStringParam(searchParams?.flash) || undefined;

  const query: ManualTitleSubmissionQuery = {};

  if (q) {
    query.q = q;
  }

  if (manualSubmissionStatuses.includes(status as (typeof manualSubmissionStatuses)[number])) {
    query.statuses = [status as (typeof manualSubmissionStatuses)[number]];
  }

  if (manualTitleTypeHints.includes(typeHint as (typeof manualTitleTypeHints)[number])) {
    query.typeHints = [typeHint as (typeof manualTitleTypeHints)[number]];
  }

  const searchState = {
    q,
    status: query.statuses?.[0] ?? "",
    typeHint: query.typeHints?.[0] ?? "",
    submission,
  };

  return {
    query,
    searchState,
    returnTo: buildAdminManualTitleSubmissionPath(searchState),
    flashMessage,
  };
}

export function buildAdminManualTitleSubmissionPath(state: Partial<AdminManualTitleSubmissionSearchState>) {
  const params = new URLSearchParams();

  if (state.q) {
    params.set("q", state.q);
  }

  if (state.status) {
    params.set("status", state.status);
  }

  if (state.typeHint) {
    params.set("typeHint", state.typeHint);
  }

  if (state.submission) {
    params.set("submission", state.submission);
  }

  const serialized = params.toString();
  return serialized ? `/admin/manual-titles?${serialized}` : "/admin/manual-titles";
}

export function normalizeAdminManualTitleSubmissionReturnTo(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith("/admin/manual-titles")) {
    return "/admin/manual-titles";
  }

  return returnTo;
}

export function parseAdminManualSourceSubmissionSearch(searchParams?: RouteSearchParams): {
  query: ManualSourceSubmissionQuery;
  searchState: AdminManualSourceSubmissionSearchState;
  returnTo: string;
  flashMessage?: string;
} {
  const q = getStringParam(searchParams?.q);
  const status = getStringParam(searchParams?.status);
  const kind = getStringParam(searchParams?.kind);
  const submission = getStringParam(searchParams?.submission);
  const flashMessage = getStringParam(searchParams?.flash) || undefined;

  const query: ManualSourceSubmissionQuery = {};

  if (q) {
    query.q = q;
  }

  if (manualSubmissionStatuses.includes(status as (typeof manualSubmissionStatuses)[number])) {
    query.statuses = [status as (typeof manualSubmissionStatuses)[number]];
  }

  if (sourceKindOptions.includes(kind as SourceInventoryRecord["kind"])) {
    query.kinds = [kind as SourceInventoryRecord["kind"]];
  }

  const searchState = {
    q,
    status: query.statuses?.[0] ?? "",
    kind: query.kinds?.[0] ?? "",
    submission,
  };

  return {
    query,
    searchState,
    returnTo: buildAdminManualSourceSubmissionPath(searchState),
    flashMessage,
  };
}

export function buildAdminManualSourceSubmissionPath(state: Partial<AdminManualSourceSubmissionSearchState>) {
  const params = new URLSearchParams();

  if (state.q) {
    params.set("q", state.q);
  }

  if (state.status) {
    params.set("status", state.status);
  }

  if (state.kind) {
    params.set("kind", state.kind);
  }

  if (state.submission) {
    params.set("submission", state.submission);
  }

  const serialized = params.toString();
  return serialized ? `/admin/manual-sources?${serialized}` : "/admin/manual-sources";
}

export function normalizeAdminManualSourceSubmissionReturnTo(returnTo?: string) {
  if (!returnTo || !returnTo.startsWith("/admin/manual-sources")) {
    return "/admin/manual-sources";
  }

  return returnTo;
}

export function formatAdminWorkflowLabel(value: string) {
  return value.replaceAll("_", " ");
}
