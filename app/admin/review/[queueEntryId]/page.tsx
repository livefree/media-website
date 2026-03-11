import { getReviewQueueDetail } from "../../../../lib/server/review";
import { isBackendError } from "../../../../lib/server/errors";
import { AdminReviewDetailPage } from "../../../../components/admin/AdminReviewDetailPage";

export const dynamic = "force-dynamic";

export default async function AdminReviewDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ queueEntryId: string }>;
  searchParams?: Promise<{ flash?: string }>;
}) {
  const { queueEntryId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  try {
    const detail = await getReviewQueueDetail(queueEntryId);

    if (!detail) {
      return <AdminReviewDetailPage queueEntryId={queueEntryId} errorMessage="Review queue entry was not found." />;
    }

    return <AdminReviewDetailPage detail={detail} flashMessage={resolvedSearchParams?.flash} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator review backend is unavailable.";

    return <AdminReviewDetailPage queueEntryId={queueEntryId} errorMessage={message} flashMessage={resolvedSearchParams?.flash} />;
  }
}
