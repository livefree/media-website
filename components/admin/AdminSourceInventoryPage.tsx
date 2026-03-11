import Link from "next/link";

import styles from "./admin-source-repair.module.css";
import { AdminOperatorNav } from "./AdminOperatorNav";

import type { AdminSourceInventoryPageRecord, AdminSourceInventorySummary } from "../../lib/server/admin";

interface SourceInventorySearchState {
  q: string;
  kind: string;
  health: string;
  status: string;
  includeInactive: boolean;
  includePrivate: boolean;
}

const summaryOrder: Array<{ key: keyof AdminSourceInventorySummary; label: string }> = [
  { key: "totalItems", label: "Resources" },
  { key: "activeItems", label: "Active" },
  { key: "inactiveItems", label: "Inactive" },
  { key: "publicItems", label: "Public" },
  { key: "unhealthyItems", label: "Unhealthy" },
  { key: "openRepairItems", label: "With open repair" },
];

const healthClassNames: Record<string, string> = {
  healthy: styles.healthHealthy,
  degraded: styles.healthDegraded,
  broken: styles.healthBroken,
  replaced: styles.healthReplaced,
  offline: styles.healthOffline,
};

const availabilityClassNames: Record<string, string> = {
  online: styles.statusResolved,
  degraded: styles.healthDegraded,
  offline: styles.healthOffline,
  reported: styles.statusWaiting,
  pending: styles.statusOpen,
};

