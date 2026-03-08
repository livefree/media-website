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
    searchTitle: string;
    searchSummary: string;
    sectionKicker: string;
    sectionTitle: string;
    sectionMeta: string;
  }
> = {
  all: {
    searchTitle: "Browse recent additions before the search flow is wired.",
    searchSummary:
      "The shared browsing shell mirrors the reference with a compact navbar, desktop-first search stack, quick chips, and a dense poster grid driven by the catalog layer.",
    sectionKicker: "Homepage catalog",
    sectionTitle: "Poster-first browsing modeled on the `web-to-colon` reference shell.",
    sectionMeta: "Shared catalog contracts now drive the cards, while search behavior stays deferred to the Search Filter phase.",
  },
  movie: {
    searchTitle: "Scan feature releases and mirrored movie resources fast.",
    searchSummary:
      "This category route reuses the homepage chrome and changes only the active type context, keeping the same search stack, facet controls, and dense card grid.",
    sectionKicker: "Movie catalog",
    sectionTitle: "Feature films stay inside the same compact browsing system.",
    sectionMeta: "Presentation only. Category state is reflected visually here, while URL-backed search remains out of scope.",
  },
  series: {
    searchTitle: "Browse serialized dramas and episodic picks with the same shell.",
    searchSummary:
      "Series browsing keeps the same compact navigation and filter structure while swapping to catalog slices built for season and episode-heavy records.",
    sectionKicker: "Series catalog",
    sectionTitle: "Serialized titles reuse the homepage browsing language.",
    sectionMeta: "The layout is wired to shared browse-card helpers, not page-local placeholder arrays.",
  },
  anime: {
    searchTitle: "Browse animated releases through the same fast scanning surface.",
    searchSummary:
      "Anime browsing inherits the shared search area, quick chips, and poster grid so the route feels like a filtered view over one streaming catalog.",
    sectionKicker: "Anime catalog",
    sectionTitle: "Animated picks sit inside the same reference-aligned catalog shell.",
    sectionMeta: "Genre, region, and year affordances are visible now; interactive filtering lands later in the Search Filter phase.",
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
  const trendingItems = getBrowseCards(scope, 5);
  const filterGroups = getFilterValues(scope);

  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar activeScope={scope} />

      <section className="discovery-section" aria-labelledby="catalog-search-title">
        <SearchBox
          placeholder="Search titles, genres, or moods"
          title={copy.searchTitle}
          summary={copy.searchSummary}
          hotSearches={getHotSearches(5)}
          trendingItems={trendingItems}
        />
        <FilterBar groups={filterGroups} chips={config.quickFilterChips} activeChip={getActiveChip(scope)} />
      </section>

      <section className="catalog-section">
        <div className="catalog-header">
          <div>
            <p className="section-kicker">{copy.sectionKicker}</p>
            <h1 className="section-title">{copy.sectionTitle}</h1>
          </div>
          <p className="section-meta">{copy.sectionMeta}</p>
        </div>

        <div className="catalog-feed-copy">
          <div>
            <p className="catalog-feed-label">{feed.title}</p>
            <p className="catalog-feed-description">{feed.description}</p>
          </div>
          <p className="catalog-feed-meta">
            {totalItems} titles · page 1 of {totalPages}
          </p>
        </div>

        <MediaGrid items={feed.items} title={`${feed.title} catalog`} />
        <Pagination currentPage={1} totalPages={totalPages} />
      </section>
    </main>
  );
}
