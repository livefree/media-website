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
        <span className="brand-name">Media Atlas</span>
        <span className="brand-tag">Catalog</span>
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
        <button type="button" className="nav-login">
          Log in
        </button>

        <form className="nav-search-form" action="/search" method="get" role="search">
          {hiddenFields.map((field) => (
            <input key={field.name} type="hidden" name={field.name} value={field.value} />
          ))}
          <input type="text" name="q" placeholder="Search titles..." aria-label="Search titles" />
          <button type="submit" className="nav-search-button" aria-label="Search">
            Go
          </button>
        </form>

        <Link href="/search" className="nav-mobile-search" aria-label="Open search">
          /
        </Link>
      </div>
    </header>
  );
}
