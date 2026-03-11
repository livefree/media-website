import { AdminManualTitleSubmissionPage } from "../../../components/admin/AdminManualTitleSubmissionPage";
import { parseAdminManualTitleSubmissionSearch } from "../../../components/admin/admin-workstream3.helpers";
import {
  getAdminManualTitleSubmissionDetailByPublicId,
  getAdminManualTitleSubmissionPage,
} from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";

export const dynamic = "force-dynamic";

type RouteSearchParams = Record<string, string | string[] | undefined>;

export default async function AdminManualTitlesPageRoute({
  searchParams,
}: {
  searchParams?: RouteSearchParams;
}) {
  const { query, searchState, returnTo, flashMessage } = parseAdminManualTitleSubmissionSearch(searchParams);
  let detailErrorMessage: string | undefined;

  try {
    const [page, detail] = await Promise.all([
      getAdminManualTitleSubmissionPage(query),
      searchState.submission ? getAdminManualTitleSubmissionDetailByPublicId(searchState.submission) : Promise.resolve(undefined),
    ]);

    if (searchState.submission && !detail) {
      detailErrorMessage = "Selected manual title submission was not found.";
    }

    return (
      <AdminManualTitleSubmissionPage
        detail={detail ?? undefined}
        detailErrorMessage={detailErrorMessage}
        flashMessage={flashMessage}
        page={page}
        returnTo={returnTo}
        searchState={searchState}
      />
    );
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator manual title backend is unavailable.";
    return (
      <AdminManualTitleSubmissionPage
        detailErrorMessage={detailErrorMessage}
        errorMessage={message}
        flashMessage={flashMessage}
        returnTo={returnTo}
        searchState={searchState}
      />
    );
  }
}
