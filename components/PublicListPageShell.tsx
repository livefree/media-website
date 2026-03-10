import Link from "next/link";

import type { PublicMediaListPageRecord } from "../types/media";
import { Navbar } from "./Navbar";

function formatVisibilityLabel(visibility: PublicMediaListPageRecord["visibility"]) {
  return visibility === "public" ? "Public" : "Unlisted";
}

export function PublicListPageShell({ list }: { list: PublicMediaListPageRecord }) {
  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar activeScope="all" />

      <section className="public-list-hero">
        <div className="public-list-hero-copy">
          <div className="public-list-meta-row">
            <span className="public-list-visibility-badge">{formatVisibilityLabel(list.visibility)}</span>
            <span className="public-list-item-count">{list.itemCount} items</span>
          </div>
          <p className="section-kicker">Public list</p>
          <h1 className="section-title">{list.title}</h1>
          <p className="catalog-feed-description">{list.description}</p>
          <div className="public-list-actions">
            <Link href={list.canonicalListHref} className="featured-list-action">
              Canonical list URL
            </Link>
            {list.firstItemWatchHref ? (
              <Link href={list.firstItemWatchHref} className="featured-list-secondary-action">
                Start watching
              </Link>
            ) : null}
          </div>
        </div>

        {list.coverPosterUrl ? (
          <div className="public-list-cover-frame">
            <img src={list.coverPosterUrl} alt={`${list.title} cover`} className="featured-list-cover" loading="lazy" />
          </div>
        ) : null}
      </section>

      <section className="public-list-items-panel" aria-labelledby="public-list-items-title">
        <div className="catalog-results-header">
          <div className="catalog-results-copy">
            <p className="section-kicker">Ordered entries</p>
            <h2 id="public-list-items-title" className="section-title">
              Open any item with its canonical list-aware watch link.
            </h2>
          </div>
        </div>

        <ol className="public-list-items">
          {list.items.map((item) => (
            <li key={item.publicRef} className="public-list-item">
              <span className="public-list-item-position">{item.positionLabel}</span>
              <Link href={item.canonicalWatchHref} className="public-list-item-poster-link">
                <img src={item.posterUrl} alt={`${item.title} poster`} className="public-list-item-poster" loading="lazy" />
              </Link>
              <div className="public-list-item-copy">
                <p className="public-list-item-title">
                  <Link href={item.canonicalWatchHref}>{item.title}</Link>
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