function formatDate(value?: Date | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function getSummary(summary?: AdminSourceInventorySummary) {
  return (
    summary ?? {
      totalItems: 0,
      activeItems: 0,
      inactiveItems: 0,
      publicItems: 0,
      privateItems: 0,
      unhealthyItems: 0,
      openRepairItems: 0,
    }
  );
}

export function AdminSourceInventoryPage({
  page,
  errorMessage,
  searchState,
}: {
  page?: AdminSourceInventoryPageRecord;
  errorMessage?: string;
  searchState: SourceInventorySearchState;
}) {
  const summary = getSummary(page?.summary);
  const items = page?.items ?? [];

  return (
    <main className={styles.opsPage}>
      <div className={styles.opsShell}>
        <AdminOperatorNav activeSection="sources" />

        <header className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Operator Console</p>
            <h1 className={styles.pageTitle}>{page?.title ?? "Source Inventory"}</h1>
            <p className={styles.pageSubtitle}>
              {page?.description ??
                "Inspect published source routing, provider attribution, and health state through the backend inventory boundary."}
            </p>
          </div>
          <div className={styles.summaryGrid}>
            {summaryOrder.map((metric) => (
              <div className={styles.metricCard} key={metric.key}>
                <span className={styles.metricValue}>{summary[metric.key]}</span>
                <span className={styles.metricLabel}>{metric.label}</span>
              </div>
            ))}
          </div>
        </header>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Inventory Filters</h2>
              <p className={styles.panelSubtitle}>
                Query source records by title, provider, resource kind, health, and visibility flags without route-local mock state.
              </p>
            </div>
            <Link className={styles.secondaryLink} href="/admin/sources">
              Clear filters
            </Link>
          </div>

          <form action="/admin/sources" className={styles.filterForm} method="get">
            <label className={styles.fieldLabel}>
              Search
              <input className={styles.fieldInput} defaultValue={searchState.q} name="q" placeholder="Title, episode, provider, or label" />
            </label>

            <label className={styles.fieldLabel}>
              Kind
              <select className={styles.fieldInput} defaultValue={searchState.kind} name="kind">
                <option value="">All kinds</option>
                <option value="stream">Stream</option>
                <option value="download">Download</option>
                <option value="subtitle">Subtitle</option>
                <option value="trailer">Trailer</option>
              </select>
            </label>

            <label className={styles.fieldLabel}>
              Health state
              <select className={styles.fieldInput} defaultValue={searchState.health} name="health">
                <option value="">All health states</option>
                <option value="healthy">Healthy</option>
                <option value="degraded">Degraded</option>
                <option value="broken">Broken</option>
                <option value="replaced">Replaced</option>
                <option value="offline">Offline</option>
              </select>
            </label>

            <label className={styles.fieldLabel}>
              Availability
              <select className={styles.fieldInput} defaultValue={searchState.status} name="status">
                <option value="">All statuses</option>
                <option value="online">Online</option>
                <option value="degraded">Degraded</option>
                <option value="offline">Offline</option>
                <option value="reported">Reported</option>
                <option value="pending">Pending</option>
              </select>
            </label>

            <div className={styles.filterToggleRow}>
              <label className={styles.toggleLabel}>
                <input defaultChecked={searchState.includeInactive} name="includeInactive" type="checkbox" value="1" />
                Include inactive
              </label>
              <label className={styles.toggleLabel}>
                <input defaultChecked={searchState.includePrivate} name="includePrivate" type="checkbox" value="1" />
                Include private
              </label>
            </div>

            <div className={styles.filterActions}>
              <button className={styles.primaryButton} type="submit">
                Apply filters
              </button>
            </div>
          </form>
        </section>

        {errorMessage ? <div className={styles.warningState}>{errorMessage}</div> : null}

        {!errorMessage && items.length === 0 ? (
          <div className={styles.emptyState}>No source inventory rows matched the current filters.</div>
        ) : null}

        {!errorMessage && items.length > 0 ? (
          <section className={styles.inventoryTable} aria-label="Source inventory">
            <div className={`${styles.inventoryRow} ${styles.inventoryHeader}`} aria-hidden="true">
              <span>Title</span>
              <span>Source</span>
              <span>Routing</span>
              <span>Health</span>
              <span>Repair</span>
            </div>

            {items.map((item) => (
              <article className={styles.inventoryRow} key={item.id}>
                <div className={styles.inventoryCell}>
                  <h3 className={styles.cardTitle}>{item.mediaTitle}</h3>
                  <p className={styles.cardMeta}>{item.episodeLabel ?? "Applies to the title-level resource set"}</p>
                  <div className={styles.inlineLinks}>
                    <Link className={styles.secondaryLink} href={`/media/${item.mediaSlug}`}>
                      View title
                    </Link>
                    <span className={styles.inlineText}>{item.mediaPublicId}</span>
                  </div>
                </div>

                <div className={styles.inventoryCell}>
                  <p className={styles.cellLead}>{item.label}</p>
                  <p className={styles.cardMeta}>
                    {item.kind} · {item.format}
                    {item.quality ? ` · ${item.quality}` : ""}
                  </p>
                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>{item.providerDisplayName ?? item.providerAdapterKey ?? item.provider}</span>
                    <span className={styles.badge}>{item.isPublic ? "public" : "private"}</span>
                    <span className={styles.badge}>{item.isActive ? "active" : "inactive"}</span>
                  </div>
                </div>

                <div className={styles.inventoryCell}>
                  <p className={styles.cellLead}>Priority {item.priority}</p>
                  <p className={styles.cardMeta}>
                    Mirror {item.mirrorOrder} · preferred {item.isPreferred ? "yes" : "no"} · {item.orderingOrigin}
                  </p>
                  {item.replacementPublicId ? <p className={styles.cardMeta}>Replacement target {item.replacementPublicId}</p> : null}
                </div>

                <div className={styles.inventoryCell}>
                  <div className={styles.badgeRow}>
                    <span className={`${styles.badge} ${healthClassNames[item.healthState] ?? ""}`}>{item.healthState}</span>
                    <span className={`${styles.badge} ${availabilityClassNames[item.status] ?? ""}`}>{item.status}</span>
                  </div>
                  <p className={styles.cardSummary}>{item.healthSummary ?? "No active health summary."}</p>
                  <p className={styles.cardMeta}>Checked {formatDate(item.lastCheckedAt)} · last healthy {formatDate(item.lastHealthyAt)}</p>
                </div>

                <div className={styles.inventoryCell}>
                  <p className={styles.cellLead}>{item.repairOpenCount} open repair entries</p>
                  <p className={styles.cardMeta}>Failures observed {item.failureCount}</p>
                  <div className={styles.inlineLinks}>
                    <Link className={styles.secondaryLink} href={`/admin/repair?q=${encodeURIComponent(item.mediaTitle)}`}>
                      Open queue
                    </Link>
                    <span className={styles.inlineText}>{formatDate(item.updatedAt)}</span>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
