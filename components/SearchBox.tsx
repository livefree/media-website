import Link from "next/link";

import type { BrowseMediaCard, SearchSuggestion } from "../types/media";

type SearchBoxProps = {
  action?: string;
  placeholder: string;
  queryValue?: string;
  hiddenFields?: Array<{ name: string; value: string }>;
  title: string;
  summary: string;
  hotSearches: SearchSuggestion[];
  trendingItems: BrowseMediaCard[];
};

function getTypeLabel(type: SearchSuggestion["type"]) {
  if (type === "movie") {
    return "Movie";
  }

  if (type === "series") {
    return "Series";
  }

  return "Anime";
}

function buildSearchHref(action: string, query: string) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  const suffix = params.toString();
  return suffix ? `${action}?${suffix}` : action;
}

export function SearchBox({
  action = "/search",
  placeholder,
  queryValue = "",
  hiddenFields = [],
  title,
  summary,
  hotSearches,
  trendingItems,
}: SearchBoxProps) {
  return (
    <section className="search-panel" aria-labelledby="catalog-search-title">
      <div className="search-copy">
        <p className="section-kicker">Search area</p>
        <h2 id="catalog-search-title" className="search-title">
          {title}
        </h2>
        <p className="search-summary">{summary}</p>

        <div className="search-stack">
          <div className="search-desktop-shell">
            <form className="search-box" action={action} method="get" role="search">
              {hiddenFields.map((field) => (
                <input key={field.name} type="hidden" name={field.name} value={field.value} />
              ))}
              <label className="search-field">
                <span className="search-label">Catalog search</span>
                <input type="text" name="q" defaultValue={queryValue} placeholder={placeholder} aria-label={placeholder} />
              </label>
              <button type="submit" className="search-submit">
                Search
              </button>
              <span className="search-hint">Submitting the form preserves the current filter state and resets pagination.</span>
            </form>

            <div className="search-dropdown" aria-label="Hot searches">
              <p className="search-side-label">Hot searches</p>
              <ul className="search-dropdown-list">
                {hotSearches.map((item) => (
                  <li key={item.slug}>
                    <Link href={buildSearchHref(action, item.title)} className="search-dropdown-item">
                      <span className="search-dropdown-title">{item.title}</span>
                      <span className="search-dropdown-meta">
                        {getTypeLabel(item.type)} · {item.year}
                        {typeof item.rating === "number" ? ` · ${item.rating.toFixed(1)}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="hot-searches" aria-label="Suggested searches">
            {hotSearches.map((item) => (
              <Link key={item.slug} href={buildSearchHref(action, item.title)} className="hot-search-chip">
                {item.title}
              </Link>
            ))}
          </div>

          <div className="mobile-search-surface" aria-label="Mobile search shell">
            <div className="mobile-search-row">
              <span className="mobile-search-icon" aria-hidden="true">
                /
              </span>
              <span className="mobile-search-placeholder">{queryValue || placeholder}</span>
              <Link href={buildSearchHref(action, queryValue)} className="mobile-search-button">
                Open
              </Link>
            </div>
            <div className="mobile-search-chips">
              {hotSearches.slice(0, 3).map((item) => (
                <Link key={item.slug} href={buildSearchHref(action, item.title)} className="mobile-search-chip">
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <aside className="search-trending" aria-label="Trending this week">
        <p className="search-side-label">Trending this week</p>
        <ul className="trending-list">
          {trendingItems.map((item) => (
            <li key={item.id} className="trending-item">
              <span className="trending-title">{item.title}</span>
              <span className="trending-meta">
                {item.typeLabel} · {item.yearLabel} · {item.availabilityLabel}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
