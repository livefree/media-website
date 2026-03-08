import { FilterBar } from "../components/FilterBar";
import { MediaGrid } from "../components/MediaGrid";
import { Navbar } from "../components/Navbar";
import { Pagination } from "../components/Pagination";
import { SearchBox } from "../components/SearchBox";

const quickFilters = ["Latest", "Popular", "Movies", "Series", "Anime", "Completed"];
const filterGroups = [
  { label: "Sort", value: "Latest updates" },
  { label: "Type", value: "All categories" },
  { label: "Genre", value: "Drama / thriller" },
  { label: "Region", value: "Global picks" },
  { label: "Year", value: "2026" },
];
const hotSearches = ["Dark frontier", "Award winners", "Weekend series", "Animated picks", "Slow burn"];
const trendingItems = [
  { title: "State of Wonder", meta: "Series · 2026 · 4 streams" },
  { title: "Harbor Lights", meta: "Movie · 2025 · 2 downloads" },
  { title: "Paper Moons", meta: "Anime · 2026 · Completed" },
  { title: "North Drift", meta: "Series · 2024 · Weekly update" },
];

const featuredMedia = [
  {
    title: "Solar Tide",
    subtitle: "Suspense in low orbit",
    year: 2026,
    rating: "8.9",
    format: "Movie",
    badge: "New",
    availability: "Stream ready",
    streams: 3,
    downloads: 1,
    tone: "#ff8a3d",
  },
  {
    title: "Northbound",
    subtitle: "Prestige family drama",
    year: 2025,
    rating: "8.4",
    format: "Series",
    badge: "Popular",
    availability: "Completed",
    streams: 8,
    downloads: 2,
    tone: "#4cc9f0",
  },
  {
    title: "Neon Ronin",
    subtitle: "Cyberpunk revenge loop",
    year: 2026,
    rating: "9.1",
    format: "Anime",
    badge: "Hot",
    availability: "Completed",
    streams: 12,
    downloads: 4,
    tone: "#ff4d6d",
  },
  {
    title: "Glass Harbor",
    subtitle: "Fog-heavy coastal noir",
    year: 2024,
    rating: "7.8",
    format: "Movie",
    badge: "Staff pick",
    availability: "2 mirrors",
    streams: 2,
    downloads: 2,
    tone: "#7aa6ff",
  },
  {
    title: "Second Orbit",
    subtitle: "Wide-angle adventure",
    year: 2025,
    rating: "8.2",
    format: "Series",
    badge: "Updated",
    availability: "Weekly",
    streams: 5,
    downloads: 2,
    tone: "#80ed99",
  },
  {
    title: "River Static",
    subtitle: "Indie blackout thriller",
    year: 2026,
    rating: "7.9",
    format: "Movie",
    badge: "New",
    availability: "1 download",
    streams: 1,
    downloads: 1,
    tone: "#ffd166",
  },
  {
    title: "Signal Bloom",
    subtitle: "Romance with synth-pop edges",
    year: 2024,
    rating: "8.7",
    format: "Anime",
    badge: "Popular",
    availability: "Completed",
    streams: 7,
    downloads: 3,
    tone: "#c77dff",
  },
  {
    title: "Velvet District",
    subtitle: "Crime anthology",
    year: 2025,
    rating: "8.5",
    format: "Series",
    badge: "Updated",
    availability: "Weekly",
    streams: 4,
    downloads: 1,
    tone: "#f28482",
  },
  {
    title: "Blue Meridian",
    subtitle: "Ocean survival odyssey",
    year: 2026,
    rating: "8.1",
    format: "Movie",
    badge: "New",
    availability: "2 mirrors",
    streams: 2,
    downloads: 2,
    tone: "#43bccd",
  },
  {
    title: "Chrome Anthem",
    subtitle: "Arena-scale sci-fi saga",
    year: 2023,
    rating: "7.6",
    format: "Series",
    badge: "Archive",
    availability: "Completed",
    streams: 9,
    downloads: 5,
    tone: "#9b5de5",
  },
  {
    title: "Gilded Ashes",
    subtitle: "Political historical thriller",
    year: 2025,
    rating: "8.8",
    format: "Series",
    badge: "Hot",
    availability: "Completed",
    streams: 6,
    downloads: 2,
    tone: "#f4a261",
  },
  {
    title: "Moss Signal",
    subtitle: "Folk mystery in the hills",
    year: 2024,
    rating: "8.0",
    format: "Movie",
    badge: "Staff pick",
    availability: "1 mirror",
    streams: 1,
    downloads: 1,
    tone: "#6a994e",
  },
  {
    title: "After Marble",
    subtitle: "Design-world satire",
    year: 2026,
    rating: "7.7",
    format: "Movie",
    badge: "New",
    availability: "Stream ready",
    streams: 3,
    downloads: 2,
    tone: "#adb5bd",
  },
  {
    title: "Copper Vale",
    subtitle: "Rural detective serial",
    year: 2025,
    rating: "8.3",
    format: "Series",
    badge: "Popular",
    availability: "Weekly",
    streams: 5,
    downloads: 1,
    tone: "#bc6c25",
  },
  {
    title: "Prism Hearts",
    subtitle: "Concert anime melodrama",
    year: 2026,
    rating: "8.6",
    format: "Anime",
    badge: "Hot",
    availability: "Completed",
    streams: 10,
    downloads: 3,
    tone: "#ff99c8",
  },
  {
    title: "Last Transmission",
    subtitle: "Found-footage sci-fi",
    year: 2024,
    rating: "7.5",
    format: "Movie",
    badge: "Archive",
    availability: "2 downloads",
    streams: 2,
    downloads: 2,
    tone: "#118ab2",
  },
  {
    title: "Ivory Street",
    subtitle: "Elegant city noir",
    year: 2025,
    rating: "8.4",
    format: "Series",
    badge: "Updated",
    availability: "Weekly",
    streams: 4,
    downloads: 2,
    tone: "#d4a373",
  },
  {
    title: "Petal Engine",
    subtitle: "Pastel mecha romance",
    year: 2026,
    rating: "8.9",
    format: "Anime",
    badge: "New",
    availability: "Completed",
    streams: 11,
    downloads: 4,
    tone: "#ffafcc",
  },
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <div className="page-backdrop" aria-hidden="true" />
      <Navbar />

      <section className="discovery-section" aria-labelledby="catalog-search-heading">
        <SearchBox
          placeholder="Search titles, genres, or moods"
          hotSearches={hotSearches}
          trendingItems={trendingItems}
        />
        <FilterBar groups={filterGroups} chips={quickFilters} activeChip="Latest" />
      </section>

      <section className="catalog-section">
        <div className="catalog-header">
          <div>
            <p className="section-kicker">Homepage catalog</p>
            <h1 id="catalog-search-heading" className="section-title">
              Poster-first browsing modeled on the `/web-to-colon` reference shell.
            </h1>
          </div>
          <p className="section-meta">Placeholder data only. Search and filter behavior remain unwired.</p>
        </div>

        <MediaGrid items={featuredMedia} />
        <Pagination currentPage={1} totalPages={3} />
      </section>
    </main>
  );
}
