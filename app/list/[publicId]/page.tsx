import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicListPageShell } from "../../../components/PublicListPageShell";
import { getPublishedCatalogListByPublicId } from "../../../lib/server/catalog/service";
import { isBackendError } from "../../../lib/server/errors";

export const dynamic = "force-dynamic";

async function getPublishedListRecord(publicId: string) {
  try {
    return await getPublishedCatalogListByPublicId(publicId);
  } catch (error) {
    if (isBackendError(error) && error.code === "database_not_configured") {
      return null;
    }

    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { publicId: string };
}): Promise<Metadata> {
  const list = await getPublishedListRecord(params.publicId);

  if (!list) {
    return {
      title: "Public list not found",
    };
  }

  return {
    title: list.shareTitle,
    description: list.shareDescription,
    alternates: {
      canonical: list.shareHref,
    },
    openGraph: {
      title: list.shareTitle,
      description: list.shareDescription,
      images: list.coverBackdropUrl ? [list.coverBackdropUrl] : list.coverPosterUrl ? [list.coverPosterUrl] : undefined,
    },
  };
}

export default async function PublicListPage({
  params,
}: {
  params: { publicId: string };
}) {
  const list = await getPublishedListRecord(params.publicId);

  if (!list) {
    notFound();
  }

  return <PublicListPageShell list={list} />;
}
