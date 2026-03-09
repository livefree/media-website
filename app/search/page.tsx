import { FilterBar } from "../../components/FilterBar";
import { MediaGrid } from "../../components/MediaGrid";
import { Navbar } from "../../components/Navbar";
import { Pagination } from "../../components/Pagination";
import { SearchBox } from "../../components/SearchBox";
import { buildSearchPageData } from "../../lib/search-filter";
import { buildSearchHref, getHiddenSearchFields } from "../../lib/search-params";

export default function SearchPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const pageData = buildSearchPageData(searchParams);

  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar activeScope={pageData.activeScope} />

      <section className="discovery-section" aria-labelledby="catalog-search-title">
        <SearchBox
          action="/search"
          placeholder="Search titles, genres, countries, or creators"
          queryValue={pageData.params.q}
          hiddenFields={getHiddenSearchFields(pageData.params, ["q", "page"])}
          title={pageData.searchTitle}
          summary={pageData.searchSummary}
          hotSearches={pageData.hotSearches}
          trendingItems={pageData.trendingItems}
        />
        <FilterBar
          action="/search"
          groups={pageData.filters}
          hiddenFields={getHiddenSearchFields(pageData.params, ["sort", "type", "genre", "region", "year", "page"])}
        />
      </section>

      <section className="catalog-section">
        <div className="catalog-header">
          <div>
            <p className="section-kicker">{pageData.sectionKicker}</p>
            <h1 className="section-title">{pageData.sectionTitle}</h1>
          </div>
          <p className="section-meta">{pageData.sectionMeta}</p>
        </div>

        {pageData.results.length > 0 ? (
          <>
            <MediaGrid items={pageData.results} title="Search results" />
            <Pagination
              currentPage={pageData.currentPage}
              totalPages={pageData.totalPages}
              hrefBuilder={(page) => buildSearchHref(pageData.params, { page }, "/search")}
            />
          </>
        ) : (
          <div className="empty-state">
            <p className="empty-state-kicker">No matches</p>
            <h2 className="empty-state-title">No catalog entries matched the current query and facets.</h2>
            <p className="empty-state-copy">
              Adjust the query text, switch the type, or clear genre, region, and year filters to widen the result set.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
