import { notFound } from "next/navigation";

import { PublicListPageShell } from "../../../components/PublicListPageShell";
import { getPublicListPageRecord } from "../../../lib/media-catalog";

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
