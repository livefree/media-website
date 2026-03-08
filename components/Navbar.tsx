import Link from "next/link";

import type { CatalogScope, SearchSuggestion } from "../types/media";

const navItems = [
  { label: "Home", href: "/", scope: "all" },
  { label: "Movie", href: "/movie", scope: "movie" },
  { label: "Series", href: "/series", scope: "series" },
  { label: "Anime", href: "/anime", scope: "anime" },
] as const;

function buildSearchHref(query: string, hiddenFields: Array<{ name: string; value: string }>) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  hiddenFields.forEach((field) => {
    params.set(field.name, field.value);
  });

  const suffix = params.toString();
  return suffix ? `/search?${suffix}` : "/search";
}

function getTypeLabel(type: SearchSuggestion["type"]) {
  if (type === "movie") {
    return "Movie";
  }

  if (type === "series") {
    return "Series";
  }

  return "Anime";
}

export function Navbar({
  activeScope,
  hotSearches = [],
  hiddenFields = [],
}: {
  activeScope: CatalogScope;
  hotSearches?: SearchSuggestion[];
  hiddenFields?: Array<{ name: string; value: string }>;
}) {
  return (
    <header className="navbar">
      <div className="brand-lockup">
        <Link href="/" className="brand-name-link" aria-label="Media Atlas home">
          <span className="brand-mark">MA</span>
          <span>
            <span className="brand-name">Media Atlas</span>
            <span className="brand-tag">Streaming catalog</span>
          </span>
        </Link>
      </div>

      <nav className="nav-menu" aria-label="Primary">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="nav-link"
            data-active={activeScope === item.scope ? "true" : "false"}
            aria-current={activeScope === item.scope ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="nav-tools">
        <div className="nav-search-shell">
          <form className="nav-search-form" action="/search" method="get" role="search">
            {hiddenFields.map((field) => (
              <input key={field.name} type="hidden" name={field.name} value={field.value} />
            ))}
            <input type="text" name="q" placeholder="Search titles..." aria-label="Search titles" />
            <button type="submit" className="nav-search-button" aria-label="Search">
              /
            </button>
          </form>

          {hotSearches.length > 0 ? (
            <div className="nav-search-dropdown" aria-label="Hot searches">
              <p className="nav-search-dropdown-label">Hot this week</p>
              <ul className="nav-search-list">
                {hotSearches.map((item) => (
                  <li key={item.slug}>
                    <Link href={buildSearchHref(item.title, hiddenFields)} className="nav-search-item">
                      <span className="nav-search-item-title">{item.title}</span>
                      <span className="nav-search-item-meta">
                        {getTypeLabel(item.type)} · {item.year}
                        {typeof item.rating === "number" ? ` · ${item.rating.toFixed(1)}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <Link href="/search" className="nav-mobile-search" aria-label="Open search">
          /
        </Link>
        <button type="button" className="nav-ghost">
          Sign in
        </button>
      </div>
    </header>
  );
}
