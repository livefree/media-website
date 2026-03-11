import Link from "next/link";

import styles from "./admin-source-repair.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";

import type {
  AdminQueueFailureMonitoringPageRecord,
  AdminQueueFailureMonitoringSummary,
} from "../../lib/server/admin";

interface QueueFailureSearchState {
  q: string;
  visibility: string;
  provider: string;
  jobType: string;
}

const summaryOrder: Array<{ key: keyof AdminQueueFailureMonitoringSummary; label: string }> = [
  { key: "totalItems", label: "Visible jobs" },
  { key: "failedItems", label: "Failed" },
  { key: "retryingItems", label: "Retrying" },
  { key: "providerPageIngestItems", label: "Page ingest" },
  { key: "sourceRefreshItems", label: "Source refresh" },
  { key: "sourceProbeItems", label: "Source probe" },
];

const visibilityClassNames: Record<string, string> = {
  failed: styles.statusFailed,
  retrying: styles.statusRetrying,
};

const retryStateClassNames: Record<string, string> = {
  retrying: styles.statusRetrying,
  retryable_failure: styles.statusWaiting,
  terminal_failure: styles.statusFailed,
};

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

function getSummary(summary?: AdminQueueFailureMonitoringSummary) {
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

export function AdminQueueFailureMonitoringPage({
  page,
  errorMessage,
  searchState,
}: {
  page?: AdminQueueFailureMonitoringPageRecord;
  errorMessage?: string;
  searchState: QueueFailureSearchState;
}) {
  const summary = getSummary(page?.summary);
  const items = page?.items ?? [];

  return (
    <main className={styles.opsPage}>
      <div className={styles.opsShell}>
        <AdminOperatorNav activeSection="queue-failures" />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{page?.title ?? "Queue Failures"}</h1>
            <p className={styles.pageSubtitle}>
              {page?.description ??
                "Inspect failed and retrying ingest jobs through the privileged telemetry read model instead of relying on ad hoc logs."}
            </p>
          </div>
          <div className={styles.summaryGrid}>
            {summaryOrder.map((metric) => (
              <div className={styles.metricCard} key={metric.key}>
                <span className={styles.metricValue}>{summary[metric.key]}</span>
                <span className={styles.metricLabel}>{metric.label}</span>
              </div>
            ))}
          </div>
        </header>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Failure Filters</h2>
              <p className={styles.panelSubtitle}>
                Filter by visibility state, provider key, job type, or free-text triage context without expanding into a broad dashboard.
              </p>
            </div>
            <Link className={styles.secondaryLink} href="/admin/queue-failures">
              Clear filters
            </Link>
          </div>

          <form action="/admin/queue-failures" className={styles.filterForm} method="get">
            <label className={styles.fieldLabel}>
              Search
              <input
                className={styles.fieldInput}
                defaultValue={searchState.q}
                name="q"
                placeholder="Provider item, source id, request id, or failure code"
              />
            </label>

            <label className={styles.fieldLabel}>
              Visibility
              <select className={styles.fieldInput} defaultValue={searchState.visibility} name="visibility">
                <option value="">All states</option>
                <option value="failed">Failed</option>
                <option value="retrying">Retrying</option>
              </select>
            </label>

            <label className={styles.fieldLabel}>
              Provider key
              <input className={styles.fieldInput} defaultValue={searchState.provider} name="provider" placeholder="jszyapi_vod_json" />
            </label>

            <label className={styles.fieldLabel}>
              Job type
              <select className={styles.fieldInput} defaultValue={searchState.jobType} name="jobType">
                <option value="">All job types</option>
                <option value="provider_page_ingest">Provider page ingest</option>
                <option value="scheduled_source_refresh">Scheduled source refresh</option>
                <option value="scheduled_source_probe">Scheduled source probe</option>
              </select>
            </label>

            <div className={styles.filterActions}>
              <button className={styles.primaryButton} type="submit">
                Apply filters
              </button>
            </div>
          </form>
        </section>

        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

        {!errorMessage && items.length === 0 ? (
          <div className={styles.emptyState}>No failed or retrying jobs matched the current filters.</div>
        ) : null}

        {!errorMessage && items.length > 0 ? (
          <section className={styles.cardList}>
            {items.map((item) => (
              <article className={styles.queueCard} key={`${item.jobId}-${item.runId ?? "job"}`}>
                <div className={styles.queueHeader}>
                  <div>
                    <div className={styles.badgeRow}>
                      <span className={`${styles.badge} ${visibilityClassNames[item.visibilityState] ?? ""}`}>
                        {formatLabel(item.visibilityState)}
                      </span>
                      <span className={`${styles.badge} ${retryStateClassNames[item.retryState] ?? ""}`}>
                        {formatLabel(item.retryState)}
                      </span>
                      <span className={styles.badge}>{formatLabel(item.jobType)}</span>
                      <span className={styles.badge}>{formatLabel(item.scope)}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{item.providerDisplayName}</h3>
                    <p className={styles.cardMeta}>
                      {item.providerKey}
                      {item.providerItemId ? ` · provider item ${item.providerItemId}` : ""}
                      {item.target?.sourceId ? ` · source ${item.target.sourceId}` : ""}
                    </p>
                  </div>

                  <div className={styles.cardLinks}>
                    <Link className={styles.secondaryLink} href={`/admin/repair?q=${encodeURIComponent(item.providerItemId ?? item.providerKey)}`}>
                      Open repair queue
                    </Link>
                    <Link className={styles.secondaryLink} href={`/admin/sources?q=${encodeURIComponent(item.target?.sourceId ?? item.providerItemId ?? item.providerKey)}`}>
                      Open inventory
                    </Link>
                  </div>
                </div>

                <p className={styles.cardSummary}>{item.lastErrorSummary ?? item.failure?.code ?? "No failure summary stored."}</p>

                <div className={styles.dataGrid}>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Failure class</span>
                    <span className={styles.dataValue}>
                      {item.failure ? `${item.failure.category} · ${item.failure.code}` : "Retry state only"}
                    </span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Attempts</span>
                    <span className={styles.dataValue}>{item.attemptCount}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Runtime</span>
                    <span className={styles.dataValue}>
                      {item.durationMs != null ? `${Math.round(item.durationMs)} ms` : "Not available"}
                    </span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Started</span>
                    <span className={styles.dataValue}>{formatDate(item.startedAt)}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Finished</span>
                    <span className={styles.dataValue}>{formatDate(item.finishedAt)}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Request / actor</span>
                    <span className={styles.dataValue}>
                      {item.requestId ?? "no request id"}
                      {item.actorId ? ` · ${item.actorId}` : ""}
                    </span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Counts</span>
                    <span className={styles.dataValue}>
                      items {item.counts.itemCount ?? 0} · raw {item.counts.rawPayloadCount ?? 0} · warnings {item.counts.warningCount ?? 0}
                    </span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Checkpoint</span>
                    <span className={styles.dataValue}>
                      {item.checkpoint?.cursor ? `cursor ${item.checkpoint.cursor}` : "cursor none"}
                      {item.checkpoint?.page != null ? ` · page ${item.checkpoint.page}` : ""}
                    </span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Target</span>
                    <span className={styles.dataValue}>
                      {item.target?.sourceKind ?? "No target kind"}
                      {item.target?.providerLineKey ? ` · ${item.target.providerLineKey}` : ""}
                    </span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Request context</span>
                    <span className={styles.dataValue}>
                      {item.request?.page != null ? `page ${item.request.page}` : "no page"}
                      {item.request?.cursor ? ` · cursor ${item.request.cursor}` : ""}
                    </span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>HTTP / retryable</span>
                    <span className={styles.dataValue}>
                      {item.failure?.status != null ? `HTTP ${item.failure.status}` : "status n/a"}
                      {item.failure ? ` · ${item.failure.retryable ? "retryable" : "terminal"}` : ""}
                    </span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Error name</span>
                    <span className={styles.dataValue}>{item.failure?.errorName ?? "Not available"}</span>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
