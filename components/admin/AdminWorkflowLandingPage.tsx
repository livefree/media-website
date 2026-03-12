import Link from "next/link";

import { AdminOperatorNav } from "./AdminOperatorNav";
import styles from "./admin-workflow-landing.module.css";

import type { AdminWorkflowLandingPageRecord } from "../../lib/server/admin/types";

interface AdminWorkflowLandingPageProps {
  page?: AdminWorkflowLandingPageRecord;
  flashMessage?: string;
  errorMessage?: string;
}

export function AdminWorkflowLandingPage({ page, flashMessage, errorMessage }: AdminWorkflowLandingPageProps) {
  const summary = page?.summary;

  return (
    <main className={styles.adminPage}>
      <div className={styles.adminShell}>
        <AdminOperatorNav activeSection="workflow" />

        <header className={styles.adminHeader}>
          <div>
            <p className={styles.eyebrow}>Admin Workflow</p>
            <h1 className={styles.adminTitle}>{page?.title ?? "Workflow Overview"}</h1>
            <p className={styles.adminSubtitle}>{page?.description ?? "Operator snapshot of intake, review, catalog, source, and launch guardrail state."}</p>
          </div>
          {summary ? (
            <div className={styles.headerMeta}>
              <span className={styles.metricPill}>{summary.pendingNormalized.totalCandidates} waiting intake</span>
              <span className={styles.metricPill}>{summary.reviewQueue.totalEntries} in review</span>
              <span className={styles.metricPill}>{summary.catalog.totalTitles} published titles</span>
            </div>
          ) : null}
        </header>

        {flashMessage ? <div className={styles.flashMessage}>{flashMessage}</div> : null}
        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

        {!errorMessage ? (
          summary ? (
            <section className={styles.panelGrid}>
              {renderPendingNormalizedCard(summary)}
              {renderReviewCard(summary)}
              {renderCatalogCard(summary)}
              {renderSourceHealthCard(summary)}
              {renderLaunchCard(summary)}
            </section>
          ) : (
            <div className={styles.emptyState}>Workflow summary is not available yet.</div>
          )
        ) : null}
      </div>
    </main>
  );
}

function renderPendingNormalizedCard(summary: AdminWorkflowLandingPageRecord["summary"]) {
  return (
    <article className={styles.panel} key="pending-normalized">
      <div>
        <h2 className={styles.panelTitle}>Pending normalized</h2>
        <p className={styles.panelSubtitle}>Monitor intake-ready items and warning-level candidates.</p>
      </div>
      <div className={styles.pillRow}>
        <span className={styles.microPill}>{summary.pendingNormalized.totalCandidates} waiting</span>
        <span className={styles.microPill}>{summary.pendingNormalized.warningCandidates} warning</span>
      </div>
      <div className={styles.actionRow}>
        <Link className={styles.primaryLink} href={summary.pendingNormalized.href}>
          Review intake
        </Link>
      </div>
    </article>
  );
}

function renderReviewCard(summary: AdminWorkflowLandingPageRecord["summary"]) {
  return (
    <article className={styles.panel} key="review">
      <div>
        <h2 className={styles.panelTitle}>Review queue</h2>
        <p className={styles.panelSubtitle}>Track pending decisions and publish-ready titles.</p>
      </div>
      <div className={styles.pillRow}>
        <span className={styles.microPill}>{summary.reviewQueue.totalEntries} total</span>
        <span className={styles.microPill}>{summary.reviewQueue.pendingEntries} pending</span>
      </div>
      <div className={styles.actionRow}>
        <Link className={styles.primaryLink} href={summary.reviewQueue.href}>
          Open review queue
        </Link>
      </div>
    </article>
  );
}

function renderCatalogCard(summary: AdminWorkflowLandingPageRecord["summary"]) {
  return (
    <article className={styles.panel} key="catalog">
      <div>
        <h2 className={styles.panelTitle}>Catalog attention</h2>
        <p className={styles.panelSubtitle}>High-level snapshot of published catalog health.</p>
      </div>
      <div className={styles.pillRow}>
        <span className={styles.microPill}>{summary.catalog.totalTitles} titles</span>
        <span className={styles.microPill}>{summary.catalog.titlesWithRepairs} with repair flags</span>
        <span className={styles.microPill}>{summary.catalog.episodicTitles} episodic</span>
      </div>
      <div className={styles.actionRow}>
        <Link className={styles.primaryLink} href={summary.catalog.href}>
          Inspect catalog
        </Link>
      </div>
    </article>
  );
}

function renderSourceHealthCard(summary: AdminWorkflowLandingPageRecord["summary"]) {
  return (
    <article className={styles.panel} key="source-health">
      <div>
        <h2 className={styles.panelTitle}>Source health</h2>
        <p className={styles.panelSubtitle}>Combine source inventory, repair backlog, and queue failures.</p>
      </div>
      <div className={styles.pillRow}>
        <span className={styles.microPill}>{summary.sourceHealth.unhealthySources} unhealthy sources</span>
        <span className={styles.microPill}>{summary.sourceHealth.openRepairItems} open repairs</span>
        <span className={styles.microPill}>{summary.sourceHealth.failedQueueJobs} failed jobs</span>
      </div>
      <div className={styles.actionRow}>
        <Link className={styles.primaryLink} href={summary.sourceHealth.hrefs.sources}>
          Source inventory
        </Link>
        <Link className={styles.secondaryLink} href={summary.sourceHealth.hrefs.repair}>
          Repair queue
        </Link>
        <Link className={styles.secondaryLink} href={summary.sourceHealth.hrefs.queueFailures}>
          Queue failures
        </Link>
      </div>
    </article>
  );
}

function renderLaunchCard(summary: AdminWorkflowLandingPageRecord["summary"]) {
  return (
    <article className={styles.panel} key="launch-readiness">
      <div>
        <h2 className={styles.panelTitle}>Launch readiness</h2>
        <p className={styles.panelSubtitle}>Recovery rehearsals and final launch guardrails.</p>
      </div>
      <div className={styles.pillRow}>
        <span className={styles.microPill}>Recovery: {summary.launchReadiness.recoveryState}</span>
        <span className={styles.microPill}>Launch: {summary.launchReadiness.launchState}</span>
      </div>
      <div className={styles.actionRow}>
        <Link className={styles.primaryLink} href={summary.launchReadiness.hrefs.recovery}>
          Recovery readiness
        </Link>
        <Link className={styles.secondaryLink} href={summary.launchReadiness.hrefs.launch}>
          Launch validation
        </Link>
      </div>
    </article>
  );
}
