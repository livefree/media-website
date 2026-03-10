import Link from "next/link";

import { buildPublicListDirectoryHref } from "../lib/media-utils";
import type { PublicMediaList } from "../types/media";

export function FeaturedListsSection({ lists }: { lists: PublicMediaList[] }) {
  if (lists.length === 0) {
    return null;
  }

  const directoryHref = buildPublicListDirectoryHref();

  return (
    <section className="featured-lists-section" aria-labelledby="featured-lists-title">
      <div className="catalog-results-header">
        <div className="catalog-results-copy">
          <p className="section-kicker">Public lists</p>
          <h2 id="featured-lists-title" className="section-title">
            Curated watchlists you can open and play through publicly.
          </h2>
          <p className="catalog-feed-description">
            Jump into ordered public lists built from the shared catalog, then open canonical watch links item by item.
          </p>
        </div>
        <div className="catalog-results-meta">
          <Link href={directoryHref} className="featured-list-directory-link">
            Browse all lists
          </Link>
        </div>
      </div>

      <div className="featured-lists-grid">
        {lists.map((list) => (
          <article key={list.publicId} className="featured-list-card">
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
              <h3 className="featured-list-title">
                <Link href={list.canonicalListHref}>{list.shareTitle}</Link>
              </h3>
              <p className="featured-list-description">{list.shareDescription}</p>
              <div className="featured-list-actions">
                <Link href={list.canonicalListHref} className="featured-list-action">
                  Open list
                </Link>
                {list.firstItemWatchHref ? (
                  <Link href={list.firstItemWatchHref} className="featured-list-secondary-action">
                    Play first item
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
