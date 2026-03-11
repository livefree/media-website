import Link from "next/link";

import styles from "./admin-source-repair.module.css";

const sections = [
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
    href: "/admin/review",
    id: "review",
    label: "Review queue",
  },
] as const;

export function AdminOperatorNav({
  activeSection,
}: {
  activeSection: "sources" | "repair" | "review";
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
