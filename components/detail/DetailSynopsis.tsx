import styles from "./detail-page.module.css";

export function DetailSynopsis({ synopsis }: { synopsis: string }) {
  return (
    <section className={styles.contentCard} aria-labelledby="detail-synopsis-title">
      <h2 id="detail-synopsis-title" className={styles.sectionHeading}>
        剧情介绍
      </h2>
      <div className={styles.sectionDivider} />
      <p className={styles.synopsisCopy}>{synopsis}</p>
    </section>
  );
}
