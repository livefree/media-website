import { getAdminPendingNormalizedCandidatesPage } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";
import { AdminPendingNormalizedPage } from "../../../components/admin/AdminPendingNormalizedPage";

export const dynamic = "force-dynamic";

export default async function AdminPendingNormalizedRoute({
  searchParams,
}: {
  searchParams?: { flash?: string };
}) {
  try {
    const page = await getAdminPendingNormalizedCandidatesPage();

    return <AdminPendingNormalizedPage page={page} flashMessage={searchParams?.flash} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Pending normalized backend is unavailable.";
    return <AdminPendingNormalizedPage errorMessage={message} />;
  }
}
