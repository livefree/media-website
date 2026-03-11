import { AdminPublishedCatalogDetailPage } from "../../../../components/admin/AdminPublishedCatalogDetailPage";
import { parseAdminPublishedCatalogDetailSearch } from "../../../../components/admin/admin-published-catalog.helpers";
import { getAdminPublishedCatalogManagementDetailByPublicId } from "../../../../lib/server/admin";
import { isBackendError } from "../../../../lib/server/errors";

export const dynamic = "force-dynamic";

export default async function AdminCatalogDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams?: Promise<{ from?: string; flash?: string }>;
}) {
  const { publicId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { backHref, flashMessage } = parseAdminPublishedCatalogDetailSearch(resolvedSearchParams);

  try {
    const detail = await getAdminPublishedCatalogManagementDetailByPublicId(publicId);

    if (!detail) {
      return (
        <AdminPublishedCatalogDetailPage
          backHref={backHref}
          errorMessage="Published catalog record was not found."
          flashMessage={flashMessage}
          publicId={publicId}
        />
      );
    }

    return <AdminPublishedCatalogDetailPage backHref={backHref} detail={detail} flashMessage={flashMessage} publicId={publicId} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator published catalog backend is unavailable.";
    return <AdminPublishedCatalogDetailPage backHref={backHref} errorMessage={message} flashMessage={flashMessage} publicId={publicId} />;
  }
}
