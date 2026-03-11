import { AdminManualSourceSubmissionPage } from "../../../components/admin/AdminManualSourceSubmissionPage";
import { parseAdminManualSourceSubmissionSearch } from "../../../components/admin/admin-workstream3.helpers";
import {
  getAdminManualSourceSubmissionDetailByPublicId,
  getAdminManualSourceSubmissionPage,
} from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";

export const dynamic = "force-dynamic";

type RouteSearchParams = Record<string, string | string[] | undefined>;

export default async function AdminManualSourcesPageRoute({
  searchParams,
}: {
  searchParams?: RouteSearchParams;
}) {
  const { query, searchState, returnTo, flashMessage } = parseAdminManualSourceSubmissionSearch(searchParams);
  let detailErrorMessage: string | undefined;

  try {
    const [page, detail] = await Promise.all([
      getAdminManualSourceSubmissionPage(query),
      searchState.submission ? getAdminManualSourceSubmissionDetailByPublicId(searchState.submission) : Promise.resolve(undefined),
    ]);

    if (searchState.submission && !detail) {
      detailErrorMessage = "Selected manual source submission was not found.";
    }

    return (
      <AdminManualSourceSubmissionPage
        detail={detail ?? undefined}
        detailErrorMessage={detailErrorMessage}
        flashMessage={flashMessage}
        page={page}
        returnTo={returnTo}
        searchState={searchState}
      />
    );
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator manual source backend is unavailable.";
    return (
      <AdminManualSourceSubmissionPage
        detailErrorMessage={detailErrorMessage}
        errorMessage={message}
        flashMessage={flashMessage}
        returnTo={returnTo}
        searchState={searchState}
      />
    );
  }
}
