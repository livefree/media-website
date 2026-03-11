import { getCategoryFeed } from "../lib/media-catalog";
import { buildBrowsePageData } from "../lib/search-filter";
import { getHiddenSearchFields } from "../lib/search-params";
import type { CatalogScope } from "../types/media";
import { FeaturedListsSection } from "./FeaturedListsSection";
import { FilterBar } from "./FilterBar";
import { MediaGrid } from "./MediaGrid";
import { Navbar } from "./Navbar";
import { Pagination } from "./Pagination";
import { SearchBox } from "./SearchBox";

const scopeCopy: Record<
  CatalogScope,
  {
    introTitle: string;
    introSummary: string;
    sectionKicker: string;
  }
> = {
  all: {
    introTitle: "Browse recent releases, weekly trends, and freshly updated titles.",
    introSummary: "Search quickly, scan what people are watching this week, and tighten the catalog with compact filters before dropping into the grid.",
    sectionKicker: "Streaming catalog",
  },
  movie: {
    introTitle: "Browse recent film additions, weekly trends, and updated releases.",
    introSummary: "Keep the browsing chrome compact while the film filter set and denser poster grid do most of the work.",
    sectionKicker: "Movie catalog",
  },
  series: {
    introTitle: "Browse current series updates, returning favorites, and new seasons.",
    introSummary: "The layout stays tight so hot searches, facet controls, and the show grid read first.",
    sectionKicker: "Series catalog",
  },
  anime: {
    introTitle: "Browse anime releases, current weekly picks, and recent catalog updates.",
    introSummary: "Search and filter stay compact so the upper shell feels closer to the reference browsing page.",
    sectionKicker: "Anime catalog",
  },
};

function getResultsHeadline(scope: CatalogScope) {
  if (scope === "movie") {
    return "Latest movie additions ready to stream and save.";
  }

  if (scope === "series") {
    return "Latest series additions across new, ongoing, and completed shows.";
  }

  if (scope === "anime") {
    return "Latest anime additions across current favorites and fresh releases.";
  }

  return "Latest additions across movies, series, and anime.";
}

export async function BrowseCatalogPage({
  scope,
  searchParams,
}: {
  scope: CatalogScope;
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const copy = scopeCopy[scope];
  const pageData = await buildBrowsePageData(scope, searchParams);
  const feed = getCategoryFeed(scope);
  const featuredLists = pageData.featuredLists ?? [];
  const searchHiddenFields = getHiddenSearchFields(pageData.currentParams, ["q", "page", "type"]);
  const filterHiddenFields = getHiddenSearchFields(pageData.currentParams, ["sort", "type", "genre", "region", "year", "page"]);

  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar activeScope={scope} hiddenFields={searchHiddenFields} />

      <section className="discovery-section">
        <SearchBox
          action={pageData.actionPath}
          placeholder="Search titles, genres, or moods"
          queryValue={pageData.currentParams.q}
          title={copy.introTitle}
          summary={copy.introSummary}
          hotSearches={pageData.hotSearches}
          hiddenFields={searchHiddenFields}
        />
        <FilterBar
          action={pageData.currentPath}
          groups={pageData.filters}
          hiddenFields={filterHiddenFields}
          typeRoutes={{
            all: "/",
            movie: "/movie",
            series: "/series",
            anime: "/anime",
          }}
        />
      </section>

      <section className="catalog-section">
        <div className="catalog-results-header">
          <div className="catalog-results-copy">
            <p className="section-kicker">{copy.sectionKicker}</p>
            <h1 className="section-title">{getResultsHeadline(scope)}</h1>
            <p className="catalog-feed-description">{feed.description}</p>
          </div>
          <div className="catalog-results-meta">
            <p className="catalog-results-count">{pageData.totalResults} titles</p>
            <p className="catalog-feed-meta">
              Showing page {pageData.currentPage} of {pageData.totalPages}
            </p>
          </div>
        </div>

        {pageData.results.length > 0 ? (
          <>
            <MediaGrid items={pageData.results} title={`${feed.title} catalog`} />
            <Pagination currentPage={pageData.currentPage} totalPages={pageData.totalPages} hrefBuilder={pageData.buildHref} />
          </>
        ) : (
          <div className="empty-state">
            <p className="empty-state-kicker">No matches</p>
            <h2 className="empty-state-title">No titles matched the active browse query and facets.</h2>
            <p className="empty-state-copy">
              Clear one of the facet selections or widen the search text to bring more catalog entries back into view.
            </p>
          </div>
        )}
      </section>

      {featuredLists.length > 0 ? <FeaturedListsSection lists={featuredLists} /> : null}
    </main>
  );
}
