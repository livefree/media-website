import Link from "next/link";

type FilterOption = {
  value: string;
  label: string;
};

type FilterGroup = {
  label: string;
  value: string;
  name?: string;
  options?: FilterOption[];
};

type FilterBarProps = {
  action?: string;
  groups: FilterGroup[];
  chips: Array<string | { label: string; href: string; active: boolean }>;
  activeChip?: string;
  hiddenFields?: Array<{ name: string; value: string }>;
};

function isLinkChip(chip: FilterBarProps["chips"][number]): chip is { label: string; href: string; active: boolean } {
  return typeof chip !== "string";
}

export function FilterBar({ action, groups, chips, activeChip, hiddenFields = [] }: FilterBarProps) {
  return (
    <section className="filter-panel" aria-label="Catalog filters">
      <div className="filter-chip-row" role="toolbar" aria-label="Quick filters">
        {chips.map((chip) => (
          isLinkChip(chip) ? (
            <Link key={chip.label} href={chip.href} className="filter-chip" data-active={chip.active ? "true" : "false"}>
              {chip.label}
            </Link>
          ) : (
            <button
              key={chip}
              type="button"
              className="filter-chip"
              data-active={chip === activeChip ? "true" : "false"}
              aria-pressed={chip === activeChip}
            >
              {chip}
            </button>
          )
        ))}
      </div>

      {action ? (
        <form className="filter-bar filter-bar-form" action={action} method="get" aria-label="Filter controls">
          {hiddenFields.map((field) => (
            <input key={field.name} type="hidden" name={field.name} value={field.value} />
          ))}
          {groups.map((group) => (
            <label key={group.label} className="filter-control">
              <span className="filter-label">{group.label}</span>
              {group.options && group.name ? (
                <span className="filter-select-shell">
                  <select className="filter-select" name={group.name} defaultValue={group.value} aria-label={group.label}>
                    {group.options.map((option) => (
                      <option key={`${group.label}-${option.value || "empty"}`} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="filter-caret" aria-hidden="true">
                    /
                  </span>
                </span>
              ) : (
                <span className="filter-select" aria-label={`${group.label}: ${group.value}`}>
                  <span>{group.value}</span>
                  <span className="filter-caret" aria-hidden="true">
                    /
                  </span>
                </span>
              )}
            </label>
          ))}
          <button type="submit" className="filter-apply-button">
            Apply
          </button>
        </form>
      ) : (
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
      )}
    </section>
  );
}
