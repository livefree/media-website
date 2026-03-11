import Link from "next/link";

import {
  submitPublishedCatalogUnpublishAction,
  submitPublishedSourceReorderAction,
  submitPublishedSourceReplaceAction,
} from "../../app/admin/catalog/actions";
import styles from "./admin-published-catalog.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";
import {
  buildPublishedSourceReplacementOptions,
  formatAdminCatalogLabel,
} from "./admin-published-catalog.helpers";

import type { AdminPublishedCatalogDetailRecord, AdminPublishedResourceRecord } from "../../lib/server/admin";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getResourceLocation(resource: AdminPublishedResourceRecord) {
  if (resource.maskedUrl) {
    return resource.maskedUrl;
  }

  try {
    const parsed = new URL(resource.url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return resource.url;
  }
}

function renderResourceSection(title: string, resources: AdminPublishedResourceRecord[], emptyMessage: string) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>{title}</h2>
          <p className={styles.panelSubtitle}>Published resource records visible through the catalog admin boundary.</p>
        </div>
        <span className={styles.metricPill}>{resources.length} resources</span>
      </div>

      {resources.length === 0 ? (
        <div className={styles.emptyState}>{emptyMessage}</div>
      ) : (
        <div className={styles.resourceList}>
          {resources.map((resource) => (
            <article className={styles.resourceCard} key={resource.id}>
              <div className={styles.resourceHeader}>
                <div>
                  <h3 className={styles.cardTitle}>{resource.label}</h3>
                  <p className={styles.cardMeta}>
                    {resource.providerDisplayName ?? resource.provider} · {resource.format}
                    {resource.quality ? ` · ${resource.quality}` : ""}
                  </p>
                </div>

                <div className={styles.badgeRow}>
                  <span className={styles.badge}>{resource.status}</span>
                  <span className={styles.badge}>{resource.healthState}</span>
                  <span className={styles.badge}>{resource.isPreferred ? "preferred" : "alternate"}</span>
                </div>
              </div>

              <div className={styles.detailGrid}>
                <div className={styles.detailTile}>
                  <span className={styles.detailLabel}>Location</span>
                  <span className={styles.detailValue}>{getResourceLocation(resource)}</span>
                </div>
                <div className={styles.detailTile}>
                  <span className={styles.detailLabel}>Priority</span>
                  <span className={styles.detailValue}>
                    {resource.priority} · mirror {resource.mirrorOrder}
                  </span>
                </div>
                <div className={styles.detailTile}>
                  <span className={styles.detailLabel}>Episode</span>
                  <span className={styles.detailValue}>{resource.episodePublicId ?? "Title-level resource"}</span>
                </div>
                <div className={styles.detailTile}>
                  <span className={styles.detailLabel}>Repair coverage</span>
                  <span className={styles.detailValue}>{resource.openRepairCount} open repair entries</span>
                </div>
              </div>

              <div className={styles.linkRow}>
                <Link className={styles.secondaryLink} href={resource.canonicalWatchHref}>
                  Open watch route
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function renderStreamResourceSection(
  mediaPublicId: string,
  backHref: string,
  resources: AdminPublishedResourceRecord[],
  emptyMessage: string,
) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Stream Resources</h2>
          <p className={styles.panelSubtitle}>Published stream lines plus the narrow reorder and replacement controls backed by lifecycle mutations.</p>
        </div>
        <span className={styles.metricPill}>{resources.length} resources</span>
      </div>

      {resources.length === 0 ? (
        <div className={styles.emptyState}>{emptyMessage}</div>
      ) : (
        <div className={styles.resourceList}>
          {resources.map((resource) => {
            const replacementOptions = buildPublishedSourceReplacementOptions(resources, resource.publicId);

            return (
              <article className={styles.resourceCard} key={resource.id}>
                <div className={styles.resourceHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>{resource.label}</h3>
                    <p className={styles.cardMeta}>
                      {resource.providerDisplayName ?? resource.provider} · {resource.format}
                      {resource.quality ? ` · ${resource.quality}` : ""}
                    </p>
                  </div>

                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>{resource.status}</span>
                    <span className={styles.badge}>{resource.healthState}</span>
                    <span className={styles.badge}>{resource.isPreferred ? "preferred" : "alternate"}</span>
                  </div>
                </div>

                <div className={styles.detailGrid}>
                  <div className={styles.detailTile}>
                    <span className={styles.detailLabel}>Location</span>
                    <span className={styles.detailValue}>{getResourceLocation(resource)}</span>
                  </div>
                  <div className={styles.detailTile}>
                    <span className={styles.detailLabel}>Priority</span>
                    <span className={styles.detailValue}>
                      {resource.priority} · mirror {resource.mirrorOrder}
                    </span>
                  </div>
                  <div className={styles.detailTile}>
                    <span className={styles.detailLabel}>Episode</span>
                    <span className={styles.detailValue}>{resource.episodePublicId ?? "Title-level resource"}</span>
                  </div>
                  <div className={styles.detailTile}>
                    <span className={styles.detailLabel}>Repair coverage</span>
                    <span className={styles.detailValue}>{resource.openRepairCount} open repair entries</span>
                  </div>
                </div>

                <div className={styles.mutationGrid}>
                  <form action={submitPublishedSourceReorderAction} className={styles.mutationForm}>
                    <input name="mediaPublicId" type="hidden" value={mediaPublicId} />
                    <input name="resourceId" type="hidden" value={resource.id} />
                    <input name="returnTo" type="hidden" value={backHref} />

                    <div className={styles.mutationHeadingRow}>
                      <div>
                        <h4 className={styles.mutationTitle}>Reorder source</h4>
                        <p className={styles.cardMeta}>Adjust priority, mirror order, and preference through the published-source ordering boundary.</p>
                      </div>
                    </div>

                    <div className={styles.mutationFieldGrid}>
                      <label className={styles.fieldLabel}>
                        Priority
                        <input className={styles.fieldInput} defaultValue={resource.priority} name="priority" type="number" />
                      </label>
                      <label className={styles.fieldLabel}>
                        Mirror
                        <input className={styles.fieldInput} defaultValue={resource.mirrorOrder} name="mirrorOrder" type="number" />
                      </label>
                    </div>

                    <label className={styles.toggleLabel}>
                      <input defaultChecked={resource.isPreferred} name="isPreferred" type="checkbox" value="1" />
                      Preferred source
                    </label>

                    <label className={styles.fieldLabel}>
                      Notes
                      <input className={styles.fieldInput} name="notes" placeholder="Promote backup line ahead of the current default." />
                    </label>

                    <div className={styles.linkRow}>
                      <button className={styles.primaryButton} type="submit">
                        Save ordering
                      </button>
                    </div>
                  </form>

                  <form action={submitPublishedSourceReplaceAction} className={styles.mutationForm}>
                    <input name="mediaPublicId" type="hidden" value={mediaPublicId} />
                    <input name="sourcePublicId" type="hidden" value={resource.publicId} />
                    <input name="returnTo" type="hidden" value={backHref} />

                    <div className={styles.mutationHeadingRow}>
                      <div>
                        <h4 className={styles.mutationTitle}>Replace source</h4>
                        <p className={styles.cardMeta}>Mark this published line as replaced by another published stream resource.</p>
                      </div>
                    </div>

                    <label className={styles.fieldLabel}>
                      Replacement target
                      <select className={styles.fieldInput} defaultValue={resource.replacementPublicId ?? ""} name="replacementPublicId">
                        <option value="" disabled>
                          Select replacement line
                        </option>
                        {replacementOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={styles.fieldLabel}>
                      Notes
                      <input className={styles.fieldInput} name="notes" placeholder="Switch to the validated backup line." />
                    </label>

                    <div className={styles.linkRow}>
                      <button className={styles.secondaryLink} disabled={replacementOptions.length === 0} type="submit">
                        Replace source
                      </button>
                    </div>
                  </form>
                </div>

                <div className={styles.linkRow}>
                  <Link className={styles.secondaryLink} href={resource.canonicalWatchHref}>
                    Open watch route
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function AdminPublishedCatalogDetailPage({
  backHref,
  detail,
  errorMessage,
  flashMessage,
  publicId,
}: {
  backHref: string;
  detail?: AdminPublishedCatalogDetailRecord;
  errorMessage?: string;
  flashMessage?: string;
  publicId?: string;
}) {
  if (!detail) {
    return (
      <main className={styles.catalogPage}>
        <div className={styles.catalogShell}>
          <AdminOperatorNav activeSection="catalog" />

          <header className={styles.heroCard}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Operator Console</p>
              <h1 className={styles.pageTitle}>Published Record</h1>
              <p className={styles.pageSubtitle}>Inspect one published catalog record, its release state, and published-source readiness.</p>
            </div>
            <div className={styles.linkRow}>
              <Link className={styles.secondaryLink} href={backHref}>
                Back to catalog
              </Link>
            </div>
          </header>

          {flashMessage ? <div className={styles.warningState}>{flashMessage}</div> : null}
          <div className={styles.warningState}>{errorMessage ?? `Published catalog record '${publicId ?? "unknown"}' is unavailable.`}</div>
        </div>
      </main>
    );
  }

  const { media, sourceSummary, reviewContext, episodeDiagnostics, recentAudits, seasons } = detail;

  return (
    <main className={styles.catalogPage}>
      <div className={styles.catalogShell}>
        <AdminOperatorNav activeSection="catalog" />

        <header className={styles.heroCard}>
          <div className={styles.heroSplit}>
            <div className={styles.heroIdentity}>
              {media.posterUrl ? (
                <img alt={`${media.title} poster`} className={styles.detailPoster} src={media.posterUrl} />
              ) : (
                <div className={styles.detailPosterFallback}>No poster</div>
              )}

              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Published Catalog Record</p>
                <h1 className={styles.pageTitle}>{media.title}</h1>
                <p className={styles.pageSubtitle}>{media.summary}</p>

                <div className={styles.badgeRow}>
                  <span className={styles.badge}>{formatAdminCatalogLabel(media.type)}</span>
                  <span className={styles.badge}>{formatAdminCatalogLabel(media.status)}</span>
                  <span className={styles.badge}>{media.publicId}</span>
                </div>

                <div className={styles.linkRow}>
                  <Link className={styles.secondaryLink} href={backHref}>
                    Back to catalog
                  </Link>
                  <Link className={styles.primaryLink} href={media.canonicalWatchHref}>
                    Open watch route
                  </Link>
                  <Link className={styles.secondaryLink} href={`/admin/repair?q=${encodeURIComponent(media.title)}`}>
                    Open repair queue
                  </Link>
                </div>
              </div>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{sourceSummary.streamCount}</span>
                <span className={styles.metricLabel}>Streams</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{sourceSummary.healthyStreamCount}</span>
                <span className={styles.metricLabel}>Healthy streams</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{sourceSummary.openRepairCount}</span>
                <span className={styles.metricLabel}>Open repairs</span>
              </div>
              <div className={styles.metricCard}>
                <span className={styles.metricValue}>{episodeDiagnostics.length}</span>
                <span className={styles.metricLabel}>Episode diagnostics</span>
              </div>
            </div>
          </div>
        </header>

        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}
        {flashMessage ? <div className={styles.warningState}>{flashMessage}</div> : null}

        <div className={styles.detailLayout}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Catalog Identity</h2>
                <p className={styles.panelSubtitle}>Published metadata currently driving public browse, detail, and watch routes.</p>
              </div>
              <span className={styles.metricPill}>Updated {formatDate(media.updatedAt)}</span>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailTile}>
                <span className={styles.detailLabel}>Original title</span>
                <span className={styles.detailValue}>{media.originalTitle ?? "Matches primary title"}</span>
              </div>
              <div className={styles.detailTile}>
                <span className={styles.detailLabel}>Release window</span>
                <span className={styles.detailValue}>
                  {media.releaseYear}
                  {media.endYear ? ` to ${media.endYear}` : ""}
                </span>
              </div>
              <div className={styles.detailTile}>
                <span className={styles.detailLabel}>Locale</span>
                <span className={styles.detailValue}>
                  {media.originCountry ?? "Region pending"} · {media.language ?? "Language pending"}
                </span>
              </div>
              <div className={styles.detailTile}>
                <span className={styles.detailLabel}>Runtime</span>
                <span className={styles.detailValue}>
                  {media.runtimeMinutes ? `${media.runtimeMinutes} min` : "Title runtime pending"}
                  {media.episodeRuntimeMinutes ? ` · episode ${media.episodeRuntimeMinutes} min` : ""}
                </span>
              </div>
              <div className={styles.detailTile}>
                <span className={styles.detailLabel}>Structure</span>
                <span className={styles.detailValue}>
                  {media.seasonCount ?? 0} seasons · {media.episodeCount ?? 0} episodes
                </span>
              </div>
              <div className={styles.detailTile}>
                <span className={styles.detailLabel}>Public routes</span>
                <span className={styles.detailValue}>
                  {media.canonicalWatchHref} · {media.compatibilityHref}
                </span>
              </div>
              <div className={styles.detailTile}>
                <span className={styles.detailLabel}>Published</span>
                <span className={styles.detailValue}>{formatDate(media.publishedAt)}</span>
              </div>
              <div className={styles.detailTile}>
                <span className={styles.detailLabel}>Tagline</span>
                <span className={styles.detailValue}>{media.tagline ?? "No published tagline."}</span>
              </div>
            </div>

            {media.description ? <p className={styles.longformCopy}>{media.description}</p> : null}
          </section>

          <aside className={styles.sidebar}>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Source Summary</h2>
              <div className={styles.detailGrid}>
                <div className={styles.detailTile}>
                  <span className={styles.detailLabel}>Total resources</span>
                  <span className={styles.detailValue}>{sourceSummary.totalResources}</span>
                </div>
                <div className={styles.detailTile}>
                  <span className={styles.detailLabel}>Degraded streams</span>
                  <span className={styles.detailValue}>{sourceSummary.degradedStreamCount}</span>
                </div>
                <div className={styles.detailTile}>
                  <span className={styles.detailLabel}>Broken or offline</span>
                  <span className={styles.detailValue}>{sourceSummary.brokenOrOfflineCount}</span>
                </div>
                <div className={styles.detailTile}>
                  <span className={styles.detailLabel}>Downloads and subtitles</span>
                  <span className={styles.detailValue}>
                    {sourceSummary.downloadCount} downloads · {sourceSummary.subtitleCount} subtitles
                  </span>
                </div>
              </div>
            </section>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Lifecycle Mutations</h2>
                  <p className={styles.panelSubtitle}>Narrow catalog withdrawal control backed by the published catalog admin boundary.</p>
                </div>
              </div>

              <form action={submitPublishedCatalogUnpublishAction} className={styles.mutationForm}>
                <input name="mediaPublicId" type="hidden" value={media.publicId} />
                <input name="returnTo" type="hidden" value={backHref} />

                <label className={styles.fieldLabel}>
                  Withdrawal notes
                  <input className={styles.fieldInput} name="notes" placeholder="Withdraw until source integrity review completes." />
                </label>

                <div className={styles.linkRow}>
                  <button className={styles.dangerButton} type="submit">
                    Unpublish record
                  </button>
                </div>
              </form>
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Review Context</h2>
              {reviewContext ? (
                <div className={styles.timelineList}>
                  <div className={styles.timelineItem}>
                    <span className={styles.detailLabel}>Queue entry</span>
                    <span className={styles.detailValue}>{reviewContext.queueEntryId}</span>
                  </div>
                  <div className={styles.timelineItem}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={styles.detailValue}>{formatAdminCatalogLabel(reviewContext.status)}</span>
                  </div>
                  <div className={styles.timelineItem}>
                    <span className={styles.detailLabel}>Latest decision</span>
                    <span className={styles.detailValue}>{reviewContext.latestDecisionType ?? "No decision recorded"}</span>
                  </div>
                  <div className={styles.timelineItem}>
                    <span className={styles.detailLabel}>Decision summary</span>
                    <span className={styles.detailValue}>{reviewContext.latestDecisionSummary ?? "No summary recorded"}</span>
                  </div>
                  <Link className={styles.secondaryLink} href={`/admin/review/${reviewContext.queueEntryId}`}>
                    Open review context
                  </Link>
                </div>
              ) : (
                <div className={styles.emptyState}>No linked review context is stored for this published record.</div>
              )}
            </section>
          </aside>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Season Structure</h2>
              <p className={styles.panelSubtitle}>Published season and episode structure currently exposed for public detail and watch flows.</p>
            </div>
            <span className={styles.metricPill}>{seasons.length} seasons</span>
          </div>

          {seasons.length === 0 ? (
            <div className={styles.emptyState}>No published season structure is stored for this title.</div>
          ) : (
            <div className={styles.structureList}>
              {seasons.map((season) => (
                <article className={styles.structureCard} key={season.id}>
                  <h3 className={styles.cardTitle}>Season {season.seasonNumber}</h3>
                  <p className={styles.cardMeta}>
                    {season.title ?? "Untitled season"} · {season.episodeCount ?? season.episodes.length} episodes
                    {season.releaseYear ? ` · ${season.releaseYear}` : ""}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Episode Diagnostics</h2>
              <p className={styles.panelSubtitle}>Per-episode published stream coverage and repair pressure.</p>
            </div>
            <span className={styles.metricPill}>{episodeDiagnostics.length} diagnostics</span>
          </div>

          {episodeDiagnostics.length === 0 ? (
            <div className={styles.emptyState}>No episode diagnostics were recorded for this title.</div>
          ) : (
            <div className={styles.structureList}>
              {episodeDiagnostics.map((episode) => (
                <article className={styles.structureCard} key={episode.episodePublicId}>
                  <h3 className={styles.cardTitle}>
                    S{episode.seasonNumber ?? 0} · E{episode.episodeNumber ?? 0} · {episode.title}
                  </h3>
                  <p className={styles.cardMeta}>
                    {episode.healthyStreamCount}/{episode.streamCount} healthy streams · {episode.openRepairCount} open repairs
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {renderStreamResourceSection(media.publicId, backHref, detail.streamResources, "No published stream resources are available for this record.")}
        {renderResourceSection("Download Resources", detail.downloadResources, "No published download resources are available for this record.")}
        {renderResourceSection("Subtitle Resources", detail.subtitleResources, "No published subtitle resources are available for this record.")}

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Recent Audit Trail</h2>
              <p className={styles.panelSubtitle}>Recent publish and catalog actions recorded against this canonical media entry.</p>
            </div>
            <span className={styles.metricPill}>{recentAudits.length} entries</span>
          </div>

          {recentAudits.length === 0 ? (
            <div className={styles.emptyState}>No publish audit records are available for this title.</div>
          ) : (
            <div className={styles.timelineList}>
              {recentAudits.map((audit) => (
                <article className={styles.timelineItem} key={`${audit.action}-${audit.createdAt}`}>
                  <h3 className={styles.cardTitle}>{formatAdminCatalogLabel(audit.action)}</h3>
                  <p className={styles.cardMeta}>
                    {audit.actorId ?? "system"} · {formatDate(audit.createdAt)}
                  </p>
                  <p className={styles.longformCopy}>{audit.actionSummary}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
