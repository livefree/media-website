import Link from "next/link";

import styles from "./admin-source-repair.module.css";

const sections = [
  {
    href: "/admin/catalog",
    id: "catalog",
    label: "Published catalog",
  },
  {
    href: "/admin/sources",
    id: "sources",
    label: "Source inventory",
  },
  {
    href: "/admin/repair",
    id: "repair",
    label: "Repair queue",
  },
  {
    href: "/admin/queue-failures",
    id: "queue-failures",
    label: "Queue failures",
  },
  {
    href: "/admin/recovery-readiness",
    id: "recovery-readiness",
    label: "Recovery readiness",
  },
  {
    href: "/admin/review",
    id: "review",
    label: "Review queue",
  },
  {
    href: "/admin/moderation",
    id: "moderation",
    label: "Moderation",
  },
  {
    href: "/admin/manual-titles",
    id: "manual-titles",
    label: "Manual titles",
  },
  {
    href: "/admin/manual-sources",
    id: "manual-sources",
    label: "Manual sources",
  },
] as const;

export function AdminOperatorNav({
  activeSection,
}: {
  activeSection:
    | "catalog"
    | "sources"
    | "repair"
    | "queue-failures"
    | "recovery-readiness"
    | "review"
    | "moderation"
    | "manual-titles"
    | "manual-sources";
}) {
  return (
    <nav aria-label="Admin workflow sections" className={styles.workflowNav}>
      {sections.map((section) => (
        <Link
          className={`${styles.workflowNavLink} ${section.id === activeSection ? styles.workflowNavLinkActive : ""}`}
          href={section.href}
          key={section.id}
        >
          {section.label}
        </Link>
      ))}
    </nav>
  );
}
