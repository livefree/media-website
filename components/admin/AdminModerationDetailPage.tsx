import Link from "next/link";

import styles from "./admin-workstream3.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";
import { formatAdminWorkflowLabel } from "./admin-workstream3.helpers";
import { submitModerationReportAction } from "../../app/admin/moderation/actions";

import type { ModerationReportDetailRecord } from "../../lib/server/review";

const statusClassNames: Record<string, string> = {
  open: styles.statusOpen,
  in_review: styles.statusInReview,
  resolved: styles.statusResolved,
  dismissed: styles.statusDismissed,
};

const kindClassNames: Record<string, string> = {
  broken_source: styles.kindBrokenSource,
  closely_related: styles.kindCloselyRelated,
};

function formatDate(value?: Date | string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminModerationDetailPage({
  detail,
  publicId,
  errorMessage,
  flashMessage,
  returnTo,
}: {
  detail?: ModerationReportDetailRecord;
  publicId?: string;
  errorMessage?: string;
  flashMessage?: string;
  returnTo: string;
}) {
  if (!detail) {
    return (
      <main className={styles.page}>
        <div className={styles.shell}>
          <AdminOperatorNav activeSection="moderation" />

          <header className={styles.heroCard}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Operator Console</p>
              <h1 className={styles.pageTitle}>Moderation Detail</h1>
              <p className={styles.pageSubtitle}>Inspect one report, review its linked source context, and apply only narrow moderation actions.</p>
            </div>
            <div className={styles.topLinkRow}>
              <Link className={styles.primaryLink} href={returnTo}>
                Back to moderation
              </Link>
            </div>
          </header>

          {flashMessage ? <div className={styles.flashMessage}>{flashMessage}</div> : null}
          <div className={styles.warningState}>{errorMessage ?? `Moderation report '${publicId ?? "unknown"}' is unavailable.`}</div>
        </div>
      </main>
    );
  }

  const { report, actions } = detail;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AdminOperatorNav activeSection="moderation" />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{report.title}</h1>
            <p className={styles.pageSubtitle}>
              Report {report.publicId} for {report.mediaTitle ?? "an unlinked title"}{report.episodeTitle ? ` · ${report.episodeTitle}` : ""}.
            </p>
          </div>

          <div className={styles.badgeRow}>
            <span className={`${styles.badge} ${statusClassNames[report.status] ?? ""}`}>{formatAdminWorkflowLabel(report.status)}</span>
            <span className={`${styles.badge} ${kindClassNames[report.kind] ?? ""}`}>{formatAdminWorkflowLabel(report.kind)}</span>
            {report.repairQueueStatus ? (
              <span className={`${styles.badge} ${statusClassNames[report.repairQueueStatus] ?? ""}`}>
                repair {formatAdminWorkflowLabel(report.repairQueueStatus)}
              </span>
            ) : null}
            <Link className={styles.secondaryLink} href={returnTo}>
              Back to moderation
            </Link>
          </div>
        </header>

        {flashMessage ? <div className={styles.flashMessage}>{flashMessage}</div> : null}

        <div className={styles.mainLayout}>
          <section className={styles.listColumn}>
            <section className={styles.panel}>
              <div className={styles.detailHeadingRow}>
                <div>
                  <h2 className={styles.sectionTitle}>Report Context</h2>
                  <p className={styles.panelSubtitle}>Stored report details and linked media/source context from the backend moderation record.</p>
                </div>
                {report.mediaSlug ? (
                  <Link className={styles.secondaryLink} href={`/media/${report.mediaSlug}`}>
                    View title
                  </Link>
                ) : null}
              </div>

              <div className={styles.dataGrid}>
                <div className={styles.dataTile}>
                  <span className={styles.dataLabel}>Public ID</span>
                  <span className={`${styles.dataValue} ${styles.mono}`}>{report.publicId}</span>
                </div>
                <div className={styles.dataTile}>
                  <span className={styles.dataLabel}>Reporter</span>
                  <span className={styles.dataValue}>{report.reporterName ?? report.reporterEmail ?? "Anonymous or operator generated"}</span>
                </div>
                <div className={styles.dataTile}>
                  <span className={styles.dataLabel}>Resource</span>
                  <span className={styles.dataValue}>{report.resourceLabel ?? report.resourcePublicId ?? "No resource linked"}</span>
                </div>
                <div className={styles.dataTile}>
                  <span className={styles.dataLabel}>Linked repair</span>
                  <span className={styles.dataValue}>{report.repairQueueEntryId ?? "No repair entry linked"}</span>
                </div>
                <div className={styles.dataTile}>
                  <span className={styles.dataLabel}>Queued</span>
                  <span className={styles.dataValue}>{formatDate(report.queuedAt)}</span>
                </div>
                <div className={styles.dataTile}>
                  <span className={styles.dataLabel}>Updated</span>
                  <span className={styles.dataValue}>{formatDate(report.updatedAt)}</span>
                </div>
              </div>

              <div className={styles.selectionCard}>
                <h3 className={styles.cardTitle}>Summary</h3>
                <p className={styles.cardSummary}>{report.summary}</p>
                <p className={styles.cardMeta}>{report.detail ?? "No additional report detail was stored."}</p>
                {report.sourceUrl ? (
                  <a className={styles.secondaryLink} href={report.sourceUrl} rel="noreferrer" target="_blank">
                    Open submitted source URL
                  </a>
                ) : null}
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Action History</h2>
                  <p className={styles.panelSubtitle}>Every moderation change is rendered from the backend audit trail.</p>
                </div>
              </div>

              <div className={styles.timelineList}>
                {actions.length > 0 ? (
                  actions.map((action) => (
                    <article className={styles.timelineCard} key={action.id}>
                      <div className={styles.statusHeader}>
                        <h3 className={styles.timelineHeading}>{formatAdminWorkflowLabel(action.actionType)}</h3>
                        {action.statusAfter ? (
                          <span className={`${styles.badge} ${statusClassNames[action.statusAfter] ?? ""}`}>
                            {formatAdminWorkflowLabel(action.statusAfter)}
                          </span>
                        ) : null}
                      </div>
                      <p className={styles.timelineMeta}>
                        actor {action.actorId ?? "system"} · {formatDate(action.createdAt)}
                      </p>
                      <p className={styles.timelineMeta}>{action.summary}</p>
                      {action.notes ? <p className={styles.timelineMeta}>{action.notes}</p> : null}
                      {action.linkedRepairQueueEntryId ? (
                        <p className={styles.timelineMeta}>Linked repair queue entry: {action.linkedRepairQueueEntryId}</p>
                      ) : null}
                    </article>
                  ))
                ) : (
                  <div className={styles.emptyState}>No moderation actions have been recorded yet.</div>
                )}
              </div>
            </section>
          </section>

          <aside className={`${styles.detailColumn} ${styles.stickyPanel}`}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Moderation Actions</h2>
                  <p className={styles.panelSubtitle}>These controls only call backend-owned moderation status transitions.</p>
                </div>
              </div>

              <form action={submitModerationReportAction} className={styles.statusForm}>
                <input name="publicId" type="hidden" value={report.publicId} />
                <input name="returnTo" type="hidden" value={`/admin/moderation/${report.publicId}?from=${encodeURIComponent(returnTo)}`} />

                <label className={styles.fieldLabel}>
                  Operator notes
                  <textarea className={styles.fieldTextarea} defaultValue={report.detail ?? ""} name="notes" placeholder="Review context, follow-up instructions, or dismissal rationale." />
                </label>

                <label className={styles.fieldLabel}>
                  Linked repair queue entry
                  <input
                    className={styles.fieldInput}
                    defaultValue={report.repairQueueEntryId ?? ""}
                    name="linkedRepairQueueEntryId"
                    placeholder="Optional repair queue entry ID"
                  />
                </label>

                <div className={styles.statusActions}>
                  {report.status === "open" ? (
                    <button className={styles.secondaryButton} name="intent" type="submit" value="acknowledge">
                      Move to in review
                    </button>
                  ) : null}
                  {report.status !== "resolved" && report.status !== "dismissed" ? (
                    <button className={styles.primaryButton} name="intent" type="submit" value="resolve">
                      Mark resolved
                    </button>
                  ) : null}
                  {report.status !== "dismissed" ? (
                    <button className={styles.dangerButton} name="intent" type="submit" value="dismiss">
                      Dismiss report
                    </button>
                  ) : null}
                </div>
              </form>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
