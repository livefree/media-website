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
    <div className={styles.sourceTabs} aria-label="Playback sources">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`${styles.sourceTab} ${tab.isActive ? styles.sourceTabActive : ""}`}
          aria-current={tab.isActive ? "page" : undefined}
        >
          <span className={styles.tabCopy}>
            <span>{tab.label}</span>
            <span className={styles.tabMeta}>
              {tab.providerLabel} · {tab.quality ?? tab.format.toUpperCase()} · {tab.status}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
