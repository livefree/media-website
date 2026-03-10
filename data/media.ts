import type { EpisodeItem, MediaItem, MediaResourceLink, SeasonItem } from "../types/media";

type MediaResourceSeed = Omit<MediaResourceLink, "publicId" | "canonicalWatchHref">;
type EpisodeSeed = Omit<EpisodeItem, "publicId" | "canonicalWatchHref" | "streamLinks" | "downloadLinks"> & {
  streamLinks: MediaResourceSeed[];
  downloadLinks: MediaResourceSeed[];
};
type SeasonSeed = Omit<SeasonItem, "episodes"> & {
  episodes: EpisodeSeed[];
};
type MediaSeed = Omit<MediaItem, "publicId" | "canonicalWatchHref" | "compatibilityHref" | "seasons" | "resources"> & {
  seasons: SeasonSeed[];
  resources: MediaResourceSeed[];
};

type EpisodeExpansionPlan = {
  targetEpisodes: number;
  runtimeBase: number;
  runtimeOffsets: number[];
  titleStarts: string[];
  titleEnds: string[];
  summaryTheme: string;
};

const placeholderPlaybackHost = "stream.example.com";
const pendingPlaybackHost = "placeholder.invalid";

const episodicExpansionPlans: Record<string, EpisodeExpansionPlan> = {
  "the-dinosaurs": {
    targetEpisodes: 12,
    runtimeBase: 48,
    runtimeOffsets: [0, 1, -1, 2, 0, 1],
    titleStarts: ["Ashen", "River", "Stone", "Sky", "Bone", "Last"],
    titleEnds: ["Kingdom", "Migration", "Nest", "Fault", "Rain", "Frontier"],
    summaryTheme: "the species-scale fight for survival and migration dominance",
  },
  "1923-season-two": {
    targetEpisodes: 10,
    runtimeBase: 52,
    runtimeOffsets: [0, 2, -1, 1, 0],
    titleStarts: ["Dust", "Winter", "Broken", "Frontier", "Red", "Quiet"],
    titleEnds: ["Ledger", "Crossing", "Telegraph", "Prairie", "Oath", "Reckoning"],
    summaryTheme: "the ranch war closing in from every border",
  },
  "school-spirits-s1": {
    targetEpisodes: 10,
    runtimeBase: 43,
    runtimeOffsets: [0, -1, 1, 0, 2],
    titleStarts: ["Midnight", "Hollow", "Locker", "Chalk", "South", "Mirror"],
    titleEnds: ["Detention", "Signal", "Stairwell", "Echo", "Roster", "Confession"],
    summaryTheme: "the campus mystery surrounding the vanished class",
  },
  "prism-hearts": {
    targetEpisodes: 12,
    runtimeBase: 24,
    runtimeOffsets: [0, 1, 0, -1, 1, 0],
    titleStarts: ["Shining", "Encore", "Velvet", "Silver", "Ribbon", "Starlit"],
    titleEnds: ["Cadence", "Promise", "Refrain", "Backstage", "Overture", "Harmony"],
    summaryTheme: "the idol unit’s climb through the next live circuit",
  },
  "northline-station": {
    targetEpisodes: 12,
    runtimeBase: 46,
    runtimeOffsets: [0, 1, -1, 2, 0, 1],
    titleStarts: ["Polar", "Blind", "Signal", "White", "Silent", "After"],
    titleEnds: ["Trace", "Watch", "Storm", "Beacon", "Static", "Outpost"],
    summaryTheme: "the frozen-border investigation tightening around the station crew",
  },
  "blue-coast-files": {
    targetEpisodes: 10,
    runtimeBase: 45,
    runtimeOffsets: [0, -1, 1, 0, 1],
    titleStarts: ["Harbor", "Cold", "Salt", "Broken", "Low", "Night"],
    titleEnds: ["Ledger", "Marina", "Wake", "Tide", "Anchor", "Channel"],
    summaryTheme: "the marina case file widening into a regional conspiracy",
  },
  "deep-space-ward": {
    targetEpisodes: 11,
    runtimeBase: 44,
    runtimeOffsets: [0, 1, 0, -1, 2],
    titleStarts: ["Quiet", "Docking", "Neon", "Gravity", "Night", "Signal"],
    titleEnds: ["Orbit", "Triage", "Pulse", "Transfer", "Burn", "Protocol"],
    summaryTheme: "the orbital medical team covering up a deep-station emergency",
  },
  "city-afterglow": {
    targetEpisodes: 10,
    runtimeBase: 42,
    runtimeOffsets: [0, 1, -1, 0, 1],
    titleStarts: ["Window", "Side", "Late", "Street", "Faded", "South"],
    titleEnds: ["Light", "Letter", "Transit", "Promise", "Crossing", "Afterglow"],
    summaryTheme: "the neighborhood’s quiet chain of missed connections and returns",
  },
  "neon-shogun-zero": {
    targetEpisodes: 14,
    runtimeBase: 25,
    runtimeOffsets: [0, 1, 0, -1, 1, 0],
    titleStarts: ["Protocol", "Signal", "Steel", "Crimson", "Neon", "Ghost"],
    titleEnds: ["Blade", "Court", "Archive", "Parade", "Circuit", "Mandate"],
    summaryTheme: "the court-tech uprising spreading beyond the capital grid",
  },
  "star-mail-courier": {
    targetEpisodes: 12,
    runtimeBase: 24,
    runtimeOffsets: [0, 1, 0, -1, 1, 0],
    titleStarts: ["First", "Cloud", "Orbit", "Amber", "Night", "Comet"],
    titleEnds: ["Route", "Transit", "Parcel", "Harbor", "Dispatch", "Relay"],
    summaryTheme: "the long-haul delivery route opening into a larger star-map mystery",
  },
  "white-tower-notes": {
    targetEpisodes: 10,
    runtimeBase: 23,
    runtimeOffsets: [0, 1, 0, -1, 1],
    titleStarts: ["Record", "After", "White", "Dust", "Silent", "Lantern"],
    titleEnds: ["Room", "Image", "Archive", "Hall", "Index", "Margin"],
    summaryTheme: "the tower’s hidden archive shifting from notes into warnings",
  },
};

function buildPendingSourceStream(resourceId: string): MediaResourceSeed {
  return {
    id: resourceId,
    label: "Source pending",
    mode: "stream",
    provider: "other",
    format: "placeholder",
    quality: "Pending",
    url: `https://${pendingPlaybackHost}/runtime-source-review/${resourceId}`,
    status: "offline",
  };
}

