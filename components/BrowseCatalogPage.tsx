import { getBrowseCards, getCatalogConfig, getCategoryFeed, getHotSearches } from "../lib/media-catalog";
import type { CatalogScope } from "../types/media";
import { FilterBar } from "./FilterBar";
import { MediaGrid } from "./MediaGrid";
import { Navbar } from "./Navbar";
import { Pagination } from "./Pagination";
import { SearchBox } from "./SearchBox";

const PAGE_SIZE = 18;

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

function getFilterValues(scope: CatalogScope) {
  const config = getCatalogConfig();
  const feed = getCategoryFeed(scope, PAGE_SIZE);
  const leadGenres = feed.items.flatMap((item) => item.genres).filter(Boolean);
  const genreLabel = leadGenres.length > 0 ? leadGenres.slice(0, 2).join(" / ") : "All genres";

  return config.filterGroups.map((group) => {
    if (group.id === "sort") {
      return { label: group.label, value: group.options[0]?.label ?? "Latest updates" };
    }

    if (group.id === "type") {
      return {
        label: group.label,
        value: scope === "all" ? group.options[0]?.label ?? "All categories" : feed.title,
      };
    }

    if (group.id === "genre") {
      return {
        label: group.label,
        value: genreLabel,
      };
    }

    if (group.id === "region") {
      return {
        label: group.label,
        value: scope === "anime" ? "Japan and beyond" : "Global picks",
      };
    }

    return {
      label: group.label,
      value: group.options[0]?.label ?? "All years",
    };
  });
}

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

export function BrowseCatalogPage({ scope }: { scope: CatalogScope }) {
  const copy = scopeCopy[scope];
  const feed = getCategoryFeed(scope, PAGE_SIZE);
  const totalItems = getBrowseCards(scope).length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const filterGroups = getFilterValues(scope);
  const hiddenFields = scope === "all" ? [] : [{ name: "type", value: scope }];
  const hotSearches = getHotSearches(5);

  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar activeScope={scope} hiddenFields={hiddenFields} />

      <section className="discovery-section">
        <SearchBox
          placeholder="Search titles, genres, or moods"
          title={copy.introTitle}
          summary={copy.introSummary}
          hotSearches={hotSearches}
          hiddenFields={hiddenFields}
        />
        <FilterBar groups={filterGroups} />
      </section>

      <section className="catalog-section">
        <div className="catalog-results-header">
          <div className="catalog-results-copy">
            <p className="section-kicker">{copy.sectionKicker}</p>
            <h1 className="section-title">{getResultsHeadline(scope)}</h1>
            <p className="catalog-feed-description">{feed.description}</p>
          </div>
          <div className="catalog-results-meta">
            <p className="catalog-results-count">{totalItems} titles</p>
            <p className="catalog-feed-meta">Showing page 1 of {totalPages}</p>
          </div>
        </div>

        <MediaGrid items={feed.items} title={`${feed.title} catalog`} />
        <Pagination currentPage={1} totalPages={totalPages} />
      </section>
    </main>
  );
}
