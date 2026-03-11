import { AdminQueueFailureMonitoringPage } from "../../../components/admin/AdminQueueFailureMonitoringPage";
import { getAdminQueueFailureMonitoringPage } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";
import { queueFailureVisibilityStates } from "../../../lib/server/health";

import type { AdminQueueFailureQuery, QueueFailureJobType } from "../../../lib/server/health";

export const dynamic = "force-dynamic";

type RouteSearchParams = Record<string, string | string[] | undefined>;

const queueFailureJobTypeOptions = [
  "provider_page_ingest",
  "scheduled_source_refresh",
  "scheduled_source_probe",
] as const satisfies QueueFailureJobType[];

interface QueueFailureSearchState {
  q: string;
  visibility: string;
  provider: string;
  jobType: string;
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

function parseQueueFailureSearch(searchParams?: RouteSearchParams): {
  query: AdminQueueFailureQuery;
  searchState: QueueFailureSearchState;
} {
  const q = getStringParam(searchParams?.q);
  const visibility = getStringParam(searchParams?.visibility);
  const provider = getStringParam(searchParams?.provider);
  const jobType = getStringParam(searchParams?.jobType);

  const query: AdminQueueFailureQuery = {};

  if (q) {
    query.search = q;
  }

  if (queueFailureVisibilityStates.includes(visibility as (typeof queueFailureVisibilityStates)[number])) {
    query.visibilityStates = [visibility as (typeof queueFailureVisibilityStates)[number]];
  }

  if (provider) {
    query.providerKeys = [provider];
  }

  if (queueFailureJobTypeOptions.includes(jobType as QueueFailureJobType)) {
    query.jobTypes = [jobType as QueueFailureJobType];
  }

  return {
    query,
    searchState: {
      q,
      visibility,
      provider,
      jobType,
    },
  };
}

export default async function AdminQueueFailuresPage({
  searchParams,
}: {
  searchParams?: RouteSearchParams;
}) {
  const { query, searchState } = parseQueueFailureSearch(searchParams);

  try {
    const page = await getAdminQueueFailureMonitoringPage(query);
    return <AdminQueueFailureMonitoringPage page={page} searchState={searchState} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator queue failure backend is unavailable.";
    return <AdminQueueFailureMonitoringPage errorMessage={message} searchState={searchState} />;
  }
}
