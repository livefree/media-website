import Link from "next/link";

import { AdminOperatorNav } from "./AdminOperatorNav";
import styles from "./admin-pending-normalized.module.css";

import type { AdminPendingNormalizedCandidatesPageRecord } from "../../lib/server/admin/types";
import { queueNormalizedCandidateAction } from "../../app/admin/normalized/actions";

interface AdminPendingNormalizedPageProps {
  page?: AdminPendingNormalizedCandidatesPageRecord;
  flashMessage?: string;
  errorMessage?: string;
}

export function AdminPendingNormalizedPage({ page, flashMessage, errorMessage }: AdminPendingNormalizedPageProps) {
  const summary = page?.summary;
  const items = page?.items ?? [];

  return (
    <main className={styles.adminPage}>
      <div className={styles.adminShell}>
        <AdminOperatorNav activeSection="pending-normalized" />

        <header className={styles.adminHeader}>
          <div>
            <p className={styles.eyebrow}>Admin Workflow</p>
            <h1 className={styles.adminTitle}>Pending Normalized Candidates</h1>
            <p className={styles.adminSubtitle}>Inspect normalized candidates that are not yet in review, then queue them into the operator review workflow.</p>
          </div>
          {summary ? (
            <div className={styles.headerMeta}>
              <span className={styles.metricPill}>{summary.totalCandidates} pending</span>
              <span className={styles.metricPill}>{summary.normalizedCandidates} normal</span>
              <span className={styles.metricPill}>{summary.warningCandidates} warning</span>
              <span className={styles.metricPill}>{summary.totalMatchSuggestions} match suggestions</span>
            </div>
          ) : null}
        </header>

        {flashMessage ? <div className={styles.flashMessage}>{flashMessage}</div> : null}
        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

        {!errorMessage ? (
          <section className={styles.panel}>
            <h2 className={styles.panelTitle}>Pending queue</h2>
            <p className={styles.panelSubtitle}>Select a normalized candidate to push it into the operator review queue. All actions are logged with your operator identity.</p>

            {items.length === 0 ? (
              <div className={styles.emptyState}>No normalized candidates are waiting. When new normalized items are ready, they will appear here.</div>
            ) : (
              <div className={styles.candidateGrid}>
                {items.map((item) => (
                  <article className={styles.candidateCard} key={item.candidate.id}>
                    <div className={styles.candidateHeader}>
                      <div>
                        <p className={styles.candidateSource}>{item.candidate.providerId}</p>
                        <h3 className={styles.candidateTitle}>{item.candidate.title.display}</h3>
                        <p className={styles.candidateMeta}>
                          {item.candidate.mediaType} · {item.candidate.releaseYear ?? "year unknown"} · {item.candidate.region ?? "region unknown"}
                        </p>
                      </div>
                      <span className={`${styles.statusBadge} ${item.candidate.status === "warning" ? styles.statusWarning : styles.statusNormal}`}>
                        {item.candidate.status}
                      </span>
                    </div>

                    <p className={styles.candidateSummary}>{item.candidate.summary ?? "No summary was provided."}</p>

                    <div className={styles.pillRow}>
                      <span className={styles.microPill}>{item.aliasCount} aliases</span>
                      <span className={styles.microPill}>{item.matchSuggestionCount} match suggestions</span>
                      <span className={styles.microPill}>{item.duplicateSignalCount} duplicate signals</span>
                    </div>

                    <div className={styles.cardActions}>
                      <form action={queueNormalizedCandidateAction}>
                        <input type="hidden" name="normalizedCandidateId" value={item.candidate.id} />
                        <button className={styles.primaryButton} type="submit">
                          Queue for review
                        </button>
                      </form>
                      <Link className={styles.secondaryLink} href="/admin/review">
                        Go to review queue
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
