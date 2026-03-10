import Link from "next/link";

import type { PublicListDirectoryRecord } from "../types/media";
import { Navbar } from "./Navbar";

export function PublicListDirectoryPageShell({ directory }: { directory: PublicListDirectoryRecord }) {
  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar activeScope="all" activeHref={directory.canonicalDirectoryHref} />

      <section className="public-list-directory-hero">
        <div className="catalog-results-header">
          <div className="catalog-results-copy">
            <p className="section-kicker">Public list directory</p>
            <h1 className="section-title">{directory.title}</h1>
            <p className="catalog-feed-description">{directory.description}</p>
          </div>
          <div className="catalog-results-meta">
            <p className="catalog-results-count">{directory.listCountLabel}</p>
            <Link href="/" className="featured-list-directory-link">
              Back to catalog
            </Link>
          </div>
        </div>

        <div className="public-list-directory-grid">
          {directory.items.map((list) => (
            <article key={list.publicId} className="featured-list-card public-list-directory-card">
              <Link href={list.canonicalListHref} className="featured-list-cover-link">
                {list.coverPosterUrl ? (
                  <img src={list.coverPosterUrl} alt={`${list.title} cover`} className="featured-list-cover" loading="lazy" />
                ) : (
                  <div className="featured-list-cover featured-list-cover-fallback" aria-hidden="true">
                    LIST
                  </div>
                )}
              </Link>

              <div className="featured-list-copy">
                <div className="featured-list-meta">
                  <span className="featured-list-visibility">{list.visibilityLabel}</span>
                  <span className="featured-list-count">{list.itemCountLabel}</span>
                </div>
                <h2 className="featured-list-title">
                  <Link href={list.canonicalListHref}>{list.shareTitle}</Link>
                </h2>
                <p className="featured-list-description">{list.shareDescription}</p>
                <div className="featured-list-actions">
                  <Link href={list.canonicalListHref} className="featured-list-action">
                    Open list
                  </Link>
                  {list.firstItemWatchHref ? (
                    <Link href={list.firstItemWatchHref} className="featured-list-secondary-action">
                      Start watching
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
