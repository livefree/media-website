import Link from "next/link";

import styles from "./admin-workstream3.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";
import {
  buildAdminManualSourceSubmissionPath,
  formatAdminWorkflowLabel,
} from "./admin-workstream3.helpers";
import {
  createManualSourceSubmissionAction,
  submitManualSourceStatusAction,
} from "../../app/admin/manual-sources/actions";

import type { AdminManualSourceSubmissionPageRecord } from "../../lib/server/admin";
import type { ManualSourceSubmissionDetailRecord } from "../../lib/server/source";

interface ManualSourceSearchState {
  q: string;
  status: string;
  kind: string;
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

function getSummary(page?: AdminManualSourceSubmissionPageRecord) {
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

export function AdminManualSourceSubmissionPage({
  page,
  detail,
  errorMessage,
  detailErrorMessage,
  flashMessage,
  returnTo,
  searchState,
}: {
  page?: AdminManualSourceSubmissionPageRecord;
  detail?: ManualSourceSubmissionDetailRecord;
  errorMessage?: string;
  detailErrorMessage?: string;
  flashMessage?: string;
  returnTo: string;
  searchState: ManualSourceSearchState;
}) {
  const summary = getSummary(page);
  const items = page?.items ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <AdminOperatorNav activeSection="manual-sources" />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{page?.title ?? "Manual Source Submissions"}</h1>
            <p className={styles.pageSubtitle}>
              {page?.description ??
                "Create manual source intake records and track their backend-managed review state without bypassing inventory, repair, or catalog boundaries."}
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
                  <h2 className={styles.sectionTitle}>Create Manual Source Submission</h2>
                  <p className={styles.panelSubtitle}>Create a source candidate tied to a target title or free-text title reference. Public source activation remains out of scope.</p>
                </div>
              </div>

              <form action={createManualSourceSubmissionAction} className={styles.createForm}>
                <input name="returnTo" type="hidden" value={returnTo} />

                <label className={styles.fieldLabel}>
                  Target title text
                  <input className={styles.fieldInput} name="targetTitleText" placeholder="Northline Station" />
                </label>

                <label className={styles.fieldLabel}>
                  Target episode text
                  <input className={styles.fieldInput} name="targetEpisodeText" placeholder="Episode 1" />
                </label>

                <label className={styles.fieldLabel}>
                  Kind
                  <select className={styles.fieldInput} defaultValue="stream" name="kind">
                    <option value="stream">Stream</option>
                    <option value="download">Download</option>
                    <option value="subtitle">Subtitle</option>
                    <option value="trailer">Trailer</option>
                  </select>
                </label>

                <label className={styles.fieldLabel}>
                  Provider
                  <select className={styles.fieldInput} defaultValue="other" name="provider">
                    <option value="other">Other</option>
                    <option value="m3u8">M3U8</option>
                    <option value="mp4">MP4</option>
                    <option value="internal">Internal</option>
                    <option value="quark">Quark</option>
                    <option value="baidu">Baidu</option>
                    <option value="aliyun">Aliyun</option>
                    <option value="magnet">Magnet</option>
                  </select>
                </label>

                <label className={styles.fieldLabel}>
                  Format
                  <input className={styles.fieldInput} name="format" placeholder="hls" required />
                </label>

                <label className={styles.fieldLabel}>
                  Label
                  <input className={styles.fieldInput} name="label" placeholder="Main line" required />
                </label>

                <label className={styles.fieldLabel}>
                  Quality
                  <input className={styles.fieldInput} name="quality" placeholder="1080p" />
                </label>

                <label className={styles.fieldLabel}>
                  Access code
                  <input className={styles.fieldInput} name="accessCode" placeholder="Optional code" />
                </label>

                <label className={`${styles.fieldLabel} ${styles.fieldSpan2}`}>
                  Source URL
                  <input className={styles.fieldInput} name="url" placeholder="https://example.com/master.m3u8" required />
                </label>

                <label className={`${styles.fieldLabel} ${styles.fieldSpan2}`}>
                  Masked URL
                  <input className={styles.fieldInput} name="maskedUrl" placeholder="Optional masked display URL" />
                </label>

                <label className={styles.fieldLabel}>
                  Submitted by
                  <input className={styles.fieldInput} name="submittedByName" placeholder="Operator name" />
                </label>

                <label className={styles.fieldLabel}>
                  Submitter email
                  <input className={styles.fieldInput} name="submittedByEmail" placeholder="operator@example.com" />
                </label>

                <label className={styles.fieldLabel}>
                  Evidence URL
                  <input className={styles.fieldInput} name="sourceUrl" placeholder="https://example.com/proof" />
                </label>

                <label className={`${styles.fieldLabel} ${styles.fieldSpan2}`}>
                  Operator notes
                  <textarea className={styles.fieldTextarea} name="notes" placeholder="Observed behavior, credentials handling, or repair context." />
                </label>

                <div className={styles.actionRow}>
                  <button className={styles.primaryButton} type="submit">
                    Create source submission
                  </button>
                </div>
              </form>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>Submission Filters</h2>
                  <p className={styles.panelSubtitle}>Filter manual source intake records by text, workflow state, and resource kind.</p>
                </div>
                <Link className={styles.secondaryLink} href="/admin/manual-sources">
                  Clear filters
                </Link>
              </div>

              <form action="/admin/manual-sources" className={styles.filterForm} method="get">
                <label className={styles.fieldLabel}>
                  Search
                  <input className={styles.fieldInput} defaultValue={searchState.q} name="q" placeholder="Title, source label, provider, or notes" />
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
                  Kind
                  <select className={styles.fieldInput} defaultValue={searchState.kind} name="kind">
                    <option value="">All kinds</option>
                    <option value="stream">Stream</option>
                    <option value="download">Download</option>
                    <option value="subtitle">Subtitle</option>
                    <option value="trailer">Trailer</option>
                  </select>
                </label>

                <div className={styles.actionRow}>
                  <button className={styles.primaryButton} type="submit">
                    Apply filters
                  </button>
                </div>
              </form>
            </section>

            {!errorMessage && items.length === 0 ? <div className={styles.emptyState}>No manual source submissions matched the current filters.</div> : null}

            {!errorMessage && items.length > 0 ? (
              <section className={styles.cardList} aria-label="Manual source submissions">
                {items.map((item) => {
                  const detailHref = buildAdminManualSourceSubmissionPath({
                    q: searchState.q,
                    status: searchState.status,
                    kind: searchState.kind,
                    submission: item.publicId,
                  });

                  return (
                    <article className={styles.card} key={item.id}>
                      <div className={styles.cardHeader}>
                        <div className={styles.cardIdentity}>
                          <div className={styles.badgeRow}>
                            <span className={`${styles.badge} ${statusClassNames[item.status] ?? ""}`}>{formatAdminWorkflowLabel(item.status)}</span>
                            <span className={styles.badge}>{item.kind}</span>
                            <span className={styles.badge}>{item.provider}</span>
                          </div>
                          <div>
                            <h2 className={styles.cardTitle}>{item.label}</h2>
                            <p className={styles.cardMeta}>{item.mediaTitle ?? item.targetTitleText ?? "Free-text target"} {item.episodeTitle ? `· ${item.episodeTitle}` : item.targetEpisodeText ? `· ${item.targetEpisodeText}` : ""}</p>
                          </div>
                        </div>

                        <div className={styles.linkRow}>
                          <Link className={styles.primaryLink} href={detailHref}>
                            Inspect submission
                          </Link>
                          {item.mediaPublicId ? (
                            <Link className={styles.secondaryLink} href={`/admin/catalog/${item.mediaPublicId}`}>
                              Catalog record
                            </Link>
                          ) : null}
                        </div>
                      </div>

                      <p className={styles.cardSummary}>{item.latestActionSummary ?? item.notes ?? "No action summary stored."}</p>

                      <div className={styles.dataGrid}>
                        <div className={styles.dataTile}>
                          <span className={styles.dataLabel}>Format</span>
                          <span className={styles.dataValue}>
                            {item.format}
                            {item.quality ? ` · ${item.quality}` : ""}
                          </span>
                        </div>
                        <div className={styles.dataTile}>
                          <span className={styles.dataLabel}>Target</span>
                          <span className={styles.dataValue}>{item.mediaTitle ?? item.targetTitleText ?? "Unlinked target"}</span>
                        </div>
                        <div className={styles.dataTile}>
                          <span className={styles.dataLabel}>Linked resource</span>
                          <span className={styles.dataValue}>{item.linkedResourcePublicId ?? "Not linked"}</span>
                        </div>
                        <div className={styles.dataTile}>
                          <span className={styles.dataLabel}>Created</span>
                          <span className={styles.dataValue}>{formatDate(item.createdAt)}</span>
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
                      <h2 className={styles.detailTitle}>{detail.submission.label}</h2>
                      <p className={styles.detailLead}>
                        {detail.submission.kind} · {detail.submission.provider} · created {formatDate(detail.submission.createdAt)}
                      </p>
                    </div>

                    <div className={styles.linkRow}>
                      <span className={`${styles.badge} ${statusClassNames[detail.submission.status] ?? ""}`}>
                        {formatAdminWorkflowLabel(detail.submission.status)}
                      </span>
                      <Link
                        className={styles.secondaryLink}
                        href={buildAdminManualSourceSubmissionPath({
                          q: searchState.q,
                          status: searchState.status,
                          kind: searchState.kind,
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
                      <span className={styles.dataLabel}>Target title</span>
                      <span className={styles.dataValue}>{detail.submission.mediaTitle ?? detail.submission.targetTitleText ?? "Unlinked target"}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Episode</span>
                      <span className={styles.dataValue}>{detail.submission.episodeTitle ?? detail.submission.targetEpisodeText ?? "Title-level resource"}</span>
                    </div>
                    <div className={styles.dataTile}>
                      <span className={styles.dataLabel}>Linked repair</span>
                      <span className={styles.dataValue}>{detail.submission.linkedRepairQueueEntryId ?? "Not linked"}</span>
                    </div>
                  </div>

                  <div className={styles.selectionCard}>
                    <h3 className={styles.cardTitle}>Stored source candidate</h3>
                    <p className={styles.cardSummary}>{detail.submission.maskedUrl ?? detail.submission.url}</p>
                    <p className={styles.cardMeta}>
                      access code {detail.submission.accessCode ?? "none"} · submitter{" "}
                      {detail.submission.submittedByName ?? detail.submission.submittedByEmail ?? "unknown"}
                    </p>
                    <p className={styles.cardMeta}>{detail.submission.notes ?? "No operator notes stored."}</p>
                  </div>

                  <form action={submitManualSourceStatusAction} className={styles.statusForm}>
                    <input name="publicId" type="hidden" value={detail.submission.publicId} />
                    <input name="returnTo" type="hidden" value={returnTo} />

                    <label className={styles.fieldLabel}>
                      Operator notes
                      <textarea className={styles.fieldTextarea} name="notes" placeholder="Review state, follow-up request, or linkage note." />
                    </label>

                    <label className={styles.fieldLabel}>
                      Linked resource ID
                      <input className={styles.fieldInput} defaultValue={detail.submission.linkedResourceId ?? ""} name="linkedResourceId" placeholder="Optional source inventory resource ID" />
                    </label>

                    <label className={styles.fieldLabel}>
                      Linked repair queue entry
                      <input className={styles.fieldInput} defaultValue={detail.submission.linkedRepairQueueEntryId ?? ""} name="linkedRepairQueueEntryId" placeholder="Optional repair queue entry ID" />
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
                      Select a manual source submission from the queue to inspect its stored state and update the narrow operator workflow.
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
