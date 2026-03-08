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
    introTitle: "Browse the full catalog with a tighter, poster-first shell.",
    introSummary: "Search quickly, scan what is trending, and narrow the feed with compact filters before dropping into the grid.",
    sectionKicker: "Homepage catalog",
  },
  movie: {
    introTitle: "Movie browsing keeps the same compact top chrome.",
    introSummary: "Desktop search, hot picks, and the shared filter rail stay fixed while the feed narrows to films.",
    sectionKicker: "Movie catalog",
  },
  series: {
    introTitle: "Series browsing stays compact and scan-friendly.",
    introSummary: "Use the same calm search-and-filter stack to move through ongoing and finished shows.",
    sectionKicker: "Series catalog",
  },
  anime: {
    introTitle: "Anime browsing follows the same dense shared shell.",
    introSummary: "The top layout stays minimal so the filter row and poster grid do the heavy lifting.",
    sectionKicker: "Anime catalog",
  },
};

function getActiveChip(scope: CatalogScope) {
  if (scope === "movie") {
    return "Movies";
  }

  if (scope === "series") {
    return "Series";
  }

  if (scope === "anime") {
    return "Anime";
  }

  return "Latest";
}

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

export function BrowseCatalogPage({ scope }: { scope: CatalogScope }) {
  const copy = scopeCopy[scope];
  const config = getCatalogConfig();
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
        <FilterBar groups={filterGroups} chips={config.quickFilterChips} activeChip={getActiveChip(scope)} />
      </section>

      <section className="catalog-section">
        <div className="catalog-header">
          <div>
            <p className="section-kicker">{copy.sectionKicker}</p>
            <h1 className="section-title">{feed.title}</h1>
          </div>
          <p className="catalog-feed-meta">
            {totalItems} titles · page 1 of {totalPages}
          </p>
        </div>
        <p className="catalog-feed-description">{feed.description}</p>

        <MediaGrid items={feed.items} title={`${feed.title} catalog`} />
        <Pagination currentPage={1} totalPages={totalPages} />
      </section>
    </main>
  );
}
