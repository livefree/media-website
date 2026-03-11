import Link from "next/link";

import styles from "./admin-published-catalog.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";
import { buildAdminCatalogPath, formatAdminCatalogLabel } from "./admin-published-catalog.helpers";

import type { AdminPublishedCatalogPageRecord } from "../../lib/server/admin";
import type { AdminPublishedCatalogSearchState } from "./admin-published-catalog.helpers";

const summaryOrder = [
  { key: "totalItems", label: "Published titles" },
  { key: "titlesWithHealthyStreams", label: "With healthy streams" },
  { key: "titlesWithRepairs", label: "With open repairs" },
  { key: "episodicTitles", label: "Episodic titles" },
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSummary(page?: AdminPublishedCatalogPageRecord) {
  return (
    page?.summary ?? {
      totalItems: 0,
      totalPages: 1,
      titlesWithRepairs: 0,
      titlesWithHealthyStreams: 0,
      episodicTitles: 0,
    }
  );
}

export function AdminPublishedCatalogPage({
  page,
  errorMessage,
  flashMessage,
  returnTo,
  searchState,
}: {
  page?: AdminPublishedCatalogPageRecord;
  errorMessage?: string;
  flashMessage?: string;
  returnTo: string;
  searchState: AdminPublishedCatalogSearchState;
}) {
  const summary = getSummary(page);
  const items = page?.items ?? [];
  const currentPage = page?.page ?? searchState.page;
  const totalPages = page?.summary.totalPages ?? 1;
  const previousHref = currentPage > 1 ? buildAdminCatalogPath({ ...searchState, page: currentPage - 1 }) : undefined;
  const nextHref = currentPage < totalPages ? buildAdminCatalogPath({ ...searchState, page: currentPage + 1 }) : undefined;

  return (
    <main className={styles.catalogPage}>
      <div className={styles.catalogShell}>
        <AdminOperatorNav activeSection="catalog" />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{page?.title ?? "Published Catalog"}</h1>
            <p className={styles.pageSubtitle}>
              {page?.description ??
                "Inspect published catalog records, source readiness, and release state through the admin catalog boundary without direct database access."}
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
              <h2 className={styles.panelTitle}>Catalog Filters</h2>
              <p className={styles.panelSubtitle}>
                Search published titles by name, release state, type, year, or region using backend-backed admin catalog reads only.
              </p>
            </div>
            <Link className={styles.secondaryLink} href="/admin/catalog">
              Clear filters
            </Link>
          </div>

          <form action="/admin/catalog" className={styles.filterForm} method="get">
            <label className={styles.fieldLabel}>
              Search
              <input className={styles.fieldInput} defaultValue={searchState.q} name="q" placeholder="Title, original title, summary, or genre" />
            </label>

            <label className={styles.fieldLabel}>
              Type
              <select className={styles.fieldInput} defaultValue={searchState.type} name="type">
                <option value="">All types</option>
                <option value="movie">Movie</option>
                <option value="series">Series</option>
                <option value="anime">Anime</option>
                <option value="variety">Variety</option>
                <option value="documentary">Documentary</option>
                <option value="special">Special</option>
              </select>
            </label>

            <label className={styles.fieldLabel}>
              Status
              <select className={styles.fieldInput} defaultValue={searchState.status} name="status">
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label className={styles.fieldLabel}>
              Release year
              <input className={styles.fieldInput} defaultValue={searchState.year} inputMode="numeric" name="year" placeholder="2026" />
            </label>

            <label className={styles.fieldLabel}>
              Region
              <input className={styles.fieldInput} defaultValue={searchState.region} name="region" placeholder="Japan, US, KR, CN" />
            </label>

            <label className={styles.fieldLabel}>
              Sort
              <select className={styles.fieldInput} defaultValue={searchState.sort} name="sort">
                <option value="published_at">Published date</option>
                <option value="updated_at">Last updated</option>
                <option value="title">Title</option>
                <option value="release_year">Release year</option>
              </select>
            </label>

            <div className={styles.filterActions}>
              <button className={styles.primaryButton} type="submit">
                Apply filters
              </button>
            </div>
          </form>
        </section>

        {flashMessage ? <div className={styles.warningState}>{flashMessage}</div> : null}
        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

        {!errorMessage && items.length === 0 ? (
          <div className={styles.emptyState}>No published catalog records matched the current filters.</div>
        ) : null}

        {!errorMessage && items.length > 0 ? (
          <section className={styles.cardList} aria-label="Published catalog records">
            {items.map((item) => (
              <article className={styles.catalogCard} key={item.id}>
                <div className={styles.cardIdentity}>
                  {item.posterUrl ? (
                    <img alt={`${item.title} poster`} className={styles.poster} src={item.posterUrl} />
                  ) : (
                    <div className={styles.posterFallback}>No poster</div>
                  )}

                  <div className={styles.identityCopy}>
                    <div className={styles.badgeRow}>
                      <span className={styles.badge}>{formatAdminCatalogLabel(item.type)}</span>
                      <span className={styles.badge}>{formatAdminCatalogLabel(item.status)}</span>
                      <span className={styles.badge}>{item.releaseYear}</span>
                    </div>

                    <h2 className={styles.cardTitle}>{item.title}</h2>
                    {item.originalTitle && item.originalTitle !== item.title ? <p className={styles.cardMeta}>{item.originalTitle}</p> : null}

                    <p className={styles.cardMeta}>
                      {item.originCountry ?? "Region pending"} · {item.language ?? "Language pending"} · published {formatDate(item.publishedAt)}
                    </p>

                    <div className={styles.pillRow}>
                      {item.seasonCount ? <span className={styles.metricPill}>{item.seasonCount} seasons</span> : null}
                      {item.episodeCount ? <span className={styles.metricPill}>{item.episodeCount} episodes</span> : null}
                      <span className={styles.metricPill}>{item.publicId}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.cardStats}>
                  <div className={styles.statTile}>
                    <span className={styles.statLabel}>Streams</span>
                    <span className={styles.statValue}>
                      {item.healthyStreamCount}/{item.streamCount} healthy
                    </span>
                  </div>
                  <div className={styles.statTile}>
                    <span className={styles.statLabel}>Downloads</span>
                    <span className={styles.statValue}>{item.downloadCount}</span>
                  </div>
                  <div className={styles.statTile}>
                    <span className={styles.statLabel}>Subtitles</span>
                    <span className={styles.statValue}>{item.subtitleCount}</span>
                  </div>
                  <div className={styles.statTile}>
                    <span className={styles.statLabel}>Open repairs</span>
                    <span className={styles.statValue}>{item.openRepairCount}</span>
                  </div>
                </div>

                <div className={styles.panelHeader}>
                  <p className={styles.cardMeta}>Updated {formatDate(item.updatedAt)} · compatibility route {item.compatibilityHref}</p>

                  <div className={styles.linkRow}>
                    <Link className={styles.primaryLink} href={`/admin/catalog/${item.publicId}?from=${encodeURIComponent(returnTo)}`}>
                      Inspect record
                    </Link>
                    <Link className={styles.secondaryLink} href={item.canonicalWatchHref}>
                      Watch route
                    </Link>
                    <Link className={styles.secondaryLink} href={`/admin/repair?q=${encodeURIComponent(item.title)}`}>
                      Repair queue
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {page && !errorMessage ? (
          <section className={styles.paginationPanel}>
            <p className={styles.pageMeta}>
              Page {page.page} of {page.summary.totalPages} · {page.summary.totalItems} published titles
            </p>

            <div className={styles.linkRow}>
              {previousHref ? (
                <Link className={styles.secondaryLink} href={previousHref}>
                  Previous page
                </Link>
              ) : null}
              {nextHref ? (
                <Link className={styles.secondaryLink} href={nextHref}>
                  Next page
                </Link>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
