import Link from "next/link";

import { Navbar } from "./Navbar";
import { PosterArtwork } from "./PosterArtwork";
import {
  getPublicListFirstItemWatchHref,
  getPublicListItemPosterUrl,
  getPublicListItemTitle,
  getPublicListVisibilityLabel,
  type PublicListPageView,
} from "./publicListView";

export function PublicListPageShell({ list }: { list: PublicListPageView }) {
  const directoryHref = "/lists";
  const firstItemWatchHref = getPublicListFirstItemWatchHref(list);
  const visibilityLabel = getPublicListVisibilityLabel();

  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar activeScope="all" activeHref={directoryHref} />

      <section className="public-list-hero">
        <div className="public-list-hero-copy">
          <div className="public-list-meta-row">
            <span className="public-list-visibility-badge">{visibilityLabel}</span>
            <span className="public-list-item-count">{list.itemCountLabel}</span>
          </div>
          <p className="section-kicker">Public list</p>
          <h1 className="section-title">{list.shareTitle}</h1>
          <p className="catalog-feed-description">{list.shareDescription}</p>
          <div className="public-list-actions">
            <Link href={list.canonicalListHref} className="featured-list-action">
              Open public list
            </Link>
            {firstItemWatchHref ? (
              <Link href={firstItemWatchHref} className="featured-list-secondary-action">
                Start watching
              </Link>
            ) : null}
          </div>
        </div>

        <aside className="public-list-share-card">
          <p className="section-kicker">Share-ready link</p>
          <p className="public-list-share-title">{list.shareTitle}</p>
          <p className="public-list-share-copy">{list.shareDescription}</p>
          <Link href={list.shareHref} className="public-list-share-link">
            {list.shareHref}
          </Link>
          <div className="public-list-share-actions">
            <Link href={directoryHref} className="featured-list-secondary-action">
              Browse more lists
            </Link>
            {firstItemWatchHref ? (
              <Link href={firstItemWatchHref} className="featured-list-action">
                Play this queue
              </Link>
            ) : null}
          </div>
        </aside>
      </section>

      <section className="public-list-items-panel" aria-labelledby="public-list-items-title">
        <div className="catalog-results-header">
          <div className="catalog-results-copy">
            <p className="section-kicker">Ordered entries</p>
            <h2 id="public-list-items-title" className="section-title">
              Share this list directly, then open any title with its canonical list-aware watch link.
            </h2>
            <p className="catalog-feed-description">
              Every entry keeps the public list context intact, so the watch page can preserve the queue identity without falling back to slug URLs.
            </p>
          </div>
          <div className="catalog-results-meta">
            <p className="catalog-results-count">{list.itemCountLabel}</p>
            <p className="catalog-feed-meta">{visibilityLabel} share surface</p>
          </div>
        </div>

        <ol className="public-list-items">
          {list.items.map((item) => (
            <li key={item.publicRef} className="public-list-item">
              <span className="public-list-item-position">{item.positionLabel}</span>
              <Link href={item.canonicalWatchHref} className="public-list-item-poster-link">
                <PosterArtwork
                  className="public-list-item-poster"
                  src={getPublicListItemPosterUrl(item)}
                  alt={`${getPublicListItemTitle(item)} poster`}
                  title={getPublicListItemTitle(item)}
                  variant="list"
                />
              </Link>
              <div className="public-list-item-copy">
                <p className="public-list-item-title">
                  <Link href={item.canonicalWatchHref}>{getPublicListItemTitle(item)}</Link>
                </p>
                <p className="public-list-item-subtitle">{item.subtitle}</p>
              </div>
              <Link href={item.canonicalWatchHref} className="public-list-item-action">
                Watch item
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
