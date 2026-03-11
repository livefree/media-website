import Link from "next/link";

import styles from "./admin-source-repair.module.css";
import { acknowledgeRepairQueueEntryAction, resolveRepairQueueEntryAction } from "../../app/admin/repair/actions";
import { AdminOperatorNav } from "./AdminOperatorNav";

import type { AdminRepairQueuePageRecord, AdminRepairQueueSummary } from "../../lib/server/admin";

interface RepairQueueSearchState {
  q: string;
  status: string;
  severity: string;
  health: string;
}

const summaryOrder: Array<{ key: keyof AdminRepairQueueSummary; label: string }> = [
  { key: "totalItems", label: "Queue entries" },
  { key: "openItems", label: "Open" },
  { key: "inProgressItems", label: "In progress" },
  { key: "waitingProviderItems", label: "Waiting provider" },
  { key: "resolvedItems", label: "Resolved" },
  { key: "dismissedItems", label: "Dismissed" },
];

const statusClassNames: Record<string, string> = {
  open: styles.statusOpen,
  in_progress: styles.statusInProgress,
  waiting_provider: styles.statusWaiting,
  resolved: styles.statusResolved,
  dismissed: styles.statusDismissed,
};

const severityClassNames: Record<string, string> = {
  low: styles.severityLow,
  medium: styles.severityMedium,
  high: styles.severityHigh,
  critical: styles.severityCritical,
};

const healthClassNames: Record<string, string> = {
  healthy: styles.healthHealthy,
  degraded: styles.healthDegraded,
  broken: styles.healthBroken,
  replaced: styles.healthReplaced,
  offline: styles.healthOffline,
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value?: Date | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getSummary(summary?: AdminRepairQueueSummary) {
  return (
    summary ?? {
      totalItems: 0,
      openItems: 0,
      inProgressItems: 0,
      waitingProviderItems: 0,
      resolvedItems: 0,
      dismissedItems: 0,
    }
  );
}

export function AdminRepairQueuePage({
  page,
  errorMessage,
  flashMessage,
  returnTo,
  searchState,
}: {
  page?: AdminRepairQueuePageRecord;
  errorMessage?: string;
  flashMessage?: string;
  returnTo: string;
  searchState: RepairQueueSearchState;
}) {
  const summary = getSummary(page?.summary);
  const items = page?.items ?? [];

  return (
    <main className={styles.opsPage}>
      <div className={styles.opsShell}>
        <AdminOperatorNav activeSection="repair" />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{page?.title ?? "Repair Queue"}</h1>
            <p className={styles.pageSubtitle}>
              {page?.description ??
                "Track degraded or broken published sources through the backend repair queue without falling back to logs or direct database access."}
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
              <h2 className={styles.panelTitle}>Queue Filters</h2>
              <p className={styles.panelSubtitle}>Filter durable repair records by summary text, status, severity, and current health state.</p>
            </div>
            <Link className={styles.secondaryLink} href="/admin/repair">
              Clear filters
            </Link>
          </div>

          <form action="/admin/repair" className={styles.filterForm} method="get">
            <label className={styles.fieldLabel}>
              Search
              <input className={styles.fieldInput} defaultValue={searchState.q} name="q" placeholder="Title, resource label, provider, or summary" />
            </label>

            <label className={styles.fieldLabel}>
              Status
              <select className={styles.fieldInput} defaultValue={searchState.status} name="status">
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="waiting_provider">Waiting provider</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </label>

            <label className={styles.fieldLabel}>
              Severity
              <select className={styles.fieldInput} defaultValue={searchState.severity} name="severity">
                <option value="">All severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>

            <label className={styles.fieldLabel}>
              Health state
              <select className={styles.fieldInput} defaultValue={searchState.health} name="health">
                <option value="">All health states</option>
                <option value="healthy">Healthy</option>
                <option value="degraded">Degraded</option>
                <option value="broken">Broken</option>
                <option value="replaced">Replaced</option>
                <option value="offline">Offline</option>
              </select>
            </label>

            <div className={styles.filterActions}>
              <button className={styles.primaryButton} type="submit">
                Apply filters
              </button>
            </div>
          </form>
        </section>

        {flashMessage ? <div className={styles.flashMessage}>{flashMessage}</div> : null}
        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

        {!errorMessage && items.length === 0 ? (
          <div className={styles.emptyState}>No repair queue entries matched the current filters.</div>
        ) : null}

        {!errorMessage && items.length > 0 ? (
          <section className={styles.cardList}>
            {items.map((item) => (
              <article className={styles.queueCard} key={item.id}>
                <div className={styles.queueHeader}>
                  <div>
                    <div className={styles.badgeRow}>
                      <span className={`${styles.badge} ${statusClassNames[item.status] ?? ""}`}>{formatLabel(item.status)}</span>
                      <span className={`${styles.badge} ${severityClassNames[item.severity] ?? ""}`}>{item.severity}</span>
                      <span className={`${styles.badge} ${healthClassNames[item.currentHealthState] ?? ""}`}>{item.currentHealthState}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{item.mediaTitle}</h3>
                    <p className={styles.cardMeta}>
                      {item.episodeLabel ? `${item.episodeLabel} · ` : ""}
                      {item.resourceLabel} · {item.resourceKind} · {item.providerDisplayName ?? item.providerAdapterKey ?? item.providerId ?? "provider unknown"}
                    </p>
                  </div>

                  <div className={styles.cardLinks}>
                    <Link className={styles.secondaryLink} href={`/media/${item.mediaSlug}`}>
                      View title
                    </Link>
                    <Link className={styles.secondaryLink} href={`/admin/sources?q=${encodeURIComponent(item.mediaTitle)}`}>
                      Open inventory
                    </Link>
                  </div>
                </div>

                <p className={styles.cardSummary}>{item.summary}</p>

                <div className={styles.dataGrid}>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Trigger</span>
                    <span className={styles.dataValue}>{formatLabel(item.trigger)}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Probe</span>
                    <span className={styles.dataValue}>{item.probeSummary ?? item.probeKind ?? "No probe summary stored"}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>First seen</span>
                    <span className={styles.dataValue}>{formatDate(item.createdAt)}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Last observed</span>
                    <span className={styles.dataValue}>{formatDate(item.lastObservedAt)}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Resolved</span>
                    <span className={styles.dataValue}>{formatDate(item.resolvedAt)}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Resource</span>
                    <span className={styles.dataValue}>{item.resourcePublicId}</span>
                  </div>
                </div>

                <div className={styles.actionRow}>
                  {item.status === "open" ? (
                    <form action={acknowledgeRepairQueueEntryAction}>
                      <input name="entryId" type="hidden" value={item.id} />
                      <input name="returnTo" type="hidden" value={returnTo} />
                      <button className={styles.secondaryButton} type="submit">
                        Acknowledge
                      </button>
                    </form>
                  ) : null}

                  {item.status !== "resolved" && item.status !== "dismissed" ? (
                    <form action={resolveRepairQueueEntryAction}>
                      <input name="entryId" type="hidden" value={item.id} />
                      <input name="returnTo" type="hidden" value={returnTo} />
                      <button className={styles.primaryButton} type="submit">
                        Mark resolved
                      </button>
                    </form>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
