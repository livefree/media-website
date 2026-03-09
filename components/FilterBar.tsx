"use client";

import { startTransition, useRef } from "react";
import { useRouter } from "next/navigation";

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
  hiddenFields?: Array<{ name: string; value: string }>;
  typeRoutes?: Partial<Record<FilterOption["value"] | "all", string>>;
};

function normalizeQueryParams(formData: FormData, keepTypeParam: boolean) {
  const params = new URLSearchParams();

  for (const [name, rawValue] of formData.entries()) {
    const value = typeof rawValue === "string" ? rawValue.trim() : "";

    if (!value) {
      continue;
    }

    if (name === "page") {
      continue;
    }

    if (name === "sort" && value === "latest") {
      continue;
    }

    if (name === "type") {
      if (!keepTypeParam || value === "all") {
        continue;
      }
    }

    params.set(name, value);
  }

  return params;
}

export function FilterBar({ action, groups, hiddenFields = [], typeRoutes }: FilterBarProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement | null>(null);

  function handleLiveChange() {
    if (!action || !formRef.current) {
      return;
    }

    const formData = new FormData(formRef.current);
    const nextTypeValue = (formData.get("type")?.toString() ?? "all") as FilterOption["value"] | "all";
    const nextPath = typeRoutes?.[nextTypeValue] ?? action;
    const params = normalizeQueryParams(formData, !typeRoutes);
    const href = params.toString() ? `${nextPath}?${params.toString()}` : nextPath;

    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  return (
    <section className="filter-panel" aria-label="Catalog filters">
      {action ? (
        <form ref={formRef} className="filter-bar filter-bar-form" action={action} method="get" aria-label="Filter controls">
          {hiddenFields.map((field) => (
            <input key={field.name} type="hidden" name={field.name} value={field.value} />
          ))}
          <div className="filter-control-row">
            {groups.map((group) => (
              <label key={group.label} className="filter-control">
                <span className="filter-label">{group.label}</span>
                {group.options && group.name ? (
                  <span className="filter-select-shell">
                    <select
                      key={`${group.name}-${group.value || "empty"}`}
                      className="filter-select"
                      name={group.name}
                      defaultValue={group.value}
                      aria-label={group.label}
                      onChange={handleLiveChange}
                    >
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
