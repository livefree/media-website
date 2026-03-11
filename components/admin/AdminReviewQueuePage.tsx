import Link from "next/link";

import styles from "./admin-review.module.css";

import type { ReviewQueueListItemRecord } from "../../lib/db/repositories/review";

const statusClassNames: Record<string, string> = {
  pending: styles.statusPending,
  in_review: styles.statusInReview,
  approved_for_publish: styles.statusApproved,
  rejected: styles.statusRejected,
  published: styles.statusPublished,
  superseded: styles.statusSuperseded,
  unpublished: styles.statusUnpublished,
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value?: Date | null) {
  if (!value) {
    return "Not started";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function AdminReviewQueuePage({
  queue,
  errorMessage,
}: {
  queue: ReviewQueueListItemRecord[];
  errorMessage?: string;
}) {
  const queuedCount = queue.filter((entry) => entry.queueEntry.status === "pending").length;
  const approvedCount = queue.filter((entry) => entry.queueEntry.status === "approved_for_publish").length;

  return (
    <main className={styles.adminPage}>
      <div className={styles.adminShell}>
        <header className={styles.adminHeader}>
          <div>
            <p className={styles.eyebrow}>Admin Workflow</p>
            <h1 className={styles.adminTitle}>Review Queue</h1>
            <p className={styles.adminSubtitle}>
              Operator-only surface for normalized candidates, match signals, and explicit publish actions. Public site routes
              remain isolated from this workflow.
            </p>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.metricPill}>{queue.length} queue entries</span>
            <span className={styles.metricPill}>{queuedCount} pending</span>
            <span className={styles.metricPill}>{approvedCount} approved for publish</span>
          </div>
        </header>

        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Queue Overview</h2>
          <p className={styles.panelSubtitle}>
            Use this route to inspect staged normalized candidates before they can write canonical catalog state.
          </p>

          {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

          {!errorMessage && queue.length === 0 ? (
            <div className={styles.emptyState}>No review queue entries are available yet. Queue normalized candidates before review.</div>
          ) : null}

          {!errorMessage && queue.length > 0 ? (
            <div className={styles.queueList}>
              {queue.map((entry) => (
                <article className={styles.queueCard} key={entry.queueEntry.id}>
                  <div className={styles.queueTopRow}>
                    <div>
                      <h3 className={styles.queueTitle}>{entry.candidate.title.display}</h3>
                      <p className={styles.queueMeta}>
                        {entry.candidate.mediaType} · {entry.candidate.releaseYear ?? "year unknown"} · queued{" "}
                        {formatDate(entry.queueEntry.queuedAt)}
                      </p>
                    </div>
                    <span className={`${styles.statusBadge} ${statusClassNames[entry.queueEntry.status] ?? ""}`}>
                      {formatStatus(entry.queueEntry.status)}
                    </span>
                  </div>

                  <div className={styles.pillRow}>
                    <span className={styles.microPill}>{entry.aliasCount} aliases</span>
                    <span className={styles.microPill}>{entry.matchSuggestionCount} match suggestions</span>
                    <span className={styles.microPill}>{entry.duplicateSignalCount} duplicate signals</span>
                    {entry.latestPublishOperation ? (
                      <span className={styles.microPill}>latest publish: {entry.latestPublishOperation.status}</span>
                    ) : null}
                  </div>

                  <Link className={styles.queueActionLink} href={`/admin/review/${entry.queueEntry.id}`}>
                    Open review
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
