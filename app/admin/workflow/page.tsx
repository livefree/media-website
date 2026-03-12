import { AdminWorkflowLandingPage } from "../../../components/admin/AdminWorkflowLandingPage";
import { getAdminWorkflowLandingPage } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";

export const dynamic = "force-dynamic";

export default async function AdminWorkflowLandingRoute({
  searchParams,
}: {
  searchParams?: { flash?: string };
}) {
  try {
    const page = await getAdminWorkflowLandingPage();
    return <AdminWorkflowLandingPage page={page} flashMessage={searchParams?.flash} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Workflow landing backend is unavailable.";
    return <AdminWorkflowLandingPage errorMessage={message} />;
  }
}
