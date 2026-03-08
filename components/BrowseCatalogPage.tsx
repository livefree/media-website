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
    introTitle: "Browse the latest additions across the full streaming catalog.",
    introSummary: "Use the compact search and filter controls to move through new films, series, and anime without the browsing chrome getting in the way.",
    sectionKicker: "Homepage catalog",
  },
  movie: {
    introTitle: "Browse the latest film additions in the shared catalog shell.",
    introSummary: "The top chrome stays compact while filters and the poster grid carry most of the browsing work.",
    sectionKicker: "Movie catalog",
  },
  series: {
    introTitle: "Browse serialized titles with the same tight search-and-filter layout.",
    introSummary: "Keep the focus on episode-ready poster cards and quick filtering rather than large hero copy.",
    sectionKicker: "Series catalog",
  },
  anime: {
    introTitle: "Browse anime releases inside the same compact browsing frame.",
    introSummary: "The header stays minimal so the filter block and dense results grid read closer to the reference.",
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
        <div className="catalog-results-header">
          <div className="catalog-results-copy">
            <p className="section-kicker">{copy.sectionKicker}</p>
            <h1 className="section-title">{feed.title}</h1>
            <p className="catalog-feed-description">{feed.description}</p>
          </div>
          <div className="catalog-results-meta">
            <p className="catalog-results-count">{totalItems} titles</p>
            <p className="catalog-feed-meta">Page 1 of {totalPages}</p>
          </div>
        </div>

        <MediaGrid items={feed.items} title={`${feed.title} catalog`} />
        <Pagination currentPage={1} totalPages={totalPages} />
      </section>
    </main>
  );
}
