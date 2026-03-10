import Link from "next/link";

import { buildPublicListDirectoryHref } from "../lib/media-utils";
import type { CatalogScope } from "../types/media";

const navItems = [
  { label: "Home", href: "/", scope: "all" },
  { label: "Movie", href: "/movie", scope: "movie" },
  { label: "Series", href: "/series", scope: "series" },
  { label: "Anime", href: "/anime", scope: "anime" },
  { label: "Lists", href: buildPublicListDirectoryHref() },
] as const;

export function Navbar({
  activeScope,
  activeHref,
  hiddenFields = [],
}: {
  activeScope: CatalogScope;
  activeHref?: string;
  hiddenFields?: Array<{ name: string; value: string }>;
}) {
  const resolvedNavItems = navItems.map((item) => ({
    ...item,
    isActive: activeHref ? activeHref === item.href : "scope" in item && activeScope === item.scope,
  }));

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
        {resolvedNavItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="nav-link"
            data-active={item.isActive ? "true" : "false"}
            aria-current={item.isActive ? "page" : undefined}
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
