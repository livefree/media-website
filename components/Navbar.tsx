import Link from "next/link";

import type { CatalogScope } from "../types/media";

const navItems = [
  { label: "Home", href: "/", scope: "all" },
  { label: "Movie", href: "/movie", scope: "movie" },
  { label: "Series", href: "/series", scope: "series" },
  { label: "Anime", href: "/anime", scope: "anime" },
] as const;

export function Navbar({ activeScope }: { activeScope: CatalogScope }) {
  return (
    <header className="navbar">
      <div className="brand-lockup">
        <Link href="/" className="brand-mark" aria-label="Media Atlas home">
          MA
        </Link>
        <div>
          <p className="brand-name">Media Atlas</p>
          <p className="brand-tag">Poster-first catalog shell</p>
        </div>
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

      <div className="nav-actions">
        <span className="status-pill">Browse shell</span>
        <Link href="/search" className="nav-ghost nav-ghost-icon" aria-label="Open search">
          <span aria-hidden="true">/</span>
          <span>Search</span>
        </Link>
        <button type="button" className="nav-ghost">
          Sign in
        </button>
      </div>
    </header>
  );
}
