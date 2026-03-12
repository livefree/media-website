import Link from "next/link";

import styles from "./admin-source-repair.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";
import { buildQueueFailureMonitoringViewModel } from "./admin-queue-failure.helpers";

import type { AdminQueueFailureMonitoringPageRecord } from "../../lib/server/admin";
import type { QueueFailureSearchState } from "./admin-queue-failure.helpers";

const visibilityClassNames: Record<string, string> = {
  failed: styles.statusFailed,
  retrying: styles.statusRetrying,
};

const retryStateClassNames: Record<string, string> = {
  retrying: styles.statusRetrying,
  retryable_failure: styles.statusWaiting,
  terminal_failure: styles.statusFailed,
};

const alertSeverityClassNames: Record<string, string> = {
  retrying_noise: styles.alertRetryingNoise,
  degraded_attention: styles.alertDegradedAttention,
  operator_action_required: styles.alertOperatorActionRequired,
};

export function AdminQueueFailureMonitoringPage({
  page,
  errorMessage,
  searchState,
}: {
  page?: AdminQueueFailureMonitoringPageRecord;
  errorMessage?: string;
  searchState: QueueFailureSearchState;
}) {
  const viewModel = buildQueueFailureMonitoringViewModel({
    page,
    errorMessage,
    searchState,
  });

  return (
    <main className={styles.opsPage}>
      <div className={styles.opsShell}>
        <AdminOperatorNav activeSection={viewModel.navSection} />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{viewModel.title}</h1>
            <p className={styles.pageSubtitle}>{viewModel.description}</p>
          </div>
          <div className={styles.summaryGrid}>
            {viewModel.summaryMetrics.map((metric) => (
              <div className={styles.metricCard} key={metric.key}>
                <span className={styles.metricValue}>{metric.value}</span>
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
                defaultValue={viewModel.filterFields[0]?.value ?? ""}
                name="q"
                placeholder="Provider item, source id, request id, or failure code"
              />
            </label>

            <label className={styles.fieldLabel}>
              Visibility
              <select className={styles.fieldInput} defaultValue={viewModel.filterFields[1]?.value ?? ""} name="visibility">
                <option value="">All states</option>
                <option value="failed">Failed</option>
                <option value="retrying">Retrying</option>
              </select>
            </label>

            <label className={styles.fieldLabel}>
              Provider key
              <input className={styles.fieldInput} defaultValue={viewModel.filterFields[2]?.value ?? ""} name="provider" placeholder="jszyapi_vod_json" />
            </label>

            <label className={styles.fieldLabel}>
              Job type
              <select className={styles.fieldInput} defaultValue={viewModel.filterFields[3]?.value ?? ""} name="jobType">
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

        {viewModel.errorMessage ? <div className={styles.warningState}>{viewModel.errorMessage}</div> : null}

        {viewModel.emptyMessage ? <div className={styles.emptyState}>{viewModel.emptyMessage}</div> : null}

        {!viewModel.errorMessage && viewModel.items.length > 0 ? (
          <section className={styles.cardList}>
            {viewModel.items.map((item) => (
              <article className={styles.queueCard} key={item.key}>
                <div className={styles.queueHeader}>
                  <div>
                    <div className={styles.badgeRow}>
                      {item.badges.map((badge, index) => {
                        const className =
                          index === 0
                            ? visibilityClassNames[badge.replaceAll(" ", "_")] ?? ""
                            : index === 1
                              ? retryStateClassNames[badge.replaceAll(" ", "_")] ?? ""
                              : "";

                        return (
                          <span className={`${styles.badge} ${className}`} key={`${item.key}-${badge}`}>
                            {badge}
                          </span>
                        );
                      })}
                    </div>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <p className={styles.cardMeta}>{item.meta}</p>
                  </div>

                  <div className={styles.cardLinks}>
                    {item.links.map((link) => (
                      <Link className={styles.secondaryLink} href={link.href} key={`${item.key}-${link.label}`}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <p className={styles.cardSummary}>{item.summary}</p>

                {item.alertSignal ? (
                  <div className={styles.alertSignalPanel}>
                    <div className={styles.badgeRow}>
                      <span className={`${styles.badge} ${alertSeverityClassNames[item.alertSignal.severityLabel.replaceAll(" ", "_")] ?? ""}`}>
                        {item.alertSignal.severityLabel}
                      </span>
                      <span className={`${styles.badge} ${item.alertSignal.alertReadyLabel === "Alert-ready" ? styles.alertReady : styles.alertMonitoringOnly}`}>
                        {item.alertSignal.alertReadyLabel}
                      </span>
                    </div>

                    <p className={styles.alertSignalSummary}>{item.alertSignal.actionSummary}</p>
                    <p className={styles.alertSignalMeta}>Escalation reason: {item.alertSignal.escalationReasonLabel}</p>
                  </div>
                ) : null}

                <div className={styles.dataGrid}>
                  {item.triage.map((entry) => (
                    <div className={styles.dataTile} key={`${item.key}-${entry.label}`}>
                      <span className={styles.dataLabel}>{entry.label}</span>
                      <span className={styles.dataValue}>{entry.value}</span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
