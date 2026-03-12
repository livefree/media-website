import styles from "./admin-source-repair.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";

import type { AdminRecoveryReadinessPageRecord } from "../../lib/server/admin";
import type { RecoveryReadinessReasonCode, RecoveryReadinessState } from "../../lib/server/health";

const readinessStateClassNames: Record<RecoveryReadinessState, string> = {
  ready: styles.healthHealthy,
  degraded: styles.healthDegraded,
  blocked: styles.statusFailed,
};

const restoreStatusClassNames = {
  succeeded: styles.statusResolved,
  partial: styles.healthDegraded,
  failed: styles.statusFailed,
} as const;

function formatDate(value?: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatAgeHours(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Unavailable";
  }

  const rounded = Number(value.toFixed(1));
  return `${rounded}h old`;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatReasonText(reasonCode: RecoveryReadinessReasonCode) {
  switch (reasonCode) {
    case "ready":
      return "No blocking recovery concerns";
    case "backup_missing":
      return "No backup artifact recorded";
    case "backup_stale":
      return "Latest backup artifact is stale";
    case "restore_rehearsal_missing":
      return "No restore rehearsal recorded";
    case "restore_rehearsal_stale":
      return "Latest restore rehearsal is stale";
    case "restore_rehearsal_partial":
      return "Latest restore rehearsal completed only partially";
    case "restore_rehearsal_failed":
      return "Latest restore rehearsal failed";
    default:
      return formatLabel(reasonCode);
  }
}

export function AdminRecoveryReadinessPage({
  page,
  errorMessage,
}: {
  page?: AdminRecoveryReadinessPageRecord;
  errorMessage?: string;
}) {
  const readiness = page?.readiness;
  const backupArtifact = readiness?.backupArtifact ?? null;
  const restoreRehearsal = readiness?.latestRestoreRehearsal ?? null;
  const reasonCodes = readiness?.contributingReasonCodes.filter((code) => code !== "ready") ?? [];

  return (
    <main className={styles.opsPage}>
      <div className={styles.opsShell}>
        <AdminOperatorNav activeSection="recovery-readiness" />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{page?.title ?? "Recovery Readiness"}</h1>
            <p className={styles.pageSubtitle}>
              {page?.description ??
                "Inspect operator-visible backup freshness and restore rehearsal state without direct database access."}
            </p>
          </div>

          <div className={styles.summaryGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{readiness ? formatLabel(readiness.state) : "Unavailable"}</span>
              <span className={styles.metricLabel}>Current state</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{readiness ? formatAgeHours(readiness.backupAgeHours) : "Unavailable"}</span>
              <span className={styles.metricLabel}>Latest backup freshness</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{readiness ? formatAgeHours(readiness.restoreAgeHours) : "Unavailable"}</span>
              <span className={styles.metricLabel}>Latest restore rehearsal</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{readiness ? formatDate(readiness.checkedAt) : "Unavailable"}</span>
              <span className={styles.metricLabel}>Checked at</span>
            </div>
          </div>
        </header>

        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

        {!errorMessage && readiness ? (
          <>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Recovery State</h2>
                  <p className={styles.panelSubtitle}>
                    Readiness is computed from backup freshness and restore rehearsal signals against the current policy.
                  </p>
                </div>
              </div>

              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${readinessStateClassNames[readiness.state]}`}>{formatLabel(readiness.state)}</span>
                <span className={styles.badge}>Primary reason {formatLabel(readiness.reasonCode)}</span>
              </div>

              <p className={styles.alertSignalSummary}>{readiness.summary}</p>

              <div className={styles.dataGrid}>
                <div className={styles.dataTile}>
                  <span className={styles.dataLabel}>Backup policy</span>
                  <span className={styles.dataValue}>Max age {readiness.policy.backupMaxAgeHours}h</span>
                </div>
                <div className={styles.dataTile}>
                  <span className={styles.dataLabel}>Restore rehearsal policy</span>
                  <span className={styles.dataValue}>Max age {readiness.policy.restoreMaxAgeHours}h</span>
                </div>
                <div className={styles.dataTile}>
                  <span className={styles.dataLabel}>Backup freshness</span>
                  <span className={styles.dataValue}>{formatAgeHours(readiness.backupAgeHours)}</span>
                </div>
                <div className={styles.dataTile}>
                  <span className={styles.dataLabel}>Restore rehearsal age</span>
                  <span className={styles.dataValue}>{formatAgeHours(readiness.restoreAgeHours)}</span>
                </div>
              </div>

              {reasonCodes.length > 0 ? (
                <div className={styles.reasonPanel}>
                  <span className={styles.dataLabel}>Operator attention</span>
                  <ul className={styles.reasonList}>
                    {reasonCodes.map((reasonCode) => (
                      <li className={styles.reasonItem} key={reasonCode}>
                        {formatReasonText(reasonCode)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className={styles.detailGrid}>
              <article className={styles.queueCard}>
                <div className={styles.queueHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Backup Freshness</h2>
                    <p className={styles.panelSubtitle}>Latest successful backup artifact and freshness context shown to operators.</p>
                  </div>
                  <span className={`${styles.badge} ${backupArtifact ? styles.statusResolved : styles.statusFailed}`}>
                    {backupArtifact ? "Backup recorded" : "Backup missing"}
                  </span>
                </div>

                {backupArtifact ? (
                  <div className={styles.dataGrid}>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Artifact key</span>
                      <span className={styles.dataValue}>{backupArtifact.artifactKey}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Completed at</span>
                      <span className={styles.dataValue}>{formatDate(backupArtifact.completedAt)}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Freshness</span>
                      <span className={styles.dataValue}>{formatAgeHours(readiness.backupAgeHours)}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Expires at</span>
                      <span className={styles.dataValue}>{formatDate(backupArtifact.expiresAt)}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Coverage scope</span>
                      <span className={styles.dataValue}>{backupArtifact.coverageScope ?? "Not recorded"}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Artifact ref</span>
                      <span className={styles.dataValue}>{backupArtifact.artifactRef ?? "Not recorded"}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Summary</span>
                      <span className={styles.dataValue}>{backupArtifact.summary}</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.warningState}>No successful backup artifact is currently available for operator recovery checks.</div>
                )}
              </article>

              <article className={styles.queueCard}>
                <div className={styles.queueHeader}>
                  <div>
                    <h2 className={styles.panelTitle}>Restore Rehearsal</h2>
                    <p className={styles.panelSubtitle}>Latest restore rehearsal outcome, timing, and operator-facing result summary.</p>
                  </div>
                  <span className={`${styles.badge} ${restoreRehearsal ? restoreStatusClassNames[restoreRehearsal.status] : styles.statusFailed}`}>
                    {restoreRehearsal ? formatLabel(restoreRehearsal.status) : "Restore missing"}
                  </span>
                </div>

                {restoreRehearsal ? (
                  <div className={styles.dataGrid}>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Rehearsed at</span>
                      <span className={styles.dataValue}>{formatDate(restoreRehearsal.rehearsedAt)}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Age</span>
                      <span className={styles.dataValue}>{formatAgeHours(readiness.restoreAgeHours)}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Summary</span>
                      <span className={styles.dataValue}>{restoreRehearsal.summary}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Actor</span>
                      <span className={styles.dataValue}>{restoreRehearsal.actorId ?? "System"}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Request id</span>
                      <span className={styles.dataValue}>{restoreRehearsal.requestId ?? "Not recorded"}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Backup artifact</span>
                      <span className={styles.dataValue}>{restoreRehearsal.backupArtifactId ?? "Not linked"}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Notes</span>
                      <span className={styles.dataValue}>{restoreRehearsal.notes ?? "No rehearsal notes recorded."}</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.warningState}>No restore rehearsal has been recorded for recovery readiness yet.</div>
                )}
              </article>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
