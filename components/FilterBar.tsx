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
  chips?: Array<string | { label: string; href: string; active: boolean }>;
  activeChip?: string;
  hiddenFields?: Array<{ name: string; value: string }>;
};
export function FilterBar({ action, groups, hiddenFields = [] }: FilterBarProps) {
  return (
    <section className="filter-panel" aria-label="Catalog filters">
      {action ? (
        <form className="filter-bar filter-bar-form" action={action} method="get" aria-label="Filter controls">
          {hiddenFields.map((field) => (
            <input key={field.name} type="hidden" name={field.name} value={field.value} />
          ))}
          <div className="filter-control-row">
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
          </div>
        </form>
      ) : (
        <div className="filter-bar" aria-label="Filter controls">
          <div className="filter-control-row">
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
        </div>
      )}
    </section>
  );
}
