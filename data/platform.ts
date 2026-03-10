import type {
  BrowseEventRecord,
  PlatformUser,
  PublicListRecord,
  ResourceActivityRecord,
  SearchRecord,
} from "../types/platform";

export const platformUsers: PlatformUser[] = [
  {
    id: "user-chen",
    email: "chen@example.com",
    displayName: "Chen",
    role: "viewer",
    tier: "vip",
    locale: "zh-CN",
    timezone: "Asia/Shanghai",
    preferredGenres: ["History", "Drama", "Animation"],
    preferredTypes: ["movie", "series"],
    watchlistSlugs: ["the-dinosaurs", "1923-season-two", "war-machine"],
    favoriteSlugs: ["the-dinosaurs", "boyfriend-on-demand"],
    continueWatching: [
      {
        mediaSlug: "the-dinosaurs",
        episodeSlug: "the-dinosaurs-s1e2",
        progressPercent: 0.42,
        currentTimeSeconds: 1234,
        durationSeconds: 2940,
        updatedAt: "2026-03-07T20:14:00Z",
      },
    ],
  },
  {
    id: "user-lin",
    email: "lin@example.com",
    displayName: "Lin",
    role: "editor",
    tier: "plus",
    locale: "en-CA",
    timezone: "America/Vancouver",
    preferredGenres: ["Sci-fi", "Mystery"],
    preferredTypes: ["series", "anime"],
    watchlistSlugs: ["prism-hearts", "school-spirits-s1"],
    favoriteSlugs: ["prism-hearts"],
    continueWatching: [
      {
        mediaSlug: "prism-hearts",
        episodeSlug: "prism-hearts-s1e1",
        progressPercent: 0.77,
        currentTimeSeconds: 1110,
        durationSeconds: 1440,
        updatedAt: "2026-03-08T02:08:00Z",
      },
    ],
  },
];

export const recentSearches: SearchRecord[] = [
  {
    id: "search-1",
    userId: "user-chen",
    query: "恐龙时代",
    scope: "all",
    resultCount: 1,
    clickedSlug: "the-dinosaurs",
    createdAt: "2026-03-08T03:20:00Z",
  },
  {
    id: "search-2",
    userId: "user-lin",
    query: "music anime",
    scope: "anime",
    resultCount: 1,
    clickedSlug: "prism-hearts",
    createdAt: "2026-03-08T04:15:00Z",
  },
  {
    id: "search-3",
    query: "1923 season 2",
    scope: "series",
    resultCount: 1,
    clickedSlug: "1923-season-two",
    createdAt: "2026-03-08T04:45:00Z",
  },
];

export const browseEvents: BrowseEventRecord[] = [
  {
    id: "browse-1",
    userId: "user-chen",
    eventType: "home_view",
    route: "/",
    device: "web",
    durationMs: 54000,
    createdAt: "2026-03-08T03:18:00Z",
  },
  {
    id: "browse-2",
    userId: "user-chen",
    mediaSlug: "the-dinosaurs",
    eventType: "detail_view",
    route: "/media/the-dinosaurs",
    device: "web",
    durationMs: 87000,
    createdAt: "2026-03-08T03:21:00Z",
  },
  {
    id: "browse-3",
    userId: "user-lin",
    mediaSlug: "prism-hearts",
    eventType: "player_open",
    route: "/media/prism-hearts",
    device: "desktop",
    durationMs: 126000,
    createdAt: "2026-03-08T04:17:00Z",
  },
  {
    id: "browse-4",
    mediaSlug: "1923-season-two",
    eventType: "category_view",
    route: "/series",
    device: "web",
    durationMs: 22000,
    createdAt: "2026-03-08T04:43:00Z",
  },
];

export const resourceActivities: ResourceActivityRecord[] = [
  {
    id: "resource-1",
    userId: "user-chen",
    mediaSlug: "the-dinosaurs",
    provider: "baidu",
    mode: "download",
    action: "copy",
    createdAt: "2026-03-08T03:25:00Z",
  },
  {
    id: "resource-2",
    userId: "user-lin",
    mediaSlug: "prism-hearts",
    episodeSlug: "prism-hearts-s1e1",
    provider: "m3u8",
    mode: "stream",
    action: "open",
    createdAt: "2026-03-08T04:17:30Z",
  },
  {
    id: "resource-3",
    mediaSlug: "the-farm",
    provider: "quark",
    mode: "download",
    action: "report_invalid",
    createdAt: "2026-03-08T05:02:00Z",
  },
];

export const publicLists: PublicListRecord[] = [
  {
    id: "public-list-weekend-sci-fi",
    publicId: "lst_4wp7n1kg9zr",
    slug: "weekend-sci-fi-run",
    title: "Weekend Sci-Fi Run",
    description: "A minimal public list seed used to preserve list and list-item context in canonical watch URLs.",
    visibility: "public",
    discoveryRank: 1,
    shareTitle: "Weekend Sci-Fi Run",
    shareDescription: "A queue-ready sci-fi watchlist spanning a feature film, an anime episode, and a serial episode.",
    items: [
      {
        publicRef: "li_9m2rx4vc1ka",
        mediaSlug: "war-machine",
      },
      {
        publicRef: "li_2tb8q7hy5nu",
        mediaSlug: "prism-hearts",
        episodeSlug: "prism-hearts-s1e1",
      },
      {
        publicRef: "li_6qs3fd8jp4w",
        mediaSlug: "deep-space-ward",
        episodeSlug: "deep-space-ward-s1e1",
      },
    ],
  },
  {
    id: "public-list-atmosphere-files",
    publicId: "lst_8qh2x6md5sy",
    slug: "atmosphere-files",
    title: "Atmosphere Files",
    description: "Mystery-led picks for a slower queue, spanning investigation thrillers, haunted drama, and urban anime.",
    visibility: "public",
    discoveryRank: 2,
    shareTitle: "Atmosphere Files",
    shareDescription: "A public mystery list with three queue-friendly entries and canonical opaque list identity.",
    items: [
      {
        publicRef: "li_3xv7pa2me4c",
        mediaSlug: "glass-harbor",
      },
      {
        publicRef: "li_4zb8kt1ns6q",
        mediaSlug: "school-spirits-s1",
        episodeSlug: "school-spirits-s1e1",
      },
      {
        publicRef: "li_7hd5ru9cw2m",
        mediaSlug: "white-tower-notes",
        episodeSlug: "white-tower-notes-s1e1",
      },
    ],
  },
  {
    id: "public-list-night-shift-unlisted",
    publicId: "lst_5jc9nf2yr8d",
    slug: "night-shift-unlisted",
    title: "Night Shift Unlisted",
    description: "A quieter unlisted queue used to exercise share-ready list pages without putting every list into directory discovery.",
    visibility: "unlisted",
    discoveryRank: 4,
    shareTitle: "Night Shift Unlisted",
    shareDescription: "An unlisted public queue anchored on opaque list identity and list-aware watch links.",
    items: [
      {
        publicRef: "li_1mv3qk8pd7a",
        mediaSlug: "equator-storm-line",
      },
      {
        publicRef: "li_6ry4sb2tw9e",
        mediaSlug: "blue-coast-files",
        episodeSlug: "blue-coast-files-s1e2",
      },
      {
        publicRef: "li_8up1dz5fh3n",
        mediaSlug: "lunar-signal",
      },
    ],
  },
];
