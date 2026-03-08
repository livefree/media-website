type FilterGroup = {
  label: string;
  value: string;
};

type FilterBarProps = {
  groups: FilterGroup[];
  chips: string[];
  activeChip: string;
};

export function FilterBar({ groups, chips, activeChip }: FilterBarProps) {
  return (
    <section className="filter-panel" aria-label="Catalog filters">
      <div className="filter-chip-row" role="toolbar" aria-label="Quick filters">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            className="filter-chip"
            data-active={chip === activeChip ? "true" : "false"}
            aria-pressed={chip === activeChip}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="filter-bar" aria-label="Filter controls">
        {groups.map((group) => (
          <div key={group.label} className="filter-control">
            <span className="filter-label">{group.label}</span>
            <button type="button" className="filter-select" aria-label={`${group.label}: ${group.value}`}>
              <span>{group.value}</span>
              <span className="filter-caret" aria-hidden="true">
                /
              </span>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
