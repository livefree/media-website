import Link from "next/link";

import styles from "./admin-review.module.css";
import {
  clearScheduledPublicationAction,
  publishDecisionAction,
  schedulePublicationAction,
  startReviewAction,
  submitDecisionAction,
} from "../../app/admin/review/actions";
import { AdminOperatorNav } from "./AdminOperatorNav";

import type { ReviewQueueDetailRecord } from "../../lib/db/repositories/review";

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
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function renderReasonList(reasons: { code: string; detail: string; weight: number }[]) {
  if (reasons.length === 0) {
    return <p className={styles.timelineMeta}>No ranking reasons stored.</p>;
  }

  return (
    <div className={styles.gridList}>
      {reasons.map((reason) => (
        <div className={styles.infoTile} key={`${reason.code}-${reason.detail}`}>
          <p className={styles.infoLabel}>
            {reason.code} · weight {reason.weight.toFixed(2)}
          </p>
          <p className={styles.infoValue}>{reason.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function AdminReviewDetailPage({
  detail,
  queueEntryId,
  errorMessage,
  flashMessage,
}: {
  detail?: ReviewQueueDetailRecord;
  queueEntryId?: string;
  errorMessage?: string;
  flashMessage?: string;
}) {
  if (!detail) {
    return (
      <main className={styles.adminPage}>
        <div className={styles.adminShell}>
          <AdminOperatorNav activeSection="review" />

          <header className={styles.adminHeader}>
            <div>
              <p className={styles.eyebrow}>Admin Workflow</p>
              <h1 className={styles.adminTitle}>Review Detail</h1>
              <p className={styles.adminSubtitle}>Inspect one queue entry, record a review decision, and publish through explicit service boundaries.</p>
            </div>
            <div className={styles.headerMeta}>
              <Link className={styles.queueActionLink} href="/admin/review">
                Back to queue
              </Link>
            </div>
          </header>

          {flashMessage ? <div className={styles.flashMessage}>{flashMessage}</div> : null}
          <div className={styles.warningState}>{errorMessage ?? `Review queue entry '${queueEntryId ?? "unknown"}' is unavailable.`}</div>
        </div>
      </main>
    );
  }

  const { queueEntry, candidate, aliases, matchSuggestions, duplicateSignals, decisions, publishOperations, audits } = detail;

  return (
    <main className={styles.adminPage}>
      <div className={styles.adminShell}>
        <AdminOperatorNav activeSection="review" />

        <header className={styles.adminHeader}>
          <div>
            <p className={styles.eyebrow}>Admin Workflow</p>
            <h1 className={styles.adminTitle}>{candidate.title.display}</h1>
            <p className={styles.adminSubtitle}>
              Review queue entry {queueEntry.id} · normalized candidate {candidate.id}. Canonical writes are allowed only
              through the publish service boundary.
            </p>
          </div>
          <div className={styles.headerMeta}>
            <span className={`${styles.statusBadge} ${statusClassNames[queueEntry.status] ?? ""}`}>{formatStatus(queueEntry.status)}</span>
            <Link className={styles.queueActionLink} href="/admin/review">
              Back to queue
            </Link>
          </div>
        </header>

        {flashMessage ? <div className={styles.flashMessage}>{flashMessage}</div> : null}

        <div className={styles.detailLayout}>
          <section className={`${styles.panel} ${styles.detailBlock}`}>
            <div className={styles.detailHeadingRow}>
              <div>
                <h2 className={styles.panelTitle}>Candidate Snapshot</h2>
                <p className={styles.panelSubtitle}>
                  Pre-review normalized state, match suggestions, and duplicate signals linked back to staging.
                </p>
              </div>
              <span className={`${styles.statusBadge} ${statusClassNames[queueEntry.status] ?? ""}`}>{formatStatus(queueEntry.status)}</span>
            </div>

            <div className={styles.detailMetaList}>
              <span className={styles.microPill}>{candidate.mediaType}</span>
              <span className={styles.microPill}>year {candidate.releaseYear ?? "unknown"}</span>
              <span className={styles.microPill}>region {candidate.region ?? "unmapped"}</span>
              <span className={styles.microPill}>language {candidate.language ?? "unmapped"}</span>
              <span className={styles.microPill}>queued {formatDate(queueEntry.queuedAt)}</span>
            </div>

            <div className={styles.detailCardGrid}>
              <div className={styles.infoTile}>
                <p className={styles.infoLabel}>Summary</p>
                <p className={styles.infoValue}>{candidate.summary ?? "No normalized summary was stored."}</p>
              </div>
              <div className={styles.infoTile}>
                <p className={styles.infoLabel}>Warnings</p>
                <p className={styles.infoValue}>{candidate.warnings.length > 0 ? candidate.warnings.join(" · ") : "No warnings."}</p>
              </div>
              <div className={styles.infoTile}>
                <p className={styles.infoLabel}>Normalization notes</p>
                <p className={styles.infoValue}>
                  {candidate.normalizationNotes.length > 0 ? candidate.normalizationNotes.join(" · ") : "No notes."}
                </p>
              </div>
              <div className={styles.infoTile}>
                <p className={styles.infoLabel}>Episode hints</p>
                <p className={styles.infoValue}>
                  {candidate.seasonEpisodeHints
                    ? `episodic ${candidate.seasonEpisodeHints.isEpisodic ? "yes" : "no"} · seasons ${candidate.seasonEpisodeHints.seasonNumbers.join(", ") || "none"} · episodes ${candidate.seasonEpisodeHints.episodeNumbers.join(", ") || "none"}`
                    : "No season/episode hints stored."}
                </p>
              </div>
            </div>

            <div className={styles.gridList}>
              <div className={styles.infoTile}>
                <p className={styles.infoLabel}>Aliases</p>
                <div className={styles.pillRow}>
                  {aliases.length > 0 ? aliases.map((alias) => <span className={styles.microPill} key={alias.id}>{alias.displayValue}</span>) : <span className={styles.microPill}>No aliases</span>}
                </div>
              </div>

              <div className={styles.infoTile}>
                <p className={styles.infoLabel}>Match suggestions</p>
                {matchSuggestions.length > 0 ? (
                  <div className={styles.gridList}>
                    {matchSuggestions.map((suggestion) => (
                      <div className={styles.timelineCard} key={suggestion.id}>
                        <h3 className={styles.timelineHeading}>
                          {suggestion.kind} · confidence {suggestion.confidence.toFixed(2)}
                        </h3>
                        <p className={styles.timelineMeta}>
                          target source {suggestion.targetSource} · canonical {suggestion.targetCanonicalMediaId ?? "none"} · candidate{" "}
                          {suggestion.targetNormalizedCandidateId ?? "none"}
                        </p>
                        {renderReasonList(suggestion.reasons)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.infoValue}>No match suggestions stored.</p>
                )}
              </div>

              <div className={styles.infoTile}>
                <p className={styles.infoLabel}>Duplicate signals</p>
                {duplicateSignals.length > 0 ? (
                  <div className={styles.gridList}>
                    {duplicateSignals.map((signal) => (
                      <div className={styles.timelineCard} key={signal.id}>
                        <h3 className={styles.timelineHeading}>
                          {signal.kind} · {signal.status} · {signal.confidence.toFixed(2)}
                        </h3>
                        <p className={styles.timelineMeta}>
                          target source {signal.targetSource} · canonical {signal.targetCanonicalMediaId ?? "none"} · candidate{" "}
                          {signal.targetNormalizedCandidateId ?? "none"}
                        </p>
                        {renderReasonList(signal.reasons)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.infoValue}>No duplicate signals stored.</p>
                )}
              </div>
            </div>
          </section>

          <aside className={styles.detailBlock}>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Review Actions</h2>
              <p className={styles.panelSubtitle}>All actions below delegate to server-side review and publish services.</p>

              {queueEntry.status === "pending" ? (
                <form action={startReviewAction} className={styles.form}>
                  <input name="queueEntryId" type="hidden" value={queueEntry.id} />
                  <button className={styles.primaryButton} type="submit">
                    Start review
                  </button>
                </form>
              ) : null}

              <form action={submitDecisionAction} className={styles.form}>
                <input name="queueEntryId" type="hidden" value={queueEntry.id} />

                <label className={styles.formLabel}>
                  Notes
                  <textarea className={styles.formTextarea} name="notes" placeholder="Operator rationale, merge reasoning, or rejection context." />
                </label>

                <label className={styles.formLabel}>
                  Canonical target media ID
                  <input className={styles.formField} name="targetCanonicalMediaId" placeholder="Required for merge, replace, and unpublish." />
                </label>

                <div className={styles.buttonRow}>
                  <button className={styles.primaryButton} name="decisionType" type="submit" value="approve">
                    Approve
                  </button>
                  <button className={styles.secondaryButton} name="decisionType" type="submit" value="merge">
                    Merge
                  </button>
                  <button className={styles.secondaryButton} name="decisionType" type="submit" value="replace">
                    Replace
                  </button>
                  <button className={styles.secondaryButton} name="decisionType" type="submit" value="unpublish">
                    Unpublish
                  </button>
                  <button className={styles.dangerButton} name="decisionType" type="submit" value="reject">
                    Reject
                  </button>
                </div>
              </form>

              {(queueEntry.status === "approved_for_publish" || queueEntry.status === "published") ? (
                <section className={styles.scheduleSection}>
                  <div className={styles.scheduleHeader}>
                    <div>
                      <h3 className={styles.timelineHeading}>Publish scheduling</h3>
                      <p className={styles.timelineMeta}>
                        Schedule a future publish window or clear it without leaving the review boundary.
                      </p>
                    </div>
                    <span className={styles.microPill}>
                      {queueEntry.scheduledPublishAt ? `Scheduled ${formatDate(queueEntry.scheduledPublishAt)}` : "No schedule"}
                    </span>
                  </div>

                  <form action={schedulePublicationAction} className={styles.form}>
                    <input name="queueEntryId" type="hidden" value={queueEntry.id} />

                    <label className={styles.formLabel}>
                      Publish at
                      <input
                        className={styles.formField}
                        defaultValue={queueEntry.scheduledPublishAt ? queueEntry.scheduledPublishAt.toISOString().slice(0, 16) : ""}
                        name="publishAt"
                        type="datetime-local"
                      />
                    </label>

                    <label className={styles.formLabel}>
                      Scheduling notes
                      <input className={styles.formField} name="notes" placeholder="Delay public visibility until the release window opens." />
                    </label>

                    <div className={styles.buttonRow}>
                      <button className={styles.primaryButton} type="submit">
                        {queueEntry.scheduledPublishAt ? "Reschedule publication" : "Schedule publication"}
                      </button>
                    </div>
                  </form>

                  {queueEntry.scheduledPublishAt ? (
                    <form action={clearScheduledPublicationAction} className={styles.inlineActionRow}>
                      <input name="queueEntryId" type="hidden" value={queueEntry.id} />
                      <input name="notes" type="hidden" value="Cleared scheduled publication from the review surface." />
                      <button className={styles.secondaryButton} type="submit">
                        Clear scheduled publish
                      </button>
                    </form>
                  ) : null}
                </section>
              ) : null}
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Recorded Decisions</h2>
              <div className={styles.gridList}>
                {decisions.length > 0 ? (
                  decisions.map((decision) => (
                    <div className={styles.timelineCard} key={decision.id}>
                      <h3 className={styles.timelineHeading}>{decision.decisionType}</h3>
                      <p className={styles.timelineMeta}>
                        actor {decision.actorId ?? "system"} · {formatDate(decision.createdAt)}
                      </p>
                      <p className={styles.timelineMeta}>
                        target canonical {decision.targetCanonicalMediaId ?? "none"} · notes {decision.notes ?? "none"}
                      </p>

                      {decision.decisionType !== "reject" ? (
                        <form action={publishDecisionAction} className={styles.form}>
                          <input name="queueEntryId" type="hidden" value={queueEntry.id} />
                          <input name="reviewDecisionId" type="hidden" value={decision.id} />
                          <button className={styles.primaryButton} type="submit">
                            Publish this decision
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No review decisions have been recorded yet.</div>
                )}
              </div>
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Publish Operations</h2>
              <div className={styles.gridList}>
                {publishOperations.length > 0 ? (
                  publishOperations.map((operation) => (
                    <div className={styles.timelineCard} key={operation.id}>
                      <h3 className={styles.timelineHeading}>
                        {operation.operationType} · {operation.status}
                      </h3>
                      <p className={styles.timelineMeta}>
                        target {operation.targetCanonicalMediaId ?? "none"} · result {operation.resultingCanonicalMediaId ?? "none"}
                      </p>
                      <p className={styles.timelineMeta}>
                        started {formatDate(operation.startedAt)} · completed {formatDate(operation.completedAt)}
                      </p>
                      <p className={styles.timelineMeta}>{operation.operationSummary ?? operation.failureSummary ?? "No summary."}</p>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No publish operations have been recorded yet.</div>
                )}
              </div>
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Audit Trail</h2>
              <div className={styles.gridList}>
                {audits.length > 0 ? (
                  audits.map((audit) => (
                    <div className={styles.timelineCard} key={audit.id}>
                      <h3 className={styles.timelineHeading}>{audit.action}</h3>
                      <p className={styles.timelineMeta}>
                        actor {audit.actorId ?? "system"} · {formatDate(audit.createdAt)}
                      </p>
                      <p className={styles.timelineMeta}>{audit.actionSummary}</p>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No audit records are available yet.</div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
