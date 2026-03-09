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
    <section className={styles.contentCard} aria-labelledby="download-resources-title">
      <h2 id="download-resources-title" className={styles.sectionHeading}>
        网盘资源
      </h2>

      {providerTabs.length > 0 ? (
        <div className={styles.providerTabs}>
          {providerTabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              scroll={false}
              className={`${styles.providerTab} ${tab.isActive ? styles.providerTabActive : ""}`}
              aria-current={tab.isActive ? "page" : undefined}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      ) : null}

      {resources.length > 0 ? (
        <div className={styles.downloadPanel}>
          {resources.map((resource) => (
            <article key={resource.id} className={styles.resourceRow}>
              <div className={styles.resourceTopRow}>
                <div className={styles.resourceMetaCluster}>
                  <span className={styles.resourceMeta}>{resource.quality ?? resource.format.toUpperCase()}</span>
                  <span className={styles.resourceMeta}>
                    {typeof resource.reportCount === "number" ? `${resource.reportCount}次失效反馈` : "0次失效反馈"}
                  </span>
                </div>
              </div>

              <div className={styles.resourceLinkRow}>
                <span className={styles.resourceUrl}>{resource.maskedUrl ?? resource.url}</span>
              </div>

              <div className={styles.resourceButtonRow}>
                <Link
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`${styles.resourceButton} ${styles.resourceButtonBlue}`}
                >
                  查看
                </Link>
                <button type="button" className={`${styles.resourceButton} ${styles.resourceButtonPurple}`}>
                  扫码
                </button>
                <button type="button" className={`${styles.resourceButton} ${styles.resourceButtonGreen}`}>
                  一键复制
                </button>
                <button type="button" className={`${styles.resourceButton} ${styles.resourceButtonRed}`}>
                  反馈失效
                </button>
              </div>

              {resource.accessCode ? <p className={styles.accessCode}>提取码：{resource.accessCode}</p> : null}
              {activeEpisode ? <p className={styles.downloadHint}>{activeEpisode.title}</p> : null}
              <p className={styles.downloadHint}>{formatResourceMeta(resource)}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.downloadsEmpty}>当前筛选下没有可用网盘资源。</div>
      )}

      <div className={styles.downloadSearchBar}>
        <div className={styles.downloadSearchLine} />
        <div className={styles.downloadSearchCopy}>
          <span>资源都失效了？</span>
          <button type="button" className={styles.searchNetdiskButton}>
            搜索网盘资源
          </button>
        </div>
        <div className={styles.downloadSearchLine} />
      </div>
    </section>
  );
}
