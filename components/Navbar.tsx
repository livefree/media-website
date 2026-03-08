import Link from "next/link";

import type { CatalogScope } from "../types/media";

const navItems = [
  { label: "Home", href: "/", scope: "all" },
  { label: "Movie", href: "/movie", scope: "movie" },
  { label: "Series", href: "/series", scope: "series" },
  { label: "Anime", href: "/anime", scope: "anime" },
] as const;

export function Navbar({
  activeScope,
  hiddenFields = [],
}: {
  activeScope: CatalogScope;
  hiddenFields?: Array<{ name: string; value: string }>;
}) {
  return (
    <header className="navbar">
      <Link href="/" className="brand-name-link" aria-label="Media Atlas home">
        <span className="brand-mark" aria-hidden="true">
          MA
        </span>
        <span className="brand-copy">
          <span className="brand-name">Media Atlas</span>
          <span className="brand-tag">Streaming catalog</span>
        </span>
      </Link>

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
        <form className="nav-search-form" action="/search" method="get" role="search">
          {hiddenFields.map((field) => (
            <input key={field.name} type="hidden" name={field.name} value={field.value} />
          ))}
          <input type="text" name="q" placeholder="Search titles..." aria-label="Search titles" />
          <button type="submit" className="nav-search-button" aria-label="Search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>

        <button type="button" className="nav-login">
          Sign in
        </button>

        <Link href="/search" className="nav-mobile-search" aria-label="Open search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
