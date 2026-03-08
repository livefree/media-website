import styles from "./detail-page.module.css";

export function DetailSynopsis({ synopsis, tagline }: { synopsis: string; tagline: string }) {
  return (
    <section className={styles.synopsisCard} aria-labelledby="detail-synopsis-title">
      <p className={styles.sectionEyebrow}>Synopsis</p>
      <h2 id="detail-synopsis-title" className={styles.sectionTitle}>
        Long-form copy and premise overview.
      </h2>
      <p className={styles.synopsisLead}>{tagline}</p>
      <p className={styles.synopsisCopy}>{synopsis}</p>
    </section>
  );
}
