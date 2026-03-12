import styles from "./admin-source-repair.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";

import type { AdminFinalLaunchValidationPageRecord } from "../../lib/server/admin";
import type { FinalLaunchValidationDomainRecord, FinalLaunchValidationState } from "../../lib/server/catalog";

const stateClassNames: Record<FinalLaunchValidationState, string> = {
  ready: styles.healthHealthy,
  degraded: styles.healthDegraded,
  blocked: styles.statusFailed,
};

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value?: Date | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatEvidenceValue(value: unknown): string {
  if (value instanceof Date) {
    return formatDate(value);
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.map((item) => formatEvidenceValue(item)).join(", ") : "None";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || value === undefined || value === "") {
    return "Not recorded";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function buildSummaryMetrics(page?: AdminFinalLaunchValidationPageRecord) {
  const validation = page?.validation;
  const domains = validation?.domains ?? [];
  const readyCount = domains.filter((domain) => domain.state === "ready").length;
  const issueCount = validation?.contributingReasonCodes.filter((code) => code !== "ready").length ?? 0;

  return [
    {
      key: "state",
      value: validation ? formatLabel(validation.state) : "Unavailable",
      label: "Launch state",
    },
    {
      key: "domains",
      value: validation ? `${readyCount}/${domains.length}` : "Unavailable",
      label: "Domains ready",
    },
    {
      key: "issues",
      value: validation ? String(issueCount) : "Unavailable",
      label: "Blocking or degraded reasons",
    },
    {
      key: "checked-at",
      value: validation ? formatDate(validation.checkedAt) : "Unavailable",
      label: "Checked at",
    },
  ];
}

function buildEvidenceSummary(page: AdminFinalLaunchValidationPageRecord) {
  const { validation } = page;

  return [
    {
      label: "Published titles",
      value: `${validation.catalogEvidence.publicPublishedCount} public / ${validation.catalogEvidence.adminPublishedCount} admin`,
    },
    {
      label: "Sample title",
      value: validation.catalogEvidence.sampleMediaTitle ?? "Not recorded",
    },
    {
      label: "Sample watch href",
      value: validation.catalogEvidence.sampleCanonicalWatchHref ?? "Not recorded",
    },
    {
      label: "Open repair items",
      value: String(validation.healthEvidence.openRepairCount),
    },
    {
      label: "Failed queue items",
      value: String(validation.healthEvidence.failedQueueFailureCount),
    },
    {
      label: "Admin role",
      value: validation.adminAccessEvidence.currentRole ?? "Not recorded",
    },
    {
      label: "Migration preflight",
      value: formatLabel(validation.migrationPreflight.status),
    },
    {
      label: "Recovery readiness",
      value: formatLabel(validation.recoveryReadiness.state),
    },
  ];
}

function DomainEvidence({ domain }: { domain: FinalLaunchValidationDomainRecord }) {
  const entries = Object.entries(domain.supportingEvidence);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={styles.dataGrid}>
      {entries.map(([key, value]) => (
        <div className={styles.dataTile} key={`${domain.domain}-${key}`}>
          <span className={styles.dataLabel}>{formatLabel(key)}</span>
          <span className={styles.dataValue}>{formatEvidenceValue(value)}</span>
        </div>
      ))}
    </div>
  );
}

export function AdminLaunchValidationPage({
  page,
  errorMessage,
}: {
  page?: AdminFinalLaunchValidationPageRecord;
  errorMessage?: string;
}) {
  const validation = page?.validation;
  const reasonCodes = validation?.contributingReasonCodes.filter((code) => code !== "ready") ?? [];

  return (
    <main className={styles.opsPage}>
      <div className={styles.opsShell}>
        <AdminOperatorNav activeSection="final-launch-validation" />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{page?.title ?? "Final Launch Validation"}</h1>
            <p className={styles.pageSubtitle}>
              {page?.description ??
                "Inspect the accepted backend launch-validation result, per-domain outcomes, and blocking reasons without direct database access."}
            </p>
          </div>

          <div className={styles.summaryGrid}>
            {buildSummaryMetrics(page).map((metric) => (
              <div className={styles.metricCard} key={metric.key}>
                <span className={styles.metricValue}>{metric.value}</span>
                <span className={styles.metricLabel}>{metric.label}</span>
              </div>
            ))}
          </div>
        </header>

        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

        {!errorMessage && validation ? (
          <>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Launch Summary</h2>
                  <p className={styles.panelSubtitle}>
                    This surface renders the bounded backend launch-validation contract directly, including the current state,
                    explicit reason codes, and accepted supporting evidence.
                  </p>
                </div>
              </div>

              <div className={styles.badgeRow}>
                <span className={`${styles.badge} ${stateClassNames[validation.state]}`}>{formatLabel(validation.state)}</span>
                <span className={styles.badge}>Primary reason {formatLabel(validation.reasonCode)}</span>
              </div>

              <p className={styles.alertSignalSummary}>{validation.summary}</p>

              <div className={styles.dataGrid}>
                {buildEvidenceSummary(page).map((entry) => (
                  <div className={styles.dataTile} key={entry.label}>
                    <span className={styles.dataLabel}>{entry.label}</span>
                    <span className={styles.dataValue}>{entry.value}</span>
                  </div>
                ))}
              </div>

              {reasonCodes.length > 0 ? (
                <div className={styles.reasonPanel}>
                  <span className={styles.dataLabel}>Operator attention</span>
                  <ul className={styles.reasonList}>
                    {reasonCodes.map((reasonCode) => (
                      <li className={styles.reasonItem} key={reasonCode}>
                        {formatLabel(reasonCode)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Domain Validation</h2>
                  <p className={styles.panelSubtitle}>
                    Each required launch domain keeps its explicit state, reason code, summary, and supporting evidence visible
                    to operators.
                  </p>
                </div>
              </div>
            </section>

            <section className={styles.cardList}>
              {validation.domains.map((domain) => (
                <article className={styles.queueCard} key={domain.domain}>
                  <div className={styles.queueHeader}>
                    <div>
                      <div className={styles.badgeRow}>
                        <span className={`${styles.badge} ${stateClassNames[domain.state]}`}>{formatLabel(domain.state)}</span>
                        <span className={styles.badge}>{formatLabel(domain.reasonCode)}</span>
                      </div>
                      <h3 className={styles.cardTitle}>{formatLabel(domain.domain)}</h3>
                      <p className={styles.cardMeta}>Observed at {formatDate(domain.observedAt ?? null)}</p>
                    </div>
                  </div>

                  <p className={styles.cardSummary}>{domain.summary}</p>
                  <DomainEvidence domain={domain} />
                </article>
              ))}
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
