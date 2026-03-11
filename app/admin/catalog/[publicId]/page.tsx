import { AdminPublishedCatalogDetailPage } from "../../../../components/admin/AdminPublishedCatalogDetailPage";
import { normalizeAdminCatalogReturnTo } from "../../../../components/admin/admin-published-catalog.helpers";
import { getAdminPublishedCatalogManagementDetailByPublicId } from "../../../../lib/server/admin";
import { isBackendError } from "../../../../lib/server/errors";

export const dynamic = "force-dynamic";

export default async function AdminCatalogDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams?: Promise<{ from?: string }>;
}) {
  const { publicId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const backHref = normalizeAdminCatalogReturnTo(resolvedSearchParams?.from);

  try {
    const detail = await getAdminPublishedCatalogManagementDetailByPublicId(publicId);

    if (!detail) {
      return <AdminPublishedCatalogDetailPage backHref={backHref} errorMessage="Published catalog record was not found." publicId={publicId} />;
    }

    return <AdminPublishedCatalogDetailPage backHref={backHref} detail={detail} publicId={publicId} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator published catalog backend is unavailable.";
    return <AdminPublishedCatalogDetailPage backHref={backHref} errorMessage={message} publicId={publicId} />;
  }
}
