import Link from "next/link";

import type { PublicListQueueRecord, PublicMediaListItem, PublicMediaListPageRecord } from "../../types/media";
import styles from "./detail-page.module.css";

function getQueueWindow(queue: PublicListQueueRecord) {
  if (queue.items.length <= 5) {
    return queue.items;
  }

  const currentIndex = queue.currentItem ? queue.items.findIndex((item) => item.publicRef === queue.currentItem?.publicRef) : -1;
  if (currentIndex < 0) {
    return queue.items.slice(0, 5);
  }

  const start = Math.max(0, Math.min(currentIndex - 1, queue.items.length - 5));
  return queue.items.slice(start, start + 5);
}

export function ListQueuePanel({
  list,
  activeItem,
  queue,
  canonicalWatchHref,
}: {
  list: PublicMediaListPageRecord;
  activeItem?: PublicMediaListItem;
  queue?: PublicListQueueRecord;
  canonicalWatchHref: string;
}) {
  const queueWindow = queue ? getQueueWindow(queue) : [];
  const currentQueueItem = queue?.currentItem;
  const currentItem = activeItem ?? undefined;
  const positionLabel = currentItem ? `第 ${currentItem.position} / ${list.itemCount} 项` : list.itemCountLabel;

  return (
    <section className={styles.contentCard} aria-labelledby="list-queue-title">
      <div className={styles.listContextHeader}>
        <div className={styles.listContextCopy}>
          <div className={styles.listContextEyebrowRow}>
            <span className={styles.listContextEyebrow}>公开列表队列</span>
            <span className={styles.listContextBadge}>{list.visibility === "public" ? "公开列表" : "未列出"}</span>
          </div>

          <h2 id="list-queue-title" className={styles.sectionHeading}>
            {list.title}
          </h2>
          <p className={styles.listContextDescription}>{list.description}</p>
        </div>

        <div className={styles.listContextMeta}>
          <span className={styles.listContextMetaValue}>{positionLabel}</span>
          <span className={styles.listContextMetaSubtle}>{queue?.totalItemsLabel ?? list.itemCountLabel}</span>
          <Link href={list.canonicalListHref} className={styles.listContextLink}>
            查看完整列表
          </Link>
        </div>
      </div>

      {currentItem && currentQueueItem ? (
        <div className={styles.listQueueLayout}>
          <div className={styles.listQueueCurrentCard}>
            <p className={styles.listContextLabel}>当前队列条目</p>
            <div className={styles.listQueueCurrentRow}>
              <div
                className={styles.listQueuePoster}
                style={{ backgroundImage: `linear-gradient(180deg, rgba(15,20,30,0.08), rgba(15,20,30,0.72)), url(${currentQueueItem.posterUrl})` }}
                aria-hidden="true"
              />

              <div className={styles.listQueueCurrentCopy}>
                <div className={styles.listQueueCurrentMeta}>
                  <span className={styles.listQueueCurrentBadge}>正在播放</span>
                  <span className={styles.listQueueCurrentPosition}>{currentQueueItem.positionLabel}</span>
                </div>
                <h3 className={styles.listContextItemTitle}>{currentItem.title}</h3>
                <p className={styles.listContextItemSubtitle}>{currentItem.subtitle}</p>
                <Link href={canonicalWatchHref} className={styles.listContextCurrentLink}>
                  当前条目链接
                </Link>
              </div>
            </div>

            {queue.nextItem ? (
              <div className={styles.listQueueUpNext}>
                <span className={styles.listQueueUpNextLabel}>即将播放</span>
                <Link href={queue.nextItem.canonicalWatchHref} className={styles.listQueueUpNextLink}>
                  <span className={styles.listQueueUpNextPosition}>{queue.nextItem.positionLabel}</span>
                  <span>{queue.nextItem.title}</span>
                </Link>
              </div>
            ) : null}
          </div>

          <div className={styles.listQueuePanel}>
            <div className={styles.listQueuePanelHeader}>
              <p className={styles.listContextLabel}>播放队列</p>
              <span className={styles.listQueuePanelHint}>可直接切换到附近条目</span>
            </div>

            <div className={styles.listQueueItems} role="list">
              {queueWindow.map((item) => (
                <Link
                  key={item.publicRef}
                  href={item.canonicalWatchHref}
                  className={`${styles.listQueueItem} ${item.isCurrent ? styles.listQueueItemCurrent : ""}`}
                  aria-current={item.isCurrent ? "true" : undefined}
                >
                  <span className={styles.listQueueItemPosition}>{item.positionLabel}</span>
                  <span className={styles.listQueueItemBody}>
                    <span className={styles.listQueueItemTitleRow}>
                      <span className={styles.listQueueItemTitle}>{item.title}</span>
                      {item.isCurrent ? <span className={styles.listQueueItemBadge}>当前</span> : null}
                      {!item.isCurrent && item.isUpNext ? <span className={styles.listQueueItemBadgeMuted}>下一批</span> : null}
                    </span>
                    <span className={styles.listQueueItemSubtitle}>{item.subtitle}</span>
                  </span>
                </Link>
              ))}
            </div>

            {queue.upcomingItems.length > 0 ? (
              <div className={styles.listQueueUpcoming}>
                <span className={styles.listQueueUpcomingLabel}>后续条目</span>
                <div className={styles.listQueueUpcomingRow}>
                  {queue.upcomingItems.map((item) => (
                    <Link key={item.publicRef} href={item.canonicalWatchHref} className={styles.listQueueUpcomingChip}>
                      {item.position}. {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
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
