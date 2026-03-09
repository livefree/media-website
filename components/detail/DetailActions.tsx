import Link from "next/link";

import styles from "./detail-page.module.css";

export function DetailActions({
  shareHref,
  copyHref,
  availabilityLabel,
}: {
  shareHref: string;
  copyHref: string;
  availabilityLabel: string;
}) {
  return (
    <div className={styles.actionCluster}>
      <div className={styles.actionRow}>
        <Link href={shareHref} className={styles.shareButton}>
          <span aria-hidden="true">⤴</span>
          <span>分享</span>
        </Link>
        <Link href={copyHref} target="_blank" rel="noreferrer" className={styles.detailGhostAction}>
          复制链接
        </Link>
        <button type="button" className={styles.detailGhostAction}>
          收藏
        </button>
      </div>

      <div className={styles.statsRow}>
        <span className={styles.subtleStat}>{availabilityLabel}</span>
      </div>
    </div>
  );
}
