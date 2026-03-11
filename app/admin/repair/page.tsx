import { AdminRepairQueuePage } from "../../../components/admin/AdminRepairQueuePage";
import { getAdminRepairQueuePage } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";
import { repairQueueStatuses } from "../../../lib/server/health";
import { repairSignalSeverities, sourceHealthStates } from "../../../lib/server/provider";

import type { RepairQueueQuery } from "../../../lib/server/health";

export const dynamic = "force-dynamic";

type RouteSearchParams = Record<string, string | string[] | undefined>;

interface RepairQueueSearchState {
  q: string;
  status: string;
  severity: string;
  health: string;
}

function getStringParam(value: string | string[] | undefined): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0].trim() : "";
  }

  return "";
}

function buildReturnTo(searchState: RepairQueueSearchState) {
  const params = new URLSearchParams();

  if (searchState.q) {
    params.set("q", searchState.q);
  }

  if (searchState.status) {
    params.set("status", searchState.status);
  }

  if (searchState.severity) {
    params.set("severity", searchState.severity);
  }

  if (searchState.health) {
    params.set("health", searchState.health);
  }

  const serialized = params.toString();
  return serialized ? `/admin/repair?${serialized}` : "/admin/repair";
}

function parseRepairQueueSearch(searchParams?: RouteSearchParams): {
  query: RepairQueueQuery;
  searchState: RepairQueueSearchState;
  flashMessage?: string;
  returnTo: string;
} {
  const q = getStringParam(searchParams?.q);
  const status = getStringParam(searchParams?.status);
  const severity = getStringParam(searchParams?.severity);
  const health = getStringParam(searchParams?.health);
  const flashMessage = getStringParam(searchParams?.flash) || undefined;

  const query: RepairQueueQuery = {};

  if (q) {
    query.search = q;
  }

  if (repairQueueStatuses.includes(status as (typeof repairQueueStatuses)[number])) {
    query.statuses = [status as (typeof repairQueueStatuses)[number]];
  }

  if (repairSignalSeverities.includes(severity as (typeof repairSignalSeverities)[number])) {
    query.severities = [severity as (typeof repairSignalSeverities)[number]];
  }

  if (sourceHealthStates.includes(health as (typeof sourceHealthStates)[number])) {
    query.healthStates = [health as (typeof sourceHealthStates)[number]];
  }

  const searchState = {
    q,
    status,
    severity,
    health,
  };

  return {
    query,
    searchState,
    flashMessage,
    returnTo: buildReturnTo(searchState),
  };
}

export default async function AdminRepairPage({
  searchParams,
}: {
  searchParams?: RouteSearchParams;
}) {
  const { query, searchState, flashMessage, returnTo } = parseRepairQueueSearch(searchParams);

  try {
    const page = await getAdminRepairQueuePage(query);
    return <AdminRepairQueuePage page={page} flashMessage={flashMessage} returnTo={returnTo} searchState={searchState} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator repair queue backend is unavailable.";
    return <AdminRepairQueuePage errorMessage={message} flashMessage={flashMessage} returnTo={returnTo} searchState={searchState} />;
  }
}
