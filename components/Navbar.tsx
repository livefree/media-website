const navItems = [
  { label: "Home", active: true },
  { label: "Movies", active: false },
  { label: "Series", active: false },
  { label: "Variety", active: false },
  { label: "Anime", active: false },
  { label: "Collections", active: false },
];

export function Navbar() {
  return (
    <header className="navbar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          MA
        </span>
        <div>
          <p className="brand-name">Media Atlas</p>
          <p className="brand-tag">Poster-first catalog shell</p>
        </div>
      </div>

      <nav className="nav-menu" aria-label="Primary">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            className="nav-link"
            data-active={item.active ? "true" : "false"}
            aria-current={item.active ? "page" : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="nav-actions">
        <span className="status-pill">UI Shell</span>
        <button type="button" className="nav-ghost">
          Sign in
        </button>
      </div>
    </header>
  );
}
