import type { CatalogCategory, CatalogFilterGroup, SearchSuggestion } from "../types/media";

export const catalogCategories: CatalogCategory[] = [
  {
    slug: "movie",
    label: "Movies",
    href: "/movie",
    mediaType: "movie",
    description: "Feature films and one-off specials with direct stream or download mirrors.",
  },
  {
    slug: "series",
    label: "Series",
    href: "/series",
    mediaType: "series",
    description: "Serialized dramas and documentaries with season and episode hierarchy.",
  },
  {
    slug: "anime",
    label: "Anime",
    href: "/anime",
    mediaType: "anime",
    description: "Animated catalog entries with episodic playback and localized metadata.",
  },
];

export const quickFilterChips = ["Latest", "Popular", "Movies", "Series", "Anime", "Top rated"];

export const catalogFilterGroups: CatalogFilterGroup[] = [
  {
    id: "sort",
    label: "Sort",
    options: [
      { value: "latest", label: "Latest updates" },
      { value: "popular", label: "Most popular" },
      { value: "rating", label: "Highest rated" },
    ],
  },
  {
    id: "type",
    label: "Type",
    options: [
      { value: "all", label: "All categories" },
      { value: "movie", label: "Movies" },
      { value: "series", label: "Series" },
      { value: "anime", label: "Anime" },
    ],
  },
  {
    id: "genre",
    label: "Genre",
    options: [
      { value: "history", label: "History" },
      { value: "crime", label: "Crime" },
      { value: "thriller", label: "Thriller" },
      { value: "romance", label: "Romance" },
      { value: "drama", label: "Drama" },
      { value: "scifi", label: "Sci-fi" },
      { value: "animation", label: "Animation" },
    ],
  },
  {
    id: "region",
    label: "Region",
    options: [
      { value: "united-states", label: "United States" },
      { value: "south-korea", label: "South Korea" },
      { value: "united-kingdom", label: "United Kingdom" },
      { value: "japan", label: "Japan" },
    ],
  },
  {
    id: "year",
    label: "Year",
    options: [
      { value: "2026", label: "2026" },
      { value: "2025", label: "2025" },
      { value: "2024", label: "2024" },
      { value: "2023", label: "2023" },
    ],
  },
];

export const hotSearchSuggestions: SearchSuggestion[] = [
  { slug: "the-dinosaurs", href: "/media/the-dinosaurs", title: "恐龙时代：你不知道的故事", type: "series", year: 2026, rating: 8.3 },
  { slug: "1923-season-two", href: "/media/1923-season-two", title: "1923 第二季", type: "series", year: 2025, rating: 8.4 },
  { slug: "boyfriend-on-demand", href: "/media/boyfriend-on-demand", title: "订阅男友", type: "movie", year: 2026, rating: 7.5 },
  { slug: "war-machine", href: "/media/war-machine", title: "侵略机器", type: "movie", year: 2026, rating: 7.9 },
  { slug: "prism-hearts", href: "/media/prism-hearts", title: "Prism Hearts", type: "anime", year: 2026, rating: 8.8 },
];
