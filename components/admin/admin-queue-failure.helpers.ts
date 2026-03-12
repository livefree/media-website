import type {
  AdminQueueFailureMonitoringPageRecord,
  AdminQueueFailureMonitoringSummary,
} from "../../lib/server/admin";

export interface QueueFailureSearchState {
  q: string;
  visibility: string;
  provider: string;
  jobType: string;
}

export interface QueueFailureMonitoringViewModel {
  surfaceId: "admin-queue-failures";
  navSection: "queue-failures";
  title: string;
  description: string;
  summaryMetrics: Array<{
    key: keyof AdminQueueFailureMonitoringSummary;
    label: string;
    value: number;
  }>;
  filterFields: Array<{
    name: "q" | "visibility" | "provider" | "jobType";
    label: string;
    kind: "text" | "select";
    value: string;
  }>;
  errorMessage?: string;
  emptyMessage?: string;
  items: Array<{
    key: string;
    title: string;
    meta: string;
    badges: string[];
    alertSignal?: {
      severityLabel: string;
      alertReadyLabel: string;
      escalationReasonLabel: string;
      actionSummary: string;
    } | null;
    summary: string;
    links: Array<{
      label: string;
      href: string;
    }>;
    triage: Array<{
      label: string;
      value: string;
    }>;
  }>;
}

const summaryOrder: Array<{ key: keyof AdminQueueFailureMonitoringSummary; label: string }> = [
  { key: "totalItems", label: "Visible jobs" },
  { key: "failedItems", label: "Failed" },
  { key: "retryingItems", label: "Retrying" },
  { key: "providerPageIngestItems", label: "Page ingest" },
  { key: "sourceRefreshItems", label: "Source refresh" },
  { key: "sourceProbeItems", label: "Source probe" },
];

