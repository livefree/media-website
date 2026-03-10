import Link from "next/link";

import type { PublicMediaListItem, PublicMediaListPageRecord } from "../../types/media";
import styles from "./detail-page.module.css";

export function ListContextPanel({
  list,
  activeItem,
  canonicalWatchHref,
}: {
  list: PublicMediaListPageRecord;
  activeItem?: PublicMediaListItem;
  canonicalWatchHref: string;
}) {
  const listPositionLabel = activeItem ? `第 ${activeItem.position} / ${list.itemCount} 项` : `${list.itemCount} 项公开条目`;

  return (
    <section className={styles.contentCard} aria-labelledby="list-context-title">
      <div className={styles.listContextHeader}>
        <div className={styles.listContextCopy}>
          <div className={styles.listContextEyebrowRow}>
            <span className={styles.listContextEyebrow}>列表播放上下文</span>
            <span className={styles.listContextBadge}>{list.visibility === "public" ? "公开列表" : "未列出"}</span>
          </div>

          <h2 id="list-context-title" className={styles.sectionHeading}>
            {list.title}
          </h2>
          <p className={styles.listContextDescription}>{list.description}</p>
        </div>

        <div className={styles.listContextMeta}>
          <span className={styles.listContextMetaValue}>{listPositionLabel}</span>
          <Link href={list.canonicalListHref} className={styles.listContextLink}>
            查看完整列表
          </Link>
        </div>
      </div>

      {activeItem ? (
        <div className={styles.listContextBody}>
          <div className={styles.listContextActiveItem}>
            <p className={styles.listContextLabel}>当前条目</p>
            <h3 className={styles.listContextItemTitle}>{activeItem.title}</h3>
            <p className={styles.listContextItemSubtitle}>{activeItem.subtitle}</p>
            <Link href={canonicalWatchHref} className={styles.listContextCurrentLink}>
              当前条目链接
            </Link>
          </div>

          <div className={styles.listContextNavRow}>
            {activeItem.previousItem ? (
              <Link href={activeItem.previousItem.canonicalWatchHref} className={styles.listContextNavButton}>
                <span className={styles.listContextNavDirection}>上一项</span>
                <span>{activeItem.previousItem.position}. {activeItem.previousItem.title}</span>
              </Link>
            ) : (
              <div className={`${styles.listContextNavButton} ${styles.listContextNavButtonDisabled}`}>
                <span className={styles.listContextNavDirection}>上一项</span>
                <span>已到列表开头</span>
              </div>
            )}

            {activeItem.nextItem ? (
              <Link href={activeItem.nextItem.canonicalWatchHref} className={styles.listContextNavButton}>
                <span className={styles.listContextNavDirection}>下一项</span>
                <span>{activeItem.nextItem.position}. {activeItem.nextItem.title}</span>
              </Link>
            ) : (
              <div className={`${styles.listContextNavButton} ${styles.listContextNavButtonDisabled}`}>
                <span className={styles.listContextNavDirection}>下一项</span>
                <span>已到列表结尾</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.listContextBody}>
          <p className={styles.listContextFallback}>
            当前播放已保留该公开列表上下文，但未能定位到明确的列表条目。后续源切换、资源切换和当前条目内的选集切换仍会保留 `list` / `li`。
          </p>
        </div>
      )}
    </section>
  );
}
