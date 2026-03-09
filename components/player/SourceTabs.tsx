import Link from "next/link";

import styles from "../detail/detail-page.module.css";

type SourceTab = {
  id: string;
  label: string;
  providerLabel: string;
  quality?: string;
  format: string;
  status: string;
  href: string;
  isActive: boolean;
};

export function SourceTabs({ tabs }: { tabs: SourceTab[] }) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <section className={styles.selectorBlock} aria-labelledby="source-selector-title">
      <div className={styles.selectorLabelRow}>
        <span id="source-selector-title" className={styles.selectorLabel}>
          播放源：
        </span>
      </div>

      <div className={styles.selectorTabs} aria-label="Playback sources">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            scroll={false}
            className={`${styles.selectorButton} ${tab.isActive ? styles.selectorButtonActive : ""}`}
            aria-current={tab.isActive ? "page" : undefined}
          >
            {tab.label}
            {tab.quality ? ` (${tab.quality})` : ""}
          </Link>
        ))}
      </div>
    </section>
  );
}
