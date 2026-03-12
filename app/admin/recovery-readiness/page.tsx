import { AdminRecoveryReadinessPage } from "../../../components/admin/AdminRecoveryReadinessPage";
import { getAdminRecoveryReadinessPage } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";

export const dynamic = "force-dynamic";

export default async function AdminRecoveryReadinessRoute() {
  try {
    const page = await getAdminRecoveryReadinessPage();
    return <AdminRecoveryReadinessPage page={page} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Recovery-readiness backend is unavailable.";
    return <AdminRecoveryReadinessPage errorMessage={message} />;
  }
}
