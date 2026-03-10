import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicListPageShell } from "../../../components/PublicListPageShell";
import { getPublicListPageRecord } from "../../../lib/media-catalog";

export function generateMetadata({
  params,
}: {
  params: { publicId: string };
}): Metadata {
  const list = getPublicListPageRecord(params.publicId);

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

export default function PublicListPage({
  params,
}: {
  params: { publicId: string };
}) {
  const list = getPublicListPageRecord(params.publicId);

  if (!list) {
    notFound();
  }

  return <PublicListPageShell list={list} />;
}
