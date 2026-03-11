import type { Metadata } from "next";

import { PublicListDirectoryPageShell } from "../../components/PublicListDirectoryPageShell";
import { getPublishedCatalogListDirectory } from "../../lib/server/catalog/service";
import { isBackendError } from "../../lib/server/errors";

export const dynamic = "force-dynamic";

async function getListDirectoryRecord() {
  try {
    return await getPublishedCatalogListDirectory();
  } catch (error) {
    if (isBackendError(error) && error.code === "database_not_configured") {
      return {
        title: "Public lists",
        description: "Curated published lists backed by the canonical catalog.",
        canonicalDirectoryHref: "/lists",
        listCount: 0,
        listCountLabel: "0 lists",
        items: [],
      };
    }

    throw error;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const directory = await getListDirectoryRecord();

  return {
    title: directory.title,
    description: directory.description,
    alternates: {
      canonical: directory.canonicalDirectoryHref,
    },
  };
}

export default async function PublicListDirectoryPage() {
  const directory = await getListDirectoryRecord();

  return <PublicListDirectoryPageShell directory={directory} />;
}
