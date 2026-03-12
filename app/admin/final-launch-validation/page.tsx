import { AdminLaunchValidationPage } from "../../../components/admin/AdminLaunchValidationPage";
import { getAdminFinalLaunchValidationPage } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";

export const dynamic = "force-dynamic";

export default async function AdminFinalLaunchValidationRoute() {
  try {
    const page = await getAdminFinalLaunchValidationPage();
    return <AdminLaunchValidationPage page={page} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Final launch-validation backend is unavailable.";
    return <AdminLaunchValidationPage errorMessage={message} />;
  }
}
