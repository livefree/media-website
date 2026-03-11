import { listReviewQueue } from "../../../lib/server/review";
import { isBackendError } from "../../../lib/server/errors";
import { AdminReviewQueuePage } from "../../../components/admin/AdminReviewQueuePage";

export const dynamic = "force-dynamic";

export default async function AdminReviewPage() {
  try {
    const queue = await listReviewQueue();

    return <AdminReviewQueuePage queue={queue} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator review backend is unavailable.";

    return <AdminReviewQueuePage queue={[]} errorMessage={message} />;
  }
}
