import type { Metadata } from "next";

import { PublicListDirectoryPageShell } from "../../components/PublicListDirectoryPageShell";
import { getPublicListDirectory } from "../../lib/media-catalog";

export function generateMetadata(): Metadata {
  const directory = getPublicListDirectory();

  return {
    title: directory.title,
    description: directory.description,
    alternates: {
      canonical: directory.canonicalDirectoryHref,
    },
  };
}

export default function PublicListDirectoryPage() {
  const directory = getPublicListDirectory();

  return <PublicListDirectoryPageShell directory={directory} />;
}
