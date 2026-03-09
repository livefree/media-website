import Link from "next/link";

import type { BrowseMediaCard, SearchSuggestion } from "../types/media";

type SearchBoxProps = {
  action?: string;
  placeholder: string;
  queryValue?: string;
  hiddenFields?: Array<{ name: string; value: string }>;
  title?: string;
  summary?: string;
  hotSearches: SearchSuggestion[];
  trendingItems?: BrowseMediaCard[];
};

function buildSearchHref(action: string, query: string, hiddenFields: Array<{ name: string; value: string }>) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  hiddenFields.forEach((field) => {
    params.set(field.name, field.value);
  });

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
}: SearchBoxProps) {
  return (
    <section className="search-panel" aria-label="Browse search shortcuts">
      <div className="search-intro">
        {title ? (
          <h2 id="catalog-search-title" className="search-intro-title">
            {title}
          </h2>
        ) : null}
        {summary ? <p className="search-intro-summary">{summary}</p> : null}
      </div>

      <div className="hot-search-strip">
        <span className="search-strip-label">Hot searches</span>
        <div className="hot-searches-inline" aria-label="Suggested searches">
          {hotSearches.map((item) => (
            <span key={item.slug} className="hot-search-inline-item">
              <Link href={buildSearchHref(action, item.title, hiddenFields)} className="hot-search-link">
                {item.title}
              </Link>
            </span>
          ))}
        </div>
      </div>

      <form className="mobile-search-surface" action={action} method="get" role="search">
        {hiddenFields.map((field) => (
          <input key={field.name} type="hidden" name={field.name} value={field.value} />
        ))}
        <label className="mobile-search-row">
          <span className="mobile-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <input
            className="mobile-search-input"
            type="text"
            name="q"
            defaultValue={queryValue}
            placeholder={placeholder}
            aria-label={placeholder}
          />
          <button type="submit" className="mobile-search-button" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </label>
        <div className="mobile-search-chips">
          {hotSearches.slice(0, 3).map((item) => (
            <Link key={item.slug} href={buildSearchHref(action, item.title, hiddenFields)} className="mobile-search-chip">
              {item.title}
            </Link>
          ))}
        </div>
      </form>
    </section>
  );
}
