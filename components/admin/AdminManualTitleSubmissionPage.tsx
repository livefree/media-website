import Link from "next/link";

import styles from "./admin-workstream3.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";
import {
  buildAdminManualTitleSubmissionPath,
  formatAdminWorkflowLabel,
} from "./admin-workstream3.helpers";
import {
  createManualTitleSubmissionAction,
  submitManualTitleStatusAction,
} from "../../app/admin/manual-titles/actions";

import type { AdminManualTitleSubmissionPageRecord } from "../../lib/server/admin";
import type { ManualTitleSubmissionDetailRecord } from "../../lib/server/review";

interface ManualTitleSearchState {
  q: string;
  status: string;
  typeHint: string;
  submission: string;
}

const summaryOrder = [
  { key: "totalItems", label: "Submissions" },
  { key: "submittedItems", label: "Submitted" },
  { key: "inReviewItems", label: "In review" },
  { key: "acceptedItems", label: "Accepted" },
  { key: "followupItems", label: "Needs follow-up" },
  { key: "rejectedItems", label: "Rejected" },
] as const;

const statusClassNames: Record<string, string> = {
  submitted: styles.statusSubmitted,
  in_review: styles.statusInReview,
  accepted: styles.statusAccepted,
  rejected: styles.statusRejected,
  needs_followup: styles.statusFollowup,
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

function getSummary(page?: AdminManualTitleSubmissionPageRecord) {
  return (
    page?.summary ?? {
      totalItems: 0,
      submittedItems: 0,
      inReviewItems: 0,
      acceptedItems: 0,
      rejectedItems: 0,
      followupItems: 0,
    }
  );
}

export function AdminManualTitleSubmissionPage({
  page,
  detail,
  errorMessage,
  detailErrorMessage,
  flashMessage,
  returnTo,
  searchState,
}: {
  page?: AdminManualTitleSubmissionPageRecord;
  detail?: ManualTitleSubmissionDetailRecord;
  errorMessage?: string;
  detailErrorMessage?: string;
  flashMessage?: string;
  returnTo: string;
  searchState: ManualTitleSearchState;
}) {
  const summary = getSummary(page);
  const items = page?.items ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AdminOperatorNav activeSection="manual-titles" />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{page?.title ?? "Manual Title Submissions"}</h1>
            <p className={styles.pageSubtitle}>
              {page?.description ??
                "Create title intake records and track their operator-managed workflow state without writing directly into the public catalog."}
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

        {flashMessage ? <div className={styles.flashMessage}>{flashMessage}</div> : null}
        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

        <div className={styles.mainLayout}>
          <section className={styles.listColumn}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Create Manual Title Submission</h2>
                  <p className={styles.panelSubtitle}>This form creates a reviewable submission record and leaves canonical publishing decisions in later backend workflows.</p>
                </div>
              </div>

              <form action={createManualTitleSubmissionAction} className={styles.createForm}>
                <input name="returnTo" type="hidden" value={returnTo} />

                <label className={styles.fieldLabel}>
                  Title
                  <input className={styles.fieldInput} name="title" placeholder="Glass Harbor" required />
                </label>

                <label className={styles.fieldLabel}>
                  Original title
                  <input className={styles.fieldInput} name="originalTitle" placeholder="Optional original title" />
                </label>

                <label className={styles.fieldLabel}>
                  Type hint
                  <select className={styles.fieldInput} defaultValue="unknown" name="typeHint">
                    <option value="unknown">Unknown</option>
                    <option value="movie">Movie</option>
                    <option value="series">Series</option>
                    <option value="anime">Anime</option>
                    <option value="variety">Variety</option>
                    <option value="documentary">Documentary</option>
                    <option value="special">Special</option>
                  </select>
                </label>

                <label className={styles.fieldLabel}>
                  Release year
                  <input className={styles.fieldInput} inputMode="numeric" name="releaseYear" placeholder="2026" />
                </label>

                <label className={styles.fieldLabel}>
                  Origin country
                  <input className={styles.fieldInput} name="originCountry" placeholder="Japan" />
                </label>

                <label className={styles.fieldLabel}>
                  Language
                  <input className={styles.fieldInput} name="language" placeholder="ja" />
                </label>

                <label className={styles.fieldLabel}>
                  Source URL
                  <input className={styles.fieldInput} name="sourceUrl" placeholder="https://example.com/title-note" />
                </label>

                <label className={styles.fieldLabel}>
                  Submitted by
                  <input className={styles.fieldInput} name="submittedByName" placeholder="Operator name" />
                </label>

                <label className={styles.fieldLabel}>
                  Submitter email
                  <input className={styles.fieldInput} name="submittedByEmail" placeholder="operator@example.com" />
                </label>

                <label className={`${styles.fieldLabel} ${styles.fieldSpan2}`}>
                  Summary
                  <textarea className={styles.fieldTextarea} name="summary" placeholder="Short rationale for why this title should enter intake." />
                </label>

                <label className={`${styles.fieldLabel} ${styles.fieldSpan2}`}>
                  Operator notes
                  <textarea className={styles.fieldTextarea} name="notes" placeholder="Metadata gaps, title-matching concerns, or review notes." />
                </label>

                <div className={styles.actionRow}>
                  <button className={styles.primaryButton} type="submit">
                    Create submission
                  </button>
                </div>
              </form>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Submission Filters</h2>
                  <p className={styles.panelSubtitle}>Filter the intake queue by title text, workflow status, and type hint.</p>
                </div>
                <Link className={styles.secondaryLink} href="/admin/manual-titles">
                  Clear filters
                </Link>
              </div>

              <form action="/admin/manual-titles" className={styles.filterForm} method="get">
                <label className={styles.fieldLabel}>
                  Search
                  <input className={styles.fieldInput} defaultValue={searchState.q} name="q" placeholder="Title, original title, notes, or submitter" />
                </label>

                <label className={styles.fieldLabel}>
                  Status
                  <select className={styles.fieldInput} defaultValue={searchState.status} name="status">
                    <option value="">All statuses</option>
                    <option value="submitted">Submitted</option>
                    <option value="in_review">In review</option>
                    <option value="accepted">Accepted</option>
                    <option value="needs_followup">Needs follow-up</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>

                <label className={styles.fieldLabel}>
                  Type hint
                  <select className={styles.fieldInput} defaultValue={searchState.typeHint} name="typeHint">
                    <option value="">All type hints</option>
                    <option value="movie">Movie</option>
                    <option value="series">Series</option>
                    <option value="anime">Anime</option>
                    <option value="variety">Variety</option>
                    <option value="documentary">Documentary</option>
                    <option value="special">Special</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </label>

                <div className={styles.actionRow}>
                  <button className={styles.primaryButton} type="submit">
                    Apply filters
                  </button>
                </div>
              </form>
            </section>

            {!errorMessage && items.length === 0 ? <div className={styles.emptyState}>No manual title submissions matched the current filters.</div> : null}

            {!errorMessage && items.length > 0 ? (
              <section className={styles.cardList} aria-label="Manual title submissions">
                {items.map((item) => {
                  const detailHref = buildAdminManualTitleSubmissionPath({
                    q: searchState.q,
                    status: searchState.status,
                    typeHint: searchState.typeHint,
                    submission: item.publicId,
                  });

                  return (
                    <article className={styles.card} key={item.id}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardIdentity}>
                          <div className={styles.badgeRow}>
                            <span className={`${styles.badge} ${statusClassNames[item.status] ?? ""}`}>{formatAdminWorkflowLabel(item.status)}</span>
                            <span className={styles.badge}>{item.typeHint}</span>
                            {item.releaseYear ? <span className={styles.badge}>{item.releaseYear}</span> : null}
                          </div>
                          <div>
                            <h2 className={styles.cardTitle}>{item.title}</h2>
                            <p className={styles.cardMeta}>
                              {item.originalTitle && item.originalTitle !== item.title ? `${item.originalTitle} · ` : ""}
                              {item.submittedByName ?? item.submittedByEmail ?? "Unknown submitter"}
                            </p>
                          </div>
                        </div>

                        <div className={styles.linkRow}>
                          <Link className={styles.primaryLink} href={detailHref}>
                            Inspect submission
                          </Link>
                          {item.canonicalMediaPublicId ? (
                            <Link className={styles.secondaryLink} href={`/admin/catalog/${item.canonicalMediaPublicId}`}>
                              Catalog record
                            </Link>
                          ) : null}
                        </div>
                      </div>

                      <p className={styles.cardSummary}>{item.summary ?? item.notes ?? "No summary stored."}</p>

                      <div className={styles.dataGrid}>
                        <div className={styles.dataTile}>
                          <span className={styles.dataLabel}>Workflow state</span>
                          <span className={styles.dataValue}>{item.latestActionSummary ?? "No action summary stored."}</span>
                        </div>
                        <div className={styles.dataTile}>
                          <span className={styles.dataLabel}>Created</span>
                          <span className={styles.dataValue}>{formatDate(item.createdAt)}</span>
                        </div>
                        <div className={styles.dataTile}>
                          <span className={styles.dataLabel}>Review queue</span>
                          <span className={styles.dataValue}>{item.reviewQueueEntryId ?? "Not linked"}</span>
                        </div>
                        <div className={styles.dataTile}>
                          <span className={styles.dataLabel}>Canonical target</span>
                          <span className={styles.dataValue}>{item.canonicalMediaTitle ?? item.canonicalMediaPublicId ?? "Not linked"}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
            ) : null}
          </section>

          <aside className={`${styles.detailColumn} ${styles.stickyPanel}`}>
            <section className={styles.panel}>
              {detail ? (
                <>
                  <div className={styles.detailHeadingRow}>
                    <div>
                      <h2 className={styles.detailTitle}>{detail.submission.title}</h2>
                      <p className={styles.detailLead}>
                        {detail.submission.originalTitle && detail.submission.originalTitle !== detail.submission.title
                          ? `${detail.submission.originalTitle} · `
                          : ""}
                        {detail.submission.typeHint} · created {formatDate(detail.submission.createdAt)}
                      </p>
                    </div>

                    <div className={styles.linkRow}>
                      <span className={`${styles.badge} ${statusClassNames[detail.submission.status] ?? ""}`}>
                        {formatAdminWorkflowLabel(detail.submission.status)}
                      </span>
                      <Link
                        className={styles.secondaryLink}
                        href={buildAdminManualTitleSubmissionPath({
                          q: searchState.q,
                          status: searchState.status,
                          typeHint: searchState.typeHint,
                        })}
                      >
                        Clear selection
                      </Link>
                    </div>
                  </div>

                  {detailErrorMessage ? <div className={styles.warningState}>{detailErrorMessage}</div> : null}

                  <div className={styles.dataGrid}>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Public ID</span>
                      <span className={`${styles.dataValue} ${styles.mono}`}>{detail.submission.publicId}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Release</span>
                      <span className={styles.dataValue}>{detail.submission.releaseYear ?? "Unknown year"}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Origin</span>
                      <span className={styles.dataValue}>{detail.submission.originCountry ?? "Unknown country"}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Language</span>
                      <span className={styles.dataValue}>{detail.submission.language ?? "Unknown language"}</span>
                    </div>
                  </div>

                  <div className={styles.selectionCard}>
                    <h3 className={styles.cardTitle}>Stored notes</h3>
                    <p className={styles.cardSummary}>{detail.submission.summary ?? "No summary stored."}</p>
                    <p className={styles.cardMeta}>{detail.submission.notes ?? "No operator notes stored."}</p>
                    <p className={styles.cardMeta}>
                      submitter {detail.submission.submittedByName ?? detail.submission.submittedByEmail ?? "unknown"} · reviewed{" "}
                      {formatDate(detail.submission.reviewedAt)}
                    </p>
                  </div>

                  <form action={submitManualTitleStatusAction} className={styles.statusForm}>
                    <input name="publicId" type="hidden" value={detail.submission.publicId} />
                    <input name="returnTo" type="hidden" value={returnTo} />

                    <label className={styles.fieldLabel}>
                      Operator notes
                      <textarea className={styles.fieldTextarea} name="notes" placeholder="Review decision, follow-up request, or merge note." />
                    </label>

                    <label className={styles.fieldLabel}>
                      Canonical media ID
                      <input className={styles.fieldInput} defaultValue={detail.submission.canonicalMediaId ?? ""} name="canonicalMediaId" placeholder="Optional canonical media ID" />
                    </label>

                    <label className={styles.fieldLabel}>
                      Review queue entry ID
                      <input className={styles.fieldInput} defaultValue={detail.submission.reviewQueueEntryId ?? ""} name="reviewQueueEntryId" placeholder="Optional review queue entry ID" />
                    </label>

                    <div className={styles.statusActions}>
                      <button className={styles.secondaryButton} name="status" type="submit" value="in_review">
                        Move to in review
                      </button>
                      <button className={styles.secondaryButton} name="status" type="submit" value="needs_followup">
                        Needs follow-up
                      </button>
                      <button className={styles.primaryButton} name="status" type="submit" value="accepted">
                        Accept
                      </button>
                      <button className={styles.dangerButton} name="status" type="submit" value="rejected">
                        Reject
                      </button>
                    </div>
                  </form>

                  <div className={styles.timelineList}>
                    <h3 className={styles.sectionTitle}>Action History</h3>
                    {detail.actions.length > 0 ? (
                      detail.actions.map((action) => (
                        <article className={styles.timelineCard} key={action.id}>
                          <div className={styles.statusHeader}>
                            <h4 className={styles.timelineHeading}>{formatAdminWorkflowLabel(action.actionType)}</h4>
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
                        </article>
                      ))
                    ) : (
                      <div className={styles.emptyState}>No action history is stored for this submission yet.</div>
                    )}
                  </div>
                </>
              ) : (
                <div className={`${styles.selectionHint} ${styles.emptyState}`}>
                  <div className={styles.gridList}>
                    <h2 className={styles.sectionTitle}>Submission Detail</h2>
                    <p className={styles.emptyNote}>
                      Select a manual title submission from the queue to inspect its stored state and update the narrow operator workflow.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
