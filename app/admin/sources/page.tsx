import { AdminSourceInventoryPage } from "../../../components/admin/AdminSourceInventoryPage";
import { getAdminSourceInventoryPage } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";
import { sourceHealthStates } from "../../../lib/server/provider";

import type { SourceInventoryQuery, SourceInventoryRecord } from "../../../lib/server/source";

export const dynamic = "force-dynamic";

type RouteSearchParams = Record<string, string | string[] | undefined>;

const sourceKindOptions = ["stream", "download", "subtitle", "trailer"] as const satisfies SourceInventoryRecord["kind"][];
const sourceStatusOptions = ["online", "degraded", "offline", "reported", "pending"] as const satisfies SourceInventoryRecord["status"][];

interface SourceInventorySearchState {
  q: string;
  kind: string;
  health: string;
  status: string;
  includeInactive: boolean;
  includePrivate: boolean;
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

function getBooleanParam(value: string | string[] | undefined) {
  const normalized = getStringParam(value);
  return normalized === "1" || normalized === "true" || normalized === "on";
}

function parseSourceInventorySearch(searchParams?: RouteSearchParams): {
  query: SourceInventoryQuery;
  searchState: SourceInventorySearchState;
} {
  const q = getStringParam(searchParams?.q);
  const kind = getStringParam(searchParams?.kind);
  const health = getStringParam(searchParams?.health);
  const status = getStringParam(searchParams?.status);
  const includeInactive = getBooleanParam(searchParams?.includeInactive);
  const includePrivate = getBooleanParam(searchParams?.includePrivate);

  const query: SourceInventoryQuery = {};

  if (q) {
    query.search = q;
  }

  if (sourceKindOptions.includes(kind as SourceInventoryRecord["kind"])) {
    query.kind = kind as SourceInventoryRecord["kind"];
  }

  if (sourceHealthStates.includes(health as (typeof sourceHealthStates)[number])) {
    query.healthStates = [health as (typeof sourceHealthStates)[number]];
  }

  if (sourceStatusOptions.includes(status as SourceInventoryRecord["status"])) {
    query.statuses = [status as SourceInventoryRecord["status"]];
  }

  if (includeInactive) {
    query.includeInactive = true;
  }

  if (includePrivate) {
    query.includePrivate = true;
  }

  return {
    query,
    searchState: {
      q,
      kind,
      health,
      status,
      includeInactive,
      includePrivate,
    },
  };
}

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams?: RouteSearchParams;
}) {
  const { query, searchState } = parseSourceInventorySearch(searchParams);

  try {
    const page = await getAdminSourceInventoryPage(query);
    return <AdminSourceInventoryPage page={page} searchState={searchState} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator source inventory backend is unavailable.";
    return <AdminSourceInventoryPage errorMessage={message} searchState={searchState} />;
  }
}