function formatDate(value?: Date | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function buildAlertActionSummary({
  alertReady,
  escalationReason,
}: {
  alertReady: boolean;
  escalationReason: string;
}) {
  if (!alertReady) {
    return "Monitoring only";
  }

  switch (escalationReason) {
    case "terminal failure":
      return "Operator action required";
    case "repeated retryable failure":
      return "Escalated after repeated retries";
    case "first retryable failure":
      return "Needs attention if retries continue";
    default:
      return "Alert-ready operator follow-up";
  }
}

export function getQueueFailureMonitoringSummary(summary?: AdminQueueFailureMonitoringSummary) {
  return (
    summary ?? {
      totalItems: 0,
      failedItems: 0,
      retryingItems: 0,
      providerPageIngestItems: 0,
      sourceRefreshItems: 0,
      sourceProbeItems: 0,
    }
  );
}

export function buildQueueFailureMonitoringViewModel({
  page,
  errorMessage,
  searchState,
}: {
  page?: AdminQueueFailureMonitoringPageRecord;
  errorMessage?: string;
  searchState: QueueFailureSearchState;
}): QueueFailureMonitoringViewModel {
  const summary = getQueueFailureMonitoringSummary(page?.summary);
  const items = page?.items ?? [];

  return {
    surfaceId: "admin-queue-failures",
    navSection: "queue-failures",
    title: page?.title ?? "Queue Failures",
    description:
      page?.description ??
      "Inspect failed and retrying ingest jobs through the privileged telemetry read model instead of relying on ad hoc logs.",
    summaryMetrics: summaryOrder.map((metric) => ({
      key: metric.key,
      label: metric.label,
      value: summary[metric.key],
    })),
    filterFields: [
      { name: "q", label: "Search", kind: "text", value: searchState.q },
      { name: "visibility", label: "Visibility", kind: "select", value: searchState.visibility },
      { name: "provider", label: "Provider key", kind: "text", value: searchState.provider },
      { name: "jobType", label: "Job type", kind: "select", value: searchState.jobType },
    ],
    errorMessage,
    emptyMessage: !errorMessage && items.length === 0 ? "No failed or retrying jobs matched the current filters." : undefined,
    items: items.map((item) => ({
      key: `${item.jobId}-${item.runId ?? "job"}`,
      title: item.providerDisplayName,
      meta: [item.providerKey, item.providerItemId ? `provider item ${item.providerItemId}` : null, item.target?.sourceId ? `source ${item.target.sourceId}` : null]
        .filter(Boolean)
        .join(" · "),
      badges: [
        formatLabel(item.visibilityState),
        formatLabel(item.retryState),
        item.failureSignal?.severity ? formatLabel(item.failureSignal.severity) : null,
        item.failureSignal?.alertReady ? "alert ready" : null,
        formatLabel(item.jobType),
        formatLabel(item.scope),
      ].filter((badge): badge is string => Boolean(badge)),
      alertSignal: item.failureSignal
        ? {
            severityLabel: formatLabel(item.failureSignal.severity),
            alertReadyLabel: item.failureSignal.alertReady ? "Alert-ready" : "Monitoring only",
            escalationReasonLabel: formatLabel(item.failureSignal.escalationReason),
            actionSummary: buildAlertActionSummary({
              alertReady: item.failureSignal.alertReady,
              escalationReason: formatLabel(item.failureSignal.escalationReason),
            }),
          }
        : null,
      summary: item.lastErrorSummary ?? item.failure?.code ?? "No failure summary stored.",
      links: [
        {
          label: "Open repair queue",
          href: `/admin/repair?q=${encodeURIComponent(item.providerItemId ?? item.providerKey)}`,
        },
        {
          label: "Open inventory",
          href: `/admin/sources?q=${encodeURIComponent(item.target?.sourceId ?? item.providerItemId ?? item.providerKey)}`,
        },
      ],
      triage: [
        {
          label: "Alert signal",
          value: item.failureSignal
            ? `${formatLabel(item.failureSignal.severity)} · ${formatLabel(item.failureSignal.escalationReason)}`
            : "Signal unavailable",
        },
        {
          label: "Failure class",
          value: item.failure ? `${item.failure.category} · ${item.failure.code}` : "Retry state only",
        },
        {
          label: "Attempts",
          value: String(item.attemptCount),
        },
        {
          label: "Runtime",
          value: item.durationMs != null ? `${Math.round(item.durationMs)} ms` : "Not available",
        },
        {
          label: "Started",
          value: formatDate(item.startedAt),
        },
        {
          label: "Finished",
          value: formatDate(item.finishedAt),
        },
        {
          label: "Request / actor",
          value: `${item.requestId ?? "no request id"}${item.actorId ? ` · ${item.actorId}` : ""}`,
        },
        {
          label: "Counts",
          value: `items ${item.counts.itemCount ?? 0} · raw ${item.counts.rawPayloadCount ?? 0} · warnings ${item.counts.warningCount ?? 0}`,
        },
        {
          label: "Checkpoint",
          value: `${item.checkpoint?.cursor ? `cursor ${item.checkpoint.cursor}` : "cursor none"}${item.checkpoint?.page != null ? ` · page ${item.checkpoint.page}` : ""}`,
        },
        {
          label: "Target",
          value: `${item.target?.sourceKind ?? "No target kind"}${item.target?.providerLineKey ? ` · ${item.target.providerLineKey}` : ""}`,
        },
        {
          label: "Request context",
          value: `${item.request?.page != null ? `page ${item.request.page}` : "no page"}${item.request?.cursor ? ` · cursor ${item.request.cursor}` : ""}`,
        },
        {
          label: "HTTP / retryable",
          value: `${item.failure?.status != null ? `HTTP ${item.failure.status}` : "status n/a"}${item.failure ? ` · ${item.failure.retryable ? "retryable" : "terminal"}` : ""}`,
        },
        {
          label: "Error name",
          value: item.failure?.errorName ?? "Not available",
        },
      ],
    })),
  };
}
