import { AdminModerationPage } from "../../../components/admin/AdminModerationPage";
import { parseAdminModerationSearch } from "../../../components/admin/admin-workstream3.helpers";
import { getAdminModerationQueuePage } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";

export const dynamic = "force-dynamic";

type RouteSearchParams = Record<string, string | string[] | undefined>;

export default async function AdminModerationPageRoute({
  searchParams,
}: {
  searchParams?: RouteSearchParams;
}) {
  const { query, searchState, returnTo, flashMessage } = parseAdminModerationSearch(searchParams);

  try {
    const page = await getAdminModerationQueuePage(query);
    return <AdminModerationPage flashMessage={flashMessage} page={page} returnTo={returnTo} searchState={searchState} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator moderation backend is unavailable.";
    return <AdminModerationPage errorMessage={message} flashMessage={flashMessage} returnTo={returnTo} searchState={searchState} />;
  }
}
