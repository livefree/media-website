type SearchBoxProps = {
  placeholder: string;
  hotSearches: string[];
  trendingItems: Array<{
    title: string;
    meta: string;
  }>;
};

export function SearchBox({ placeholder, hotSearches, trendingItems }: SearchBoxProps) {
  return (
    <section className="search-panel" aria-labelledby="catalog-search-title">
      <div className="search-copy">
        <p className="section-kicker">Search area</p>
        <h2 id="catalog-search-title" className="search-title">
          Browse recent additions before the search flow is wired.
        </h2>
        <p className="search-summary">
          The shell mirrors the reference layout with a dedicated search field, quick tags, and a compact
          hot-list panel.
        </p>

        <form className="search-box" role="search">
          <label className="search-field">
            <span className="search-label">Catalog search</span>
            <input type="text" placeholder={placeholder} aria-label={placeholder} />
          </label>
          <button type="button" className="search-submit">
            Search
          </button>
          <span className="search-hint">Presentation only. Query wiring belongs to the Search Filter phase.</span>
        </form>

        <div className="hot-searches" aria-label="Suggested searches">
          {hotSearches.map((item) => (
            <button key={item} type="button" className="hot-search-chip">
              {item}
            </button>
          ))}
        </div>
      </div>

      <aside className="search-trending" aria-label="Trending this week">
        <p className="search-side-label">Trending this week</p>
        <ul className="trending-list">
          {trendingItems.map((item) => (
            <li key={item.title} className="trending-item">
              <span className="trending-title">{item.title}</span>
              <span className="trending-meta">{item.meta}</span>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
