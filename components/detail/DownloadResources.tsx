import Link from "next/link";

import type { DownloadResourceOption, MediaEpisodeOption } from "../../types/media";
import styles from "./detail-page.module.css";

type ProviderTab = {
  id: string;
  label: string;
  href: string;
  isActive: boolean;
};

function formatResourceMeta(resource: DownloadResourceOption) {
  const parts = [resource.quality, resource.format.toUpperCase(), resource.status];

  if (resource.episodeTitle) {
    parts.unshift(resource.episodeTitle);
  }

  return parts.filter(Boolean).join(" · ");
}

export function DownloadResources({
  activeEpisode,
  providerTabs,
  resources,
}: {
  activeEpisode?: MediaEpisodeOption;
  providerTabs: ProviderTab[];
  resources: DownloadResourceOption[];
}) {
  return (
    <section className={styles.downloadsCard} aria-labelledby="download-resources-title">
      <div className={styles.downloadsHeader}>
        <p className={styles.sectionEyebrow}>Download resources</p>
        <h2 id="download-resources-title" className={styles.sectionTitle}>
          Provider-grouped mirrors and direct resource actions.
        </h2>
        <p className={styles.downloadHint}>
          {activeEpisode
            ? `Showing title-level mirrors plus resources for ${activeEpisode.title}.`
            : "Showing title-level mirrors across the current media entry."}
        </p>
      </div>

      {providerTabs.length > 0 ? (
        <div className={styles.providerTabRow}>
          {providerTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`${styles.providerTab} ${tab.isActive ? styles.providerTabActive : ""}`}
              aria-current={tab.isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      ) : null}

      {resources.length > 0 ? (
        <div className={styles.downloadList}>
          {resources.map((resource) => (
            <article key={resource.id} className={styles.resourceRow}>
              <div className={styles.resourceHeading}>
                <div className={styles.resourceCopy}>
                  <h3 className={styles.resourceTitle}>{resource.label}</h3>
                  <p className={styles.resourceMeta}>{formatResourceMeta(resource)}</p>
                  <p className={styles.resourceMeta}>{resource.maskedUrl ?? resource.url}</p>
                  {resource.accessCode ? <p className={styles.resourceMeta}>Access code: {resource.accessCode}</p> : null}
                  {typeof resource.reportCount === "number" ? (
                    <p className={styles.resourceMeta}>Reports: {resource.reportCount}</p>
                  ) : null}
                </div>

                <span className={styles.resourceStatus}>{resource.providerLabel}</span>
              </div>

              <div className={styles.resourceActions}>
                <Link
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`${styles.resourceAction} ${styles.resourceActionPrimary}`}
                >
                  Open resource
                </Link>
                <span className={styles.resourceAction}>{resource.status}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.downloadsEmpty}>
          No download resources are available for the current provider or episode selection yet.
        </div>
      )}
    </section>
  );
}
