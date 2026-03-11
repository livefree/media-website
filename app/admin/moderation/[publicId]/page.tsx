import { AdminModerationDetailPage } from "../../../../components/admin/AdminModerationDetailPage";
import { normalizeAdminModerationReturnTo } from "../../../../components/admin/admin-workstream3.helpers";
import { getAdminModerationReportDetailByPublicId } from "../../../../lib/server/admin";
import { isBackendError } from "../../../../lib/server/errors";

export const dynamic = "force-dynamic";

type DetailSearchParams = {
  flash?: string;
  from?: string;
};

export default async function AdminModerationDetailRoute({
  params,
  searchParams,
}: {
  params: Promise<{ publicId: string }>;
  searchParams?: Promise<DetailSearchParams>;
}) {
  const { publicId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnTo = normalizeAdminModerationReturnTo(resolvedSearchParams?.from);

  try {
    const detail = await getAdminModerationReportDetailByPublicId(publicId);

    if (!detail) {
      return (
        <AdminModerationDetailPage
          errorMessage="Moderation report was not found."
          flashMessage={resolvedSearchParams?.flash}
          publicId={publicId}
          returnTo={returnTo}
        />
      );
    }

    return <AdminModerationDetailPage detail={detail} flashMessage={resolvedSearchParams?.flash} returnTo={returnTo} />;
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Operator moderation backend is unavailable.";
    return <AdminModerationDetailPage errorMessage={message} flashMessage={resolvedSearchParams?.flash} publicId={publicId} returnTo={returnTo} />;
  }
}
