import Link from "next/link";

import styles from "./admin-workstream3.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";
import { formatAdminWorkflowLabel } from "./admin-workstream3.helpers";

import type { AdminModerationQueuePageRecord } from "../../lib/server/admin";

interface ModerationSearchState {
  q: string;
  kind: string;
  status: string;
}

const summaryOrder = [
  { key: "totalItems", label: "Reports" },
  { key: "openItems", label: "Open" },
  { key: "inReviewItems", label: "In review" },
  { key: "resolvedItems", label: "Resolved" },
  { key: "dismissedItems", label: "Dismissed" },
] as const;

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

function getSummary(page?: AdminModerationQueuePageRecord) {
  return (
    page?.summary ?? {
      totalItems: 0,
      openItems: 0,
      inReviewItems: 0,
      resolvedItems: 0,
      dismissedItems: 0,
    }
  );
}

export function AdminModerationPage({
  page,
  errorMessage,
  flashMessage,
  returnTo,
  searchState,
}: {
  page?: AdminModerationQueuePageRecord;
  errorMessage?: string;
  flashMessage?: string;
  returnTo: string;
  searchState: ModerationSearchState;
}) {
  const summary = getSummary(page);
  const items = page?.items ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AdminOperatorNav activeSection="moderation" />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{page?.title ?? "Moderation Reports"}</h1>
            <p className={styles.pageSubtitle}>
              {page?.description ??
                "Inspect broken-source and closely related reports, then move them through narrow backend-backed moderation actions only."}
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
              <p className={styles.panelSubtitle}>
                Search by title, report summary, kind, and workflow state through the admin moderation boundary only.
              </p>
            </div>
            <Link className={styles.secondaryLink} href="/admin/moderation">
              Clear filters
            </Link>
          </div>

          <form action="/admin/moderation" className={styles.filterForm} method="get">
            <label className={styles.fieldLabel}>
              Search
              <input className={styles.fieldInput} defaultValue={searchState.q} name="q" placeholder="Title, resource, summary, or reporter" />
            </label>

            <label className={styles.fieldLabel}>
              Kind
              <select className={styles.fieldInput} defaultValue={searchState.kind} name="kind">
                <option value="">All report kinds</option>
                <option value="broken_source">Broken source</option>
                <option value="closely_related">Closely related</option>
              </select>
            </label>

            <label className={styles.fieldLabel}>
              Status
              <select className={styles.fieldInput} defaultValue={searchState.status} name="status">
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="in_review">In review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </label>

            <div className={styles.actionRow}>
              <button className={styles.primaryButton} type="submit">
                Apply filters
              </button>
            </div>
          </form>
        </section>

        {flashMessage ? <div className={styles.flashMessage}>{flashMessage}</div> : null}
        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

        {!errorMessage && items.length === 0 ? <div className={styles.emptyState}>No moderation reports matched the current filters.</div> : null}

        {!errorMessage && items.length > 0 ? (
          <section className={styles.cardList} aria-label="Moderation reports">
            {items.map((item) => (
              <article className={styles.card} key={item.id}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIdentity}>
                    <div className={styles.badgeRow}>
                      <span className={`${styles.badge} ${statusClassNames[item.status] ?? ""}`}>{formatAdminWorkflowLabel(item.status)}</span>
                      <span className={`${styles.badge} ${kindClassNames[item.kind] ?? ""}`}>{formatAdminWorkflowLabel(item.kind)}</span>
                      {item.repairQueueStatus ? (
                        <span className={`${styles.badge} ${statusClassNames[item.repairQueueStatus] ?? ""}`}>
                          repair {formatAdminWorkflowLabel(item.repairQueueStatus)}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <h2 className={styles.cardTitle}>{item.title}</h2>
                      <p className={styles.cardMeta}>
                        {item.mediaTitle ?? "Unlinked title"} {item.episodeTitle ? `· ${item.episodeTitle}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className={styles.linkRow}>
                    <Link className={styles.primaryLink} href={`/admin/moderation/${item.publicId}?from=${encodeURIComponent(returnTo)}`}>
                      Inspect report
                    </Link>
                    {item.mediaSlug ? (
                      <Link className={styles.secondaryLink} href={`/media/${item.mediaSlug}`}>
                        View title
                      </Link>
                    ) : null}
                  </div>
                </div>

                <p className={styles.cardSummary}>{item.summary}</p>

                <div className={styles.dataGrid}>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Reporter</span>
                    <span className={styles.dataValue}>{item.reporterName ?? item.reporterEmail ?? "Anonymous or system-generated"}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Resource</span>
                    <span className={styles.dataValue}>{item.resourceLabel ?? item.resourcePublicId ?? "Not attached to a resource"}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Queued</span>
                    <span className={styles.dataValue}>{formatDate(item.queuedAt)}</span>
                  </div>
                  <div className={styles.dataTile}>
                    <span className={styles.dataLabel}>Latest action</span>
                    <span className={styles.dataValue}>{item.latestActionSummary ?? "No action summary stored."}</span>
                  </div>
                </div>

                <div className={styles.linkRow}>
                  {item.repairQueueEntryId ? (
                    <Link className={styles.secondaryLink} href={`/admin/repair?q=${encodeURIComponent(item.mediaTitle ?? item.resourcePublicId ?? item.publicId)}`}>
                      Repair queue
                    </Link>
                  ) : null}
                  <span className={`${styles.inlineText} ${styles.mono}`}>{item.publicId}</span>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