const mediaCatalogSeed: MediaSeed[] = [
  {
    id: "media-the-dinosaurs",
    slug: "the-dinosaurs",
    title: "恐龙时代：你不知道的故事",
    originalTitle: "我们星球上的生命2 / The Dinosaurs",
    tagline: "A prestige natural-history series built around giant-scale survival.",
    synopsis:
      "A documentary mini-series that follows the rise of dinosaurs from fragile early predators to dominant rulers, using cinematic narration, serialized episodes, and multiple access mirrors.",
    type: "series",
    status: "completed",
    year: 2026,
    originCountry: "United States",
    genres: ["History", "Documentary"],
    tags: ["featured", "hot-search", "episode-player"],
    rating: {
      source: "Douban",
      value: 8.3,
      count: 18426,
    },
    posterUrl: "https://img.ddys.io/movies/the-dinosaurs.webp",
    backdropUrl: "https://img.ddys.io/movies/the-dinosaurs.webp",
    badge: {
      label: "Hot",
      tone: "hot",
    },
    credits: [
      { name: "Nick Shoolingin-Jordan", role: "director" },
      { name: "Morgan Freeman", role: "actor" },
    ],
    seasons: [
      {
        id: "season-the-dinosaurs-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "episode-the-dinosaurs-s1e1",
            slug: "the-dinosaurs-s1e1",
            seasonNumber: 1,
            episodeNumber: 1,
            title: "第01集",
            summary: "The series opens on the earliest dinosaurs competing for survival.",
            runtimeMinutes: 48,
            streamLinks: [
              {
                id: "stream-the-dinosaurs-s1e1",
                label: "播放源 1",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
                status: "online",
              },
              {
                id: "stream-the-dinosaurs-s1e1-fallback",
                label: "播放源 2",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                status: "online",
              },
            ],
            downloadLinks: [
              {
                id: "download-the-dinosaurs-s1e1-baidu",
                label: "第01集 百度网盘",
                mode: "download",
                provider: "baidu",
                format: "netdisk",
                quality: "1080P",
                url: "https://pan.baidu.com/s/the-dinosaurs-s1e1",
                maskedUrl: "baidu.ddys.io/s/••••••",
                accessCode: "ddys",
                status: "online",
                reportCount: 0,
              },
            ],
          },
          {
            id: "episode-the-dinosaurs-s1e2",
            slug: "the-dinosaurs-s1e2",
            seasonNumber: 1,
            episodeNumber: 2,
            title: "第02集",
            summary: "New terrain and predators force rapid adaptation.",
            runtimeMinutes: 49,
            streamLinks: [
              {
                id: "stream-the-dinosaurs-s1e2",
                label: "播放源 1",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://test-streams.mux.dev/test_001/stream.m3u8",
                status: "online",
              },
              {
                id: "stream-the-dinosaurs-s1e2-fallback",
                label: "播放源 2",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-the-dinosaurs-s1e3",
            slug: "the-dinosaurs-s1e3",
            seasonNumber: 1,
            episodeNumber: 3,
            title: "第03集",
            summary: "The mid-season arc tracks scale, migration, and mating pressure.",
            runtimeMinutes: 47,
            streamLinks: [
              {
                id: "stream-the-dinosaurs-s1e3",
                label: "播放源 1",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://test-streams.mux.dev/bbb-360p/bbb-360p.m3u8",
                status: "online",
              },
              {
                id: "stream-the-dinosaurs-s1e3-fallback",
                label: "播放源 2",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-the-dinosaurs-s1e4",
            slug: "the-dinosaurs-s1e4",
            seasonNumber: 1,
            episodeNumber: 4,
            title: "第04集",
            summary: "The finale resolves extinction pressure with a grand-scale final chapter.",
            runtimeMinutes: 50,
            streamLinks: [
              {
                id: "stream-the-dinosaurs-s1e4",
                label: "播放源 1",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://test-streams.mux.dev/dai-discontinuity-deltatre/manifest.m3u8",
                status: "online",
              },
              {
                id: "stream-the-dinosaurs-s1e4-fallback",
                label: "播放源 2",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-the-dinosaurs-quark",
        label: "夸克网盘",
        mode: "download",
        provider: "quark",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.quark.cn/s/0a123a4fa753",
        maskedUrl: "quark.ddys.io/s/••••••",
        status: "online",
        reportCount: 0,
      },
      {
        id: "download-the-dinosaurs-baidu",
        label: "百度网盘",
        mode: "download",
        provider: "baidu",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.baidu.com/s/1NeCn1bI2LVYAz8QJHg85fg",
        maskedUrl: "baidu.ddys.io/s/••••••",
        accessCode: "ddys",
        status: "online",
        reportCount: 0,
      },
      {
        id: "stream-the-dinosaurs-trailer",
        label: "预告源",
        mode: "stream",
        provider: "mp4",
        format: "mp4",
        quality: "1080P",
        url: "https://stream.example.com/the-dinosaurs/trailer.mp4",
        status: "online",
      },
    ],
    resourceSummary: {
      streamCount: 5,
      downloadCount: 3,
      episodeCount: 4,
      availabilityLabel: "4 episodes · multi-source playback · 2 netdisk mirrors",
    },
    metrics: {
      weeklyViews: 18400,
      weeklySearches: 9600,
      saves: 2810,
      completionRate: 0.71,
    },
    isFeatured: true,
    isHotSearch: true,
  },
  {
    id: "media-the-farm",
    slug: "the-farm",
    title: "人肉农场",
    originalTitle: "The Farm",
    tagline: "A grim rural survival thriller.",
    synopsis:
      "A compact movie entry that represents direct-title streaming and mirrored download resources without episodic hierarchy.",
    type: "movie",
    status: "completed",
    year: 2026,
    originCountry: "United States",
    genres: ["Thriller", "Horror"],
    tags: ["movie", "dark"],
    rating: {
      source: "Douban",
      value: 6.8,
      count: 3240,
    },
    posterUrl: "https://img.ddys.io/movies/the-farm.webp",
    badge: {
      label: "New",
      tone: "new",
    },
    credits: [
      { name: "Hans Stjernswärd", role: "director" },
      { name: "Nora Yessayan", role: "actor" },
    ],
    seasons: [],
    resources: [
      {
        id: "stream-the-farm-main",
        label: "Main stream",
        mode: "stream",
        provider: "m3u8",
        format: "m3u8",
        quality: "1080P",
        url: "https://stream.example.com/the-farm/master.m3u8",
        status: "online",
      },
      {
        id: "download-the-farm-quark",
        label: "夸克网盘",
        mode: "download",
        provider: "quark",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.quark.cn/s/farmmirror2026",
        maskedUrl: "quark.ddys.io/s/••••••",
        status: "online",
        reportCount: 1,
      },
    ],
    resourceSummary: {
      streamCount: 1,
      downloadCount: 1,
      episodeCount: 0,
      availabilityLabel: "1 stream · 1 mirror",
    },
    metrics: {
      weeklyViews: 6400,
      weeklySearches: 4100,
      saves: 780,
      completionRate: 0.62,
    },
    isFeatured: true,
    isHotSearch: false,
  },
  {
    id: "media-boyfriend-on-demand",
    slug: "boyfriend-on-demand",
    title: "订阅男友",
    originalTitle: "Boyfriend on Demand",
    tagline: "A glossy romantic concept with a transactional premise.",
    synopsis:
      "A contemporary romance title used as a seed record for category pages, quick search, and browse metrics.",
    type: "movie",
    status: "completed",
    year: 2026,
    originCountry: "South Korea",
    genres: ["Romance", "Drama"],
    tags: ["movie", "romance", "trending"],
    rating: {
      source: "Douban",
      value: 7.5,
      count: 5820,
    },
    posterUrl: "https://img.ddys.io/movies/boyfriend-on-demand.webp",
    badge: {
      label: "Popular",
      tone: "hot",
    },
    credits: [
      { name: "Kim Seung-ho", role: "director" },
      { name: "Bae Suzy", role: "actor" },
    ],
    seasons: [],
    resources: [
      {
        id: "stream-boyfriend-main",
        label: "Main stream",
        mode: "stream",
        provider: "m3u8",
        format: "m3u8",
        quality: "1080P",
        url: "https://stream.example.com/boyfriend-on-demand/master.m3u8",
        status: "online",
      },
      {
        id: "stream-boyfriend-backup",
        label: "Backup stream",
        mode: "stream",
        provider: "mp4",
        format: "mp4",
        quality: "1080P",
        url: "https://stream.example.com/boyfriend-on-demand/master.mp4",
        status: "online",
      },
      {
        id: "download-boyfriend-baidu",
        label: "百度网盘",
        mode: "download",
        provider: "baidu",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.baidu.com/s/boyfriendondemand2026",
        maskedUrl: "baidu.ddys.io/s/••••••",
        accessCode: "ddys",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 2,
      downloadCount: 1,
      episodeCount: 0,
      availabilityLabel: "2 sources · 1 mirror",
    },
    metrics: {
      weeklyViews: 9100,
      weeklySearches: 7300,
      saves: 1900,
      completionRate: 0.68,
    },
    isFeatured: true,
    isHotSearch: true,
  },
  {
    id: "media-war-machine",
    slug: "war-machine",
    title: "侵略机器",
    originalTitle: "War Machine",
    tagline: "A near-future conflict story with mechanized spectacle.",
    synopsis:
      "A science-fiction action seed record used to cover popular, high-velocity catalog slices and filter combinations.",
    type: "movie",
    status: "completed",
    year: 2026,
    originCountry: "United Kingdom",
    genres: ["Sci-fi", "Action"],
    tags: ["movie", "action", "featured"],
    rating: {
      source: "Douban",
      value: 7.9,
      count: 4678,
    },
    posterUrl: "https://img.ddys.io/movies/war-machine.webp",
    badge: {
      label: "Updated",
      tone: "updated",
    },
    credits: [
      { name: "Timo Vuorensola", role: "director" },
      { name: "Aneurin Barnard", role: "actor" },
    ],
    seasons: [],
    resources: [
      {
        id: "stream-war-machine-main",
        label: "Main stream",
        mode: "stream",
        provider: "m3u8",
        format: "m3u8",
        quality: "4K",
        url: "https://stream.example.com/war-machine/master.m3u8",
        status: "online",
      },
      {
        id: "download-war-machine-quark",
        label: "夸克网盘",
        mode: "download",
        provider: "quark",
        format: "netdisk",
        quality: "4K",
        url: "https://pan.quark.cn/s/warmachine4k",
        maskedUrl: "quark.ddys.io/s/••••••",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 1,
      downloadCount: 1,
      episodeCount: 0,
      availabilityLabel: "4K stream ready · 1 mirror",
    },
    metrics: {
      weeklyViews: 7600,
      weeklySearches: 5200,
      saves: 1320,
      completionRate: 0.57,
    },
    isFeatured: true,
    isHotSearch: true,
  },
  {
    id: "media-1923-season-two",
    slug: "1923-season-two",
    title: "1923 第二季",
    originalTitle: "1923 Season 2",
    tagline: "A continuation of a prestige frontier saga.",
    synopsis:
      "A second-season drama record that demonstrates recurring weekly updates, continue-watching state, and episode-aware playback.",
    type: "series",
    status: "ongoing",
    year: 2025,
    originCountry: "United States",
    genres: ["Drama", "Western"],
    tags: ["series", "weekly", "prestige"],
    rating: {
      source: "Douban",
      value: 8.4,
      count: 12620,
    },
    posterUrl: "https://img.ddys.io/movies/1923-a-yellowstone-origin-story.webp",
    badge: {
      label: "Updated",
      tone: "updated",
    },
    credits: [
      { name: "Taylor Sheridan", role: "creator" },
      { name: "Helen Mirren", role: "actor" },
      { name: "Harrison Ford", role: "actor" },
    ],
    seasons: [
      {
        id: "season-1923-2",
        seasonNumber: 2,
        title: "Season 2",
        episodes: [
          {
            id: "episode-1923-s2e1",
            slug: "1923-s2e1",
            seasonNumber: 2,
            episodeNumber: 1,
            title: "Episode 1",
            runtimeMinutes: 55,
            streamLinks: [
              {
                id: "stream-1923-s2e1",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/1923/s2e1.m3u8",
                status: "online",
              },
              {
                id: "stream-1923-s2e1-backup",
                label: "Source B",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://stream.example.com/1923/s2e1.mp4",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-1923-s2e2",
            slug: "1923-s2e2",
            seasonNumber: 2,
            episodeNumber: 2,
            title: "Episode 2",
            runtimeMinutes: 57,
            streamLinks: [
              {
                id: "stream-1923-s2e2",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/1923/s2e2.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-1923-baidu",
        label: "百度网盘",
        mode: "download",
        provider: "baidu",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.baidu.com/s/1923season2",
        maskedUrl: "baidu.ddys.io/s/••••••",
        status: "online",
        reportCount: 2,
      },
    ],
    resourceSummary: {
      streamCount: 3,
      downloadCount: 1,
      episodeCount: 2,
      availabilityLabel: "Weekly update · multi-source player · 1 mirror",
    },
    metrics: {
      weeklyViews: 14100,
      weeklySearches: 8900,
      saves: 2440,
      completionRate: 0.64,
    },
    isFeatured: true,
    isHotSearch: true,
  },
  {
    id: "media-school-spirits-s1",
    slug: "school-spirits-s1",
    title: "校园怪灵 第一季",
    originalTitle: "School Spirits Season 1",
    tagline: "A supernatural teen mystery with steady catalog engagement.",
    synopsis:
      "A complete first-season mystery entry that covers series detail pages with a finished badge and stable mirror counts.",
    type: "series",
    status: "completed",
    year: 2024,
    originCountry: "United States",
    genres: ["Mystery", "Drama"],
    tags: ["series", "completed"],
    rating: {
      source: "Douban",
      value: 7.7,
      count: 5880,
    },
    posterUrl: "https://img.ddys.io/movies/school-spirits-season-1.webp",
    badge: {
      label: "Completed",
      tone: "classic",
    },
    credits: [
      { name: "Megan Trinrud", role: "writer" },
      { name: "Peyton List", role: "actor" },
    ],
    seasons: [
      {
        id: "season-school-spirits-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "episode-school-spirits-s1e1",
            slug: "school-spirits-s1e1",
            seasonNumber: 1,
            episodeNumber: 1,
            title: "Episode 1",
            runtimeMinutes: 43,
            streamLinks: [
              {
                id: "stream-school-spirits-s1e1",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/school-spirits/s1e1.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-school-spirits-quark",
        label: "夸克网盘",
        mode: "download",
        provider: "quark",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.quark.cn/s/schoolspirits",
        maskedUrl: "quark.ddys.io/s/••••••",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 1,
      downloadCount: 1,
      episodeCount: 1,
      availabilityLabel: "Completed · 1 mirror",
    },
    metrics: {
      weeklyViews: 5300,
      weeklySearches: 2600,
      saves: 610,
      completionRate: 0.69,
    },
    isFeatured: false,
    isHotSearch: false,
  },
  {
    id: "media-prism-hearts",
    slug: "prism-hearts",
    title: "Prism Hearts",
    originalTitle: "Prism Hearts",
    tagline: "A glossy performance anime with strong binge completion.",
    synopsis:
      "An anime seed record included so downstream search and category work can test non-live-action catalog paths.",
    type: "anime",
    status: "completed",
    year: 2026,
    originCountry: "Japan",
    genres: ["Animation", "Music", "Drama"],
    tags: ["anime", "featured", "music"],
    rating: {
      source: "Douban",
      value: 8.8,
      count: 7420,
    },
    posterUrl: "https://static.example.com/posters/prism-hearts.webp",
    badge: {
      label: "Hot",
      tone: "hot",
    },
    credits: [
      { name: "Reina Tsurugi", role: "voice" },
      { name: "Akiho Morita", role: "director" },
    ],
    seasons: [
      {
        id: "season-prism-hearts-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "episode-prism-hearts-s1e1",
            slug: "prism-hearts-s1e1",
            seasonNumber: 1,
            episodeNumber: 1,
            title: "Stage 1",
            runtimeMinutes: 24,
            streamLinks: [
              {
                id: "stream-prism-hearts-s1e1",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/prism-hearts/s1e1.m3u8",
                status: "online",
              },
              {
                id: "stream-prism-hearts-s1e1-backup",
                label: "Source B",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://stream.example.com/prism-hearts/s1e1.mp4",
                status: "online",
              },
            ],
            downloadLinks: [
              {
                id: "download-prism-hearts-s1e1-aliyun",
                label: "Stage 1 Aliyun",
                mode: "download",
                provider: "aliyun",
                format: "netdisk",
                quality: "1080P",
                url: "https://aliyundrive.example.com/prism-hearts-s1e1",
                status: "online",
                reportCount: 0,
              },
            ],
          },
          {
            id: "episode-prism-hearts-s1e2",
            slug: "prism-hearts-s1e2",
            seasonNumber: 1,
            episodeNumber: 2,
            title: "Encore",
            runtimeMinutes: 24,
            streamLinks: [
              {
                id: "stream-prism-hearts-s1e2",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/prism-hearts/s1e2.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-prism-hearts-aliyun",
        label: "Aliyun mirror",
        mode: "download",
        provider: "aliyun",
        format: "netdisk",
        quality: "1080P",
        url: "https://aliyundrive.example.com/prism-hearts",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 3,
      downloadCount: 2,
      episodeCount: 2,
      availabilityLabel: "Completed · multi-source anime player · 2 cloud mirrors",
    },
    metrics: {
      weeklyViews: 11200,
      weeklySearches: 6400,
      saves: 2100,
      completionRate: 0.81,
    },
    isFeatured: true,
    isHotSearch: true,
  },
  {
    id: "media-glass-harbor",
    slug: "glass-harbor",
    title: "玻璃港",
    originalTitle: "Glass Harbor",
    tagline: "A coastal crime thriller with dense procedural intrigue.",
    synopsis:
      "A French feature seeded to widen browse and search coverage across crime-heavy, high-rating movie filters with a non-English original title.",
    type: "movie",
    status: "completed",
    year: 2025,
    originCountry: "France",
    genres: ["Crime", "Thriller"],
    tags: ["movie", "festival", "coastal"],
    rating: {
      source: "Douban",
      value: 8.1,
      count: 4180,
    },
    posterUrl: "https://static.example.com/posters/glass-harbor.webp",
    badge: {
      label: "Staff Pick",
      tone: "staff-pick",
    },
    credits: [
      { name: "Elodie Marchand", role: "director" },
      { name: "Niels Schneider", role: "actor" },
    ],
    seasons: [],
    resources: [
      {
        id: "stream-glass-harbor-main",
        label: "Main stream",
        mode: "stream",
        provider: "m3u8",
        format: "m3u8",
        quality: "1080P",
        url: "https://stream.example.com/glass-harbor/master.m3u8",
        status: "online",
      },
      {
        id: "download-glass-harbor-quark",
        label: "夸克网盘",
        mode: "download",
        provider: "quark",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.quark.cn/s/glassharbor2025",
        maskedUrl: "quark.ddys.io/s/••••••",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 1,
      downloadCount: 1,
      episodeCount: 0,
      availabilityLabel: "Festival favorite · 1 stream · 1 mirror",
    },
    metrics: {
      weeklyViews: 6900,
      weeklySearches: 3800,
      saves: 940,
      completionRate: 0.73,
    },
    isFeatured: false,
    isHotSearch: false,
  },
  {
    id: "media-lunar-signal",
    slug: "lunar-signal",
    title: "月面信号",
    originalTitle: "Lunar Signal",
    tagline: "A restrained sci-fi drama built around isolation and delayed contact.",
    synopsis:
      "A Japanese science-fiction movie added so filters can combine high-rating sci-fi, 2024 releases, and non-Western movie regions.",
    type: "movie",
    status: "completed",
    year: 2024,
    originCountry: "Japan",
    genres: ["Sci-fi", "Drama"],
    tags: ["movie", "arthouse", "space"],
    rating: {
      source: "Douban",
      value: 8.5,
      count: 6340,
    },
    posterUrl: "https://static.example.com/posters/lunar-signal.webp",
    badge: {
      label: "Hot",
      tone: "hot",
    },
    credits: [
      { name: "Naoki Ishida", role: "director" },
      { name: "Suzu Hirose", role: "actor" },
    ],
    seasons: [],
    resources: [
      {
        id: "stream-lunar-signal-main",
        label: "Main stream",
        mode: "stream",
        provider: "mp4",
        format: "mp4",
        quality: "4K",
        url: "https://stream.example.com/lunar-signal/master.mp4",
        status: "online",
      },
      {
        id: "download-lunar-signal-aliyun",
        label: "Aliyun mirror",
        mode: "download",
        provider: "aliyun",
        format: "netdisk",
        quality: "4K",
        url: "https://aliyundrive.example.com/lunar-signal",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 1,
      downloadCount: 1,
      episodeCount: 0,
      availabilityLabel: "4K sci-fi drama · 1 stream · 1 cloud mirror",
    },
    metrics: {
      weeklyViews: 8400,
      weeklySearches: 4600,
      saves: 1510,
      completionRate: 0.78,
    },
    isFeatured: true,
    isHotSearch: false,
  },
  {
    id: "media-echo-flight",
    slug: "echo-flight",
    title: "回声航班",
    originalTitle: "Echo Flight",
    tagline: "A kinetic aircraft action thriller with a disaster-mystery angle.",
    synopsis:
      "A Chinese action title that adds older-year movie coverage and gives search filters another action-thriller combination outside the English-language set.",
    type: "movie",
    status: "completed",
    year: 2023,
    originCountry: "China",
    genres: ["Action", "Thriller"],
    tags: ["movie", "action", "aviation"],
    rating: {
      source: "Douban",
      value: 7.2,
      count: 2780,
    },
    posterUrl: "https://static.example.com/posters/echo-flight.webp",
    badge: {
      label: "Updated",
      tone: "updated",
    },
    credits: [
      { name: "Zhou Ran", role: "director" },
      { name: "Ou Hao", role: "actor" },
    ],
    seasons: [],
    resources: [
      {
        id: "stream-echo-flight-main",
        label: "Main stream",
        mode: "stream",
        provider: "m3u8",
        format: "m3u8",
        quality: "1080P",
        url: "https://stream.example.com/echo-flight/master.m3u8",
        status: "online",
      },
      {
        id: "download-echo-flight-baidu",
        label: "百度网盘",
        mode: "download",
        provider: "baidu",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.baidu.com/s/echoflight2023",
        maskedUrl: "baidu.ddys.io/s/••••••",
        accessCode: "ddys",
        status: "online",
        reportCount: 1,
      },
    ],
    resourceSummary: {
      streamCount: 1,
      downloadCount: 1,
      episodeCount: 0,
      availabilityLabel: "Action catalog fill · 1 stream · 1 mirror",
    },
    metrics: {
      weeklyViews: 5800,
      weeklySearches: 3200,
      saves: 640,
      completionRate: 0.61,
    },
    isFeatured: false,
    isHotSearch: false,
  },
  {
    id: "media-midnight-archive",
    slug: "midnight-archive",
    title: "午夜档案",
    originalTitle: "Midnight Archive",
    tagline: "An archival mystery thriller set around a buried intelligence cache.",
    synopsis:
      "A U.K. mystery-crime movie used to thicken 2022 coverage and create more non-current-year combinations for browse sorting and pagination.",
    type: "movie",
    status: "completed",
    year: 2022,
    originCountry: "United Kingdom",
    genres: ["Mystery", "Crime"],
    tags: ["movie", "mystery", "archive"],
    rating: {
      source: "Douban",
      value: 7.6,
      count: 3510,
    },
    posterUrl: "https://static.example.com/posters/midnight-archive.webp",
    badge: {
      label: "Classic",
      tone: "classic",
    },
    credits: [
      { name: "Ruth Fiennes", role: "director" },
      { name: "George MacKay", role: "actor" },
    ],
    seasons: [],
    resources: [
      {
        id: "stream-midnight-archive-main",
        label: "Main stream",
        mode: "stream",
        provider: "mp4",
        format: "mp4",
        quality: "1080P",
        url: "https://stream.example.com/midnight-archive/master.mp4",
        status: "online",
      },
    ],
    resourceSummary: {
      streamCount: 1,
      downloadCount: 0,
      episodeCount: 0,
      availabilityLabel: "Archive thriller · direct playback only",
    },
    metrics: {
      weeklyViews: 3900,
      weeklySearches: 2100,
      saves: 520,
      completionRate: 0.74,
    },
    isFeatured: false,
    isHotSearch: false,
  },
  {
    id: "media-spring-snow-corridor",
    slug: "spring-snow-corridor",
    title: "春雪回廊",
    originalTitle: "Spring Snow Corridor",
    tagline: "A sleek relationship drama anchored by reunion tension.",
    synopsis:
      "A South Korean romance-drama movie that adds 2021 coverage and deepens overlapping year, region, and genre filter combinations.",
    type: "movie",
    status: "completed",
    year: 2021,
    originCountry: "South Korea",
    genres: ["Romance", "Drama"],
    tags: ["movie", "romance", "melodrama"],
    rating: {
      source: "Douban",
      value: 8.0,
      count: 4890,
    },
    posterUrl: "https://static.example.com/posters/spring-snow-corridor.webp",
    badge: {
      label: "Staff Pick",
      tone: "staff-pick",
    },
    credits: [
      { name: "Lee Hye-jin", role: "director" },
      { name: "Jeon Yeo-been", role: "actor" },
    ],
    seasons: [],
    resources: [
      {
        id: "stream-spring-snow-corridor-main",
        label: "Main stream",
        mode: "stream",
        provider: "m3u8",
        format: "m3u8",
        quality: "1080P",
        url: "https://stream.example.com/spring-snow-corridor/master.m3u8",
        status: "online",
      },
      {
        id: "download-spring-snow-corridor-quark",
        label: "夸克网盘",
        mode: "download",
        provider: "quark",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.quark.cn/s/springsnowcorridor",
        maskedUrl: "quark.ddys.io/s/••••••",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 1,
      downloadCount: 1,
      episodeCount: 0,
      availabilityLabel: "Reunion romance · 1 stream · 1 mirror",
    },
    metrics: {
      weeklyViews: 4700,
      weeklySearches: 3000,
      saves: 880,
      completionRate: 0.79,
    },
    isFeatured: false,
    isHotSearch: false,
  },
  {
    id: "media-equator-storm-line",
    slug: "equator-storm-line",
    title: "赤道风暴线",
    originalTitle: "Equator Storm Line",
    tagline: "A storm-chasing documentary feature with expedition energy.",
    synopsis:
      "An Australian documentary-adventure movie that broadens region coverage and gives the browse/search filters a non-series documentary branch.",
    type: "movie",
    status: "completed",
    year: 2024,
    originCountry: "Australia",
    genres: ["Documentary", "Adventure"],
    tags: ["movie", "documentary", "expedition"],
    rating: {
      source: "Douban",
      value: 7.8,
      count: 2430,
    },
    posterUrl: "https://static.example.com/posters/equator-storm-line.webp",
    badge: {
      label: "New",
      tone: "new",
    },
    credits: [
      { name: "Maeve Holloway", role: "director" },
      { name: "Luca Bennet", role: "producer" },
    ],
    seasons: [],
    resources: [
      {
        id: "stream-equator-storm-line-main",
        label: "Main stream",
        mode: "stream",
        provider: "mp4",
        format: "mp4",
        quality: "1080P",
        url: "https://stream.example.com/equator-storm-line/master.mp4",
        status: "online",
      },
      {
        id: "download-equator-storm-line-aliyun",
        label: "Aliyun mirror",
        mode: "download",
        provider: "aliyun",
        format: "netdisk",
        quality: "1080P",
        url: "https://aliyundrive.example.com/equator-storm-line",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 1,
      downloadCount: 1,
      episodeCount: 0,
      availabilityLabel: "Feature documentary · 1 stream · 1 cloud mirror",
    },
    metrics: {
      weeklyViews: 3600,
      weeklySearches: 1800,
      saves: 410,
      completionRate: 0.76,
    },
    isFeatured: false,
    isHotSearch: false,
  },
  {
    id: "media-fragment-bistro",
    slug: "fragment-bistro",
    title: "碎片餐厅",
    originalTitle: "Fragment Bistro",
    tagline: "A bittersweet ensemble dramedy about a restaurant held together by ritual.",
    synopsis:
      "A 2019 French drama-comedy included to create deeper long-tail year coverage and help pagination/sort testing with older catalog titles.",
    type: "movie",
    status: "completed",
    year: 2019,
    originCountry: "France",
    genres: ["Drama", "Comedy"],
    tags: ["movie", "ensemble", "slice-of-life"],
    rating: {
      source: "Douban",
      value: 7.4,
      count: 1980,
    },
    posterUrl: "https://static.example.com/posters/fragment-bistro.webp",
    badge: {
      label: "Classic",
      tone: "classic",
    },
    credits: [
      { name: "Camille Roche", role: "director" },
      { name: "Adèle Exarchopoulos", role: "actor" },
    ],
    seasons: [],
    resources: [
      {
        id: "stream-fragment-bistro-main",
        label: "Main stream",
        mode: "stream",
        provider: "m3u8",
        format: "m3u8",
        quality: "1080P",
        url: "https://stream.example.com/fragment-bistro/master.m3u8",
        status: "online",
      },
    ],
    resourceSummary: {
      streamCount: 1,
      downloadCount: 0,
      episodeCount: 0,
      availabilityLabel: "Catalog library title · direct playback",
    },
    metrics: {
      weeklyViews: 2500,
      weeklySearches: 1200,
      saves: 370,
      completionRate: 0.83,
    },
    isFeatured: false,
    isHotSearch: false,
  },
  {
    id: "media-northline-station",
    slug: "northline-station",
    title: "北线观测站",
    originalTitle: "Northline Station",
    tagline: "A frozen-station thriller that unfolds through weekly data anomalies.",
    synopsis:
      "A Canadian ongoing series that extends 2026 browse coverage beyond movies and deepens thriller/mystery combinations for episodic filtering.",
    type: "series",
    status: "ongoing",
    year: 2026,
    originCountry: "Canada",
    genres: ["Thriller", "Mystery"],
    tags: ["series", "weekly", "arctic"],
    rating: {
      source: "Douban",
      value: 8.2,
      count: 5520,
    },
    posterUrl: "https://static.example.com/posters/northline-station.webp",
    badge: {
      label: "Updated",
      tone: "updated",
    },
    credits: [
      { name: "Mira Atwood", role: "creator" },
      { name: "Tantoo Cardinal", role: "actor" },
    ],
    seasons: [
      {
        id: "season-northline-station-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "episode-northline-station-s1e1",
            slug: "northline-station-s1e1",
            seasonNumber: 1,
            episodeNumber: 1,
            title: "Whiteout",
            summary: "A downed signal array reveals the first impossible reading.",
            runtimeMinutes: 46,
            streamLinks: [
              {
                id: "stream-northline-station-s1e1",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/northline-station/s1e1.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-northline-station-s1e2",
            slug: "northline-station-s1e2",
            seasonNumber: 1,
            episodeNumber: 2,
            title: "Blind Spots",
            summary: "The crew discovers missing hours in the observatory logs.",
            runtimeMinutes: 47,
            streamLinks: [
              {
                id: "stream-northline-station-s1e2",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/northline-station/s1e2.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-northline-station-s1e3",
            slug: "northline-station-s1e3",
            seasonNumber: 1,
            episodeNumber: 3,
            title: "Red Trace",
            summary: "A rescue mission reveals a second station that should not exist.",
            runtimeMinutes: 49,
            streamLinks: [
              {
                id: "stream-northline-station-s1e3",
                label: "Source A",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://stream.example.com/northline-station/s1e3.mp4",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-northline-station-baidu",
        label: "百度网盘",
        mode: "download",
        provider: "baidu",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.baidu.com/s/northlinestation",
        maskedUrl: "baidu.ddys.io/s/••••••",
        accessCode: "ddys",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 3,
      downloadCount: 1,
      episodeCount: 3,
      availabilityLabel: "Weekly mystery drop · 3 episodes live · 1 mirror",
    },
    metrics: {
      weeklyViews: 12400,
      weeklySearches: 6100,
      saves: 1760,
      completionRate: 0.66,
    },
    isFeatured: true,
    isHotSearch: false,
  },
  {
    id: "media-blue-coast-files",
    slug: "blue-coast-files",
    title: "蓝岸疑云",
    originalTitle: "Blue Coast Files",
    tagline: "A sunlit crime series driven by municipal corruption cases.",
    synopsis:
      "A Spanish completed series that reinforces crime-filter depth and adds another non-English episodic entry for browse card and detail testing.",
    type: "series",
    status: "completed",
    year: 2025,
    originCountry: "Spain",
    genres: ["Crime", "Drama"],
    tags: ["series", "crime", "coastal"],
    rating: {
      source: "Douban",
      value: 7.9,
      count: 4720,
    },
    posterUrl: "https://static.example.com/posters/blue-coast-files.webp",
    badge: {
      label: "Popular",
      tone: "hot",
    },
    credits: [
      { name: "Clara Mendez", role: "creator" },
      { name: "Miguel Herrán", role: "actor" },
    ],
    seasons: [
      {
        id: "season-blue-coast-files-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "episode-blue-coast-files-s1e1",
            slug: "blue-coast-files-s1e1",
            seasonNumber: 1,
            episodeNumber: 1,
            title: "Harbor Ledger",
            runtimeMinutes: 44,
            streamLinks: [
              {
                id: "stream-blue-coast-files-s1e1",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/blue-coast-files/s1e1.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-blue-coast-files-s1e2",
            slug: "blue-coast-files-s1e2",
            seasonNumber: 1,
            episodeNumber: 2,
            title: "Cold Marina",
            runtimeMinutes: 45,
            streamLinks: [
              {
                id: "stream-blue-coast-files-s1e2",
                label: "Source A",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://stream.example.com/blue-coast-files/s1e2.mp4",
                status: "online",
              },
            ],
            downloadLinks: [
              {
                id: "download-blue-coast-files-s1e2-quark",
                label: "Episode 2 Quark",
                mode: "download",
                provider: "quark",
                format: "netdisk",
                quality: "1080P",
                url: "https://pan.quark.cn/s/bluecoastfiles-e2",
                maskedUrl: "quark.ddys.io/s/••••••",
                status: "online",
                reportCount: 0,
              },
            ],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-blue-coast-files-baidu",
        label: "百度网盘",
        mode: "download",
        provider: "baidu",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.baidu.com/s/bluecoastfiles",
        maskedUrl: "baidu.ddys.io/s/••••••",
        accessCode: "ddys",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 2,
      downloadCount: 2,
      episodeCount: 2,
      availabilityLabel: "Completed coastal crime run · 2 stream sources · 2 mirrors",
    },
    metrics: {
      weeklyViews: 8600,
      weeklySearches: 4200,
      saves: 1210,
      completionRate: 0.72,
    },
    isFeatured: true,
    isHotSearch: false,
  },
  {
    id: "media-deep-space-ward",
    slug: "deep-space-ward",
    title: "深空医务室",
    originalTitle: "Deep Space Ward",
    tagline: "A medical station drama framed as a sci-fi rescue serial.",
    synopsis:
      "A U.S. science-fiction series added so filters can intersect region, type, and genre around modern episodic sci-fi outside the title-local mock set.",
    type: "series",
    status: "ongoing",
    year: 2024,
    originCountry: "United States",
    genres: ["Sci-fi", "Drama"],
    tags: ["series", "medical", "space"],
    rating: {
      source: "Douban",
      value: 8.0,
      count: 6620,
    },
    posterUrl: "https://static.example.com/posters/deep-space-ward.webp",
    badge: {
      label: "Updated",
      tone: "updated",
    },
    credits: [
      { name: "Tara Jennings", role: "creator" },
      { name: "Jessie Mei Li", role: "actor" },
    ],
    seasons: [
      {
        id: "season-deep-space-ward-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "episode-deep-space-ward-s1e1",
            slug: "deep-space-ward-s1e1",
            seasonNumber: 1,
            episodeNumber: 1,
            title: "Docking Burn",
            runtimeMinutes: 50,
            streamLinks: [
              {
                id: "stream-deep-space-ward-s1e1",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/deep-space-ward/s1e1.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-deep-space-ward-s1e2",
            slug: "deep-space-ward-s1e2",
            seasonNumber: 1,
            episodeNumber: 2,
            title: "Quiet Orbit",
            runtimeMinutes: 49,
            streamLinks: [
              {
                id: "stream-deep-space-ward-s1e2",
                label: "Source A",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://stream.example.com/deep-space-ward/s1e2.mp4",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-deep-space-ward-aliyun",
        label: "Aliyun mirror",
        mode: "download",
        provider: "aliyun",
        format: "netdisk",
        quality: "1080P",
        url: "https://aliyundrive.example.com/deep-space-ward",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 2,
      downloadCount: 1,
      episodeCount: 2,
      availabilityLabel: "Sci-fi weekly serial · 2 episodes live · 1 mirror",
    },
    metrics: {
      weeklyViews: 9800,
      weeklySearches: 5000,
      saves: 1490,
      completionRate: 0.67,
    },
    isFeatured: true,
    isHotSearch: false,
  },
  {
    id: "media-city-afterglow",
    slug: "city-afterglow",
    title: "城市余温",
    originalTitle: "City Afterglow",
    tagline: "A relationship drama about neighbors rebuilding a block after closure.",
    synopsis:
      "A Chinese completed series that strengthens romance/drama coverage on the episodic side and gives the search route more non-English long-tail results.",
    type: "series",
    status: "completed",
    year: 2023,
    originCountry: "China",
    genres: ["Romance", "Drama"],
    tags: ["series", "urban", "ensemble"],
    rating: {
      source: "Douban",
      value: 7.8,
      count: 4380,
    },
    posterUrl: "https://static.example.com/posters/city-afterglow.webp",
    badge: {
      label: "Classic",
      tone: "classic",
    },
    credits: [
      { name: "Yu Xinyue", role: "creator" },
      { name: "Zhou Yutong", role: "actor" },
    ],
    seasons: [
      {
        id: "season-city-afterglow-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "episode-city-afterglow-s1e1",
            slug: "city-afterglow-s1e1",
            seasonNumber: 1,
            episodeNumber: 1,
            title: "Window Light",
            runtimeMinutes: 42,
            streamLinks: [
              {
                id: "stream-city-afterglow-s1e1",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/city-afterglow/s1e1.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-city-afterglow-s1e2",
            slug: "city-afterglow-s1e2",
            seasonNumber: 1,
            episodeNumber: 2,
            title: "Side Street",
            runtimeMinutes: 43,
            streamLinks: [
              {
                id: "stream-city-afterglow-s1e2",
                label: "Source A",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://stream.example.com/city-afterglow/s1e2.mp4",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-city-afterglow-baidu",
        label: "百度网盘",
        mode: "download",
        provider: "baidu",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.baidu.com/s/cityafterglow",
        maskedUrl: "baidu.ddys.io/s/••••••",
        accessCode: "ddys",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 2,
      downloadCount: 1,
      episodeCount: 2,
      availabilityLabel: "Completed urban drama · 2 episodes · 1 mirror",
    },
    metrics: {
      weeklyViews: 6100,
      weeklySearches: 3400,
      saves: 780,
      completionRate: 0.77,
    },
    isFeatured: false,
    isHotSearch: false,
  },
  {
    id: "media-neon-shogun-zero",
    slug: "neon-shogun-zero",
    title: "Neon Shogun Zero",
    originalTitle: "Neon Shogun Zero",
    tagline: "A neon-lit action anime mixing mecha ritual and court intrigue.",
    synopsis:
      "A 2026 anime entry added to strengthen top-rated and popular anime slices while contributing more action and sci-fi combinations to the shared catalog.",
    type: "anime",
    status: "ongoing",
    year: 2026,
    originCountry: "Japan",
    genres: ["Animation", "Action", "Sci-fi"],
    tags: ["anime", "mecha", "weekly"],
    rating: {
      source: "Douban",
      value: 8.9,
      count: 8150,
    },
    posterUrl: "https://static.example.com/posters/neon-shogun-zero.webp",
    badge: {
      label: "Hot",
      tone: "hot",
    },
    credits: [
      { name: "Yori Tanaka", role: "director" },
      { name: "Miyu Tomita", role: "voice" },
    ],
    seasons: [
      {
        id: "season-neon-shogun-zero-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "episode-neon-shogun-zero-s1e1",
            slug: "neon-shogun-zero-s1e1",
            seasonNumber: 1,
            episodeNumber: 1,
            title: "Protocol Blade",
            runtimeMinutes: 24,
            streamLinks: [
              {
                id: "stream-neon-shogun-zero-s1e1",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/neon-shogun-zero/s1e1.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-neon-shogun-zero-s1e2",
            slug: "neon-shogun-zero-s1e2",
            seasonNumber: 1,
            episodeNumber: 2,
            title: "Signal Court",
            runtimeMinutes: 24,
            streamLinks: [
              {
                id: "stream-neon-shogun-zero-s1e2",
                label: "Source A",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://stream.example.com/neon-shogun-zero/s1e2.mp4",
                status: "online",
              },
            ],
            downloadLinks: [
              {
                id: "download-neon-shogun-zero-s1e2-aliyun",
                label: "Episode 2 Aliyun",
                mode: "download",
                provider: "aliyun",
                format: "netdisk",
                quality: "1080P",
                url: "https://aliyundrive.example.com/neon-shogun-zero-e2",
                status: "online",
                reportCount: 0,
              },
            ],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-neon-shogun-zero-aliyun",
        label: "Aliyun mirror",
        mode: "download",
        provider: "aliyun",
        format: "netdisk",
        quality: "1080P",
        url: "https://aliyundrive.example.com/neon-shogun-zero",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 2,
      downloadCount: 2,
      episodeCount: 2,
      availabilityLabel: "Hot weekly anime · 2 episodes · 2 cloud mirrors",
    },
    metrics: {
      weeklyViews: 13600,
      weeklySearches: 7800,
      saves: 2360,
      completionRate: 0.8,
    },
    isFeatured: true,
    isHotSearch: true,
  },
  {
    id: "media-star-mail-courier",
    slug: "star-mail-courier",
    title: "星海邮差",
    originalTitle: "Star Mail Courier",
    tagline: "A delivery-route adventure anime with a bright fantasy tone.",
    synopsis:
      "A 2025 fantasy-adventure anime that broadens family-friendly anime facets and supplies a lower-intensity alternative to action-focused results.",
    type: "anime",
    status: "completed",
    year: 2025,
    originCountry: "Japan",
    genres: ["Animation", "Adventure", "Fantasy"],
    tags: ["anime", "adventure", "comfort-watch"],
    rating: {
      source: "Douban",
      value: 8.4,
      count: 5030,
    },
    posterUrl: "https://static.example.com/posters/star-mail-courier.webp",
    badge: {
      label: "Staff Pick",
      tone: "staff-pick",
    },
    credits: [
      { name: "Kana Fujimoto", role: "director" },
      { name: "Natsumi Kawaida", role: "voice" },
    ],
    seasons: [
      {
        id: "season-star-mail-courier-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "episode-star-mail-courier-s1e1",
            slug: "star-mail-courier-s1e1",
            seasonNumber: 1,
            episodeNumber: 1,
            title: "First Route",
            runtimeMinutes: 23,
            streamLinks: [
              {
                id: "stream-star-mail-courier-s1e1",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/star-mail-courier/s1e1.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-star-mail-courier-s1e2",
            slug: "star-mail-courier-s1e2",
            seasonNumber: 1,
            episodeNumber: 2,
            title: "Cloud Transit",
            runtimeMinutes: 23,
            streamLinks: [
              {
                id: "stream-star-mail-courier-s1e2",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/star-mail-courier/s1e2.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-star-mail-courier-quark",
        label: "夸克网盘",
        mode: "download",
        provider: "quark",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.quark.cn/s/starmailcourier",
        maskedUrl: "quark.ddys.io/s/••••••",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 2,
      downloadCount: 1,
      episodeCount: 2,
      availabilityLabel: "Fantasy anime catalog fill · 2 episodes · 1 mirror",
    },
    metrics: {
      weeklyViews: 7200,
      weeklySearches: 3300,
      saves: 1180,
      completionRate: 0.84,
    },
    isFeatured: false,
    isHotSearch: false,
  },
  {
    id: "media-white-tower-notes",
    slug: "white-tower-notes",
    title: "白塔手记",
    originalTitle: "White Tower Notes",
    tagline: "A moody mystery anime about archives, memory, and city legends.",
    synopsis:
      "A Chinese anime title that expands non-Japanese animation coverage and helps filter tests reach more mixed genre combinations across year and region.",
    type: "anime",
    status: "completed",
    year: 2024,
    originCountry: "China",
    genres: ["Animation", "Mystery", "Drama"],
    tags: ["anime", "mystery", "urban-fantasy"],
    rating: {
      source: "Douban",
      value: 8.1,
      count: 4210,
    },
    posterUrl: "https://static.example.com/posters/white-tower-notes.webp",
    badge: {
      label: "Updated",
      tone: "updated",
    },
    credits: [
      { name: "Lin Xiaoqiu", role: "director" },
      { name: "Xu Jiaqi", role: "voice" },
    ],
    seasons: [
      {
        id: "season-white-tower-notes-1",
        seasonNumber: 1,
        title: "Season 1",
        episodes: [
          {
            id: "episode-white-tower-notes-s1e1",
            slug: "white-tower-notes-s1e1",
            seasonNumber: 1,
            episodeNumber: 1,
            title: "Record Room",
            runtimeMinutes: 25,
            streamLinks: [
              {
                id: "stream-white-tower-notes-s1e1",
                label: "Source A",
                mode: "stream",
                provider: "m3u8",
                format: "m3u8",
                quality: "1080P",
                url: "https://stream.example.com/white-tower-notes/s1e1.m3u8",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
          {
            id: "episode-white-tower-notes-s1e2",
            slug: "white-tower-notes-s1e2",
            seasonNumber: 1,
            episodeNumber: 2,
            title: "After Image",
            runtimeMinutes: 25,
            streamLinks: [
              {
                id: "stream-white-tower-notes-s1e2",
                label: "Source A",
                mode: "stream",
                provider: "mp4",
                format: "mp4",
                quality: "1080P",
                url: "https://stream.example.com/white-tower-notes/s1e2.mp4",
                status: "online",
              },
            ],
            downloadLinks: [],
          },
        ],
      },
    ],
    resources: [
      {
        id: "download-white-tower-notes-baidu",
        label: "百度网盘",
        mode: "download",
        provider: "baidu",
        format: "netdisk",
        quality: "1080P",
        url: "https://pan.baidu.com/s/whitetowernotes",
        maskedUrl: "baidu.ddys.io/s/••••••",
        accessCode: "ddys",
        status: "online",
        reportCount: 0,
      },
    ],
    resourceSummary: {
      streamCount: 2,
      downloadCount: 1,
      episodeCount: 2,
      availabilityLabel: "Mystery animation catalog fill · 2 episodes · 1 mirror",
    },
    metrics: {
      weeklyViews: 6700,
      weeklySearches: 3500,
      saves: 1090,
      completionRate: 0.82,
    },
    isFeatured: false,
    isHotSearch: false,
  },
];

function buildOpaqueToken(namespace: string): string {
  let hashA = 2166136261;
  let hashB = 1315423911;
  const seed = `media-website-v2:public-url-round-1:${namespace}`;

  for (let index = 0; index < seed.length; index += 1) {
    const code = seed.charCodeAt(index);
    hashA ^= code;
    hashA = Math.imul(hashA, 16777619) >>> 0;
    hashB ^= (hashB << 5) + code + (hashB >>> 2);
    hashB >>>= 0;
  }

  return `${hashA.toString(36)}${hashB.toString(36)}`.slice(0, 12);
}

function buildPublicId(prefix: string, namespace: string): string {
  return `${prefix}_${buildOpaqueToken(`${prefix}:${namespace}`)}`;
}

function buildCompatibilityHref(slug: string): string {
  return `/media/${slug}`;
}

function buildWatchHref(mediaPublicId: string, episodePublicId?: string, resourcePublicId?: string): string {
  const params = new URLSearchParams();
  params.set("v", mediaPublicId);

  if (episodePublicId) {
    params.set("e", episodePublicId);
  }

  if (resourcePublicId) {
    params.set("r", resourcePublicId);
  }

  return `/watch?${params.toString()}`;
}

function buildGeneratedEpisodeTitle(plan: EpisodeExpansionPlan, episodeNumber: number): string {
  const start = plan.titleStarts[(episodeNumber - 1) % plan.titleStarts.length];
  const end = plan.titleEnds[Math.floor((episodeNumber - 1) / plan.titleStarts.length) % plan.titleEnds.length];
  return `${start} ${end}`;
}

function buildGeneratedEpisodeSummary(media: MediaSeed, plan: EpisodeExpansionPlan, episodeNumber: number, title: string): string {
  return `${media.title} continues with "${title}" as episode ${episodeNumber} pushes deeper into ${plan.summaryTheme}.`;
}

function buildEpisodicAvailabilityLabel(episodeCount: number, downloadCount: number): string {
  const accessLabel = downloadCount > 0 ? `${downloadCount} download resources` : "stream-only access";
  return `${episodeCount} episodes · source review pending · ${accessLabel}`;
}

function buildPendingTitleAvailabilityLabel(downloadCount: number): string {
  const accessLabel = downloadCount > 0 ? `${downloadCount} download resources` : "stream-only access";
  return `source review pending · ${accessLabel}`;
}

function buildExpandedEpisode(media: MediaSeed, season: SeasonSeed, episodeNumber: number, plan: EpisodeExpansionPlan): EpisodeSeed {
  const seasonToken = `s${season.seasonNumber}`;
  const episodeToken = `e${episodeNumber}`;
  const title = buildGeneratedEpisodeTitle(plan, episodeNumber);

  return {
    id: `episode-${media.slug}-${seasonToken}${episodeToken}`,
    slug: `${media.slug}-${seasonToken}${episodeToken}`,
    seasonNumber: season.seasonNumber,
    episodeNumber,
    title,
    summary: buildGeneratedEpisodeSummary(media, plan, episodeNumber, title),
    runtimeMinutes: plan.runtimeBase + plan.runtimeOffsets[(episodeNumber - 1) % plan.runtimeOffsets.length],
    streamLinks: [buildPendingSourceStream(`stream-${media.slug}-${seasonToken}${episodeToken}`)],
    downloadLinks: [],
  };
}

function buildExpandedEpisodeList(media: MediaSeed, season: SeasonSeed, plan: EpisodeExpansionPlan): EpisodeSeed[] {
  const episodes = [...season.episodes];

  for (let episodeNumber = episodes.length + 1; episodeNumber <= plan.targetEpisodes; episodeNumber += 1) {
    episodes.push(buildExpandedEpisode(media, season, episodeNumber, plan));
  }

  return episodes;
}

function buildExpandedEpisodicSummary(media: MediaSeed): MediaSeed["resourceSummary"] {
  const episodeCount = media.seasons.reduce((total, season) => total + season.episodes.length, 0);
  const streamCount =
    media.resources.filter((resource) => resource.mode === "stream").length +
    media.seasons.reduce((total, season) => total + season.episodes.reduce((count, episode) => count + episode.streamLinks.length, 0), 0);
  const downloadCount =
    media.resources.filter((resource) => resource.mode === "download").length +
    media.seasons.reduce((total, season) => total + season.episodes.reduce((count, episode) => count + episode.downloadLinks.length, 0), 0);

  return {
    streamCount,
    downloadCount,
    episodeCount,
    availabilityLabel: buildEpisodicAvailabilityLabel(episodeCount, downloadCount),
  };
}

function expandEpisodicCoverage(media: MediaSeed): MediaSeed {
  if (media.type === "movie") {
    return media;
  }

  const plan = episodicExpansionPlans[media.slug];
  if (!plan || media.seasons.length === 0) {
    return media;
  }

  const seasons = media.seasons.map((season, index) =>
    index === 0
      ? {
          ...season,
          episodes: buildExpandedEpisodeList(media, season, plan),
        }
      : season,
  );
  const expandedMedia = {
    ...media,
    seasons,
  };

  return {
    ...expandedMedia,
    resourceSummary: buildExpandedEpisodicSummary(expandedMedia),
  };
}

function isPlaceholderPlaybackUrl(url: string): boolean {
  if (!url.trim()) {
    return true;
  }

  try {
    const hostname = new URL(url).hostname;
    return hostname === placeholderPlaybackHost || hostname === pendingPlaybackHost;
  } catch {
    return false;
  }
}

function hasKnownGoodStream(resources: MediaResourceSeed[]): boolean {
  return resources.some((resource) => resource.mode === "stream" && !isPlaceholderPlaybackUrl(resource.url));
}

function backfillMovieResources(media: MediaSeed): MediaResourceSeed[] {
  if (hasKnownGoodStream(media.resources)) {
    return media.resources;
  }

  const downloads = media.resources.filter((resource) => resource.mode === "download");
  const firstStream = media.resources.find((resource) => resource.mode === "stream");
  const resourceId = firstStream?.id ?? `stream-${media.slug}-source-pending`;
  const pendingStream = buildPendingSourceStream(resourceId);

  return [pendingStream, ...downloads];
}

function backfillEpisodeStreams(media: MediaSeed, episode: EpisodeSeed): EpisodeSeed {
  if (hasKnownGoodStream(episode.streamLinks)) {
    return episode;
  }

  const resourceId = episode.streamLinks[0]?.id ?? `stream-${episode.slug}-source-pending`;

  return {
    ...episode,
    streamLinks: [buildPendingSourceStream(resourceId)],
  };
}

function normalizeRuntimePlaybackSources(media: MediaSeed): MediaSeed {
  if (media.type === "movie") {
    const resources = backfillMovieResources(media);
    const downloadCount = resources.filter((resource) => resource.mode === "download").length;

    return {
      ...media,
      resources,
      resourceSummary: {
        ...media.resourceSummary,
        streamCount: resources.filter((resource) => resource.mode === "stream").length,
        downloadCount,
        availabilityLabel: buildPendingTitleAvailabilityLabel(downloadCount),
      },
    };
  }

  return {
    ...media,
    seasons: media.seasons.map((season) => ({
      ...season,
      episodes: season.episodes.map((episode) => backfillEpisodeStreams(media, episode)),
    })),
  };
}

function enrichMediaIdentity(media: MediaSeed): MediaItem {
  const mediaPublicId = buildPublicId("med", media.id);
  const compatibilityHref = buildCompatibilityHref(media.slug);
  const canonicalWatchHref = buildWatchHref(mediaPublicId);
  const titleResources = media.resources.map((resource) => {
    const publicId = buildPublicId("res", `${media.id}:${resource.id}`);

    return {
      ...resource,
      publicId,
      canonicalWatchHref: buildWatchHref(mediaPublicId, undefined, publicId),
    };
  });
  const seasons = media.seasons.map((season) => ({
    ...season,
    episodes: season.episodes.map((episode) => {
      const publicId = buildPublicId("ep", `${media.id}:${episode.id}`);

      return {
        ...episode,
        publicId,
        canonicalWatchHref: buildWatchHref(mediaPublicId, publicId),
        streamLinks: episode.streamLinks.map((resource) => {
          const resourcePublicId = buildPublicId("res", `${media.id}:${episode.id}:${resource.id}`);

          return {
            ...resource,
            publicId: resourcePublicId,
            canonicalWatchHref: buildWatchHref(mediaPublicId, publicId, resourcePublicId),
          };
        }),
        downloadLinks: episode.downloadLinks.map((resource) => {
          const resourcePublicId = buildPublicId("res", `${media.id}:${episode.id}:${resource.id}`);

          return {
            ...resource,
            publicId: resourcePublicId,
            canonicalWatchHref: buildWatchHref(mediaPublicId, publicId, resourcePublicId),
          };
        }),
      };
    }),
  }));

  return {
    ...media,
    publicId: mediaPublicId,
    canonicalWatchHref,
    compatibilityHref,
    resources: titleResources,
    seasons,
  };
}

export const mediaCatalog: MediaItem[] = mediaCatalogSeed.map(expandEpisodicCoverage).map(normalizeRuntimePlaybackSources).map(enrichMediaIdentity);
