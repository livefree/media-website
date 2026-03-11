import { AdminPublishedCatalogPage } from "../../../components/admin/AdminPublishedCatalogPage";
import { parseAdminPublishedCatalogSearch } from "../../../components/admin/admin-published-catalog.helpers";
import { getAdminPublishedCatalogManagementPage } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";

export const dynamic = "force-dynamic";

type RouteSearchParams = Record<string, string | string[] | undefined>;

export default async function AdminCatalogPageRoute({
  searchParams,
}: {
  searchParams?: RouteSearchParams;
}) {
  const { query, searchState, returnTo } = parseAdminPublishedCatalogSearch(searchParams);

  try {
    const page = await getAdminPublishedCatalogManagementPage(query);
    return <AdminPublishedCatalogPage page={page} returnTo={returnTo} searchState={searchState} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator published catalog backend is unavailable.";
    return <AdminPublishedCatalogPage errorMessage={message} returnTo={returnTo} searchState={searchState} />;
  }
}
