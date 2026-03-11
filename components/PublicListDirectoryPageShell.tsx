import Link from "next/link";

import { Navbar } from "./Navbar";
import { PosterArtwork } from "./PosterArtwork";
import {
  getPublicListCoverPosterUrl,
  getPublicListFirstItemWatchHref,
  getPublicListVisibilityLabel,
  type PublicListDirectoryView,
} from "./publicListView";

export function PublicListDirectoryPageShell({ directory }: { directory: PublicListDirectoryView }) {
  const visibilityLabel = getPublicListVisibilityLabel();

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
          {directory.items.map((list) => {
            const firstItemWatchHref = getPublicListFirstItemWatchHref(list);

            return (
              <article key={list.publicId} className="featured-list-card public-list-directory-card">
                <Link href={list.canonicalListHref} className="featured-list-cover-link">
                  <PosterArtwork
                    className="featured-list-cover"
                    src={getPublicListCoverPosterUrl(list)}
                    alt={`${list.title} cover`}
                    title={list.shareTitle}
                    variant="list"
                  />
                </Link>

                <div className="featured-list-copy">
                  <div className="featured-list-meta">
                    <span className="featured-list-visibility">{visibilityLabel}</span>
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
                    {firstItemWatchHref ? (
                      <Link href={firstItemWatchHref} className="featured-list-secondary-action">
                        Start watching
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
