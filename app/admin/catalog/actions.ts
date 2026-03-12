"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  hideAdminPublishedCatalogRecord,
  reorderAdminPublishedSources,
  restoreAdminPublishedCatalogVisibility,
  replaceAdminPublishedSource,
  unpublishAdminPublishedCatalogRecord,
} from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";
import {
  buildAdminCatalogDetailPath,
  normalizeAdminCatalogReturnTo,
} from "../../../components/admin/admin-published-catalog.helpers";

function getRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required form field '${key}'.`);
  }

  return value.trim();
}

function getOptionalField(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function getBooleanField(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "1" || value === "true" || value === "on";
}

function getIntegerField(formData: FormData, key: string) {
  const value = getRequiredField(formData, key);
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed)) {
    throw new Error(`Invalid integer form field '${key}'.`);
  }

  return parsed;
}

function getErrorMessage(error: unknown) {
  if (isBackendError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected catalog lifecycle workflow error.";
}

export async function submitPublishedSourceReorderAction(formData: FormData) {
  const mediaPublicId = getRequiredField(formData, "mediaPublicId");
  const resourceId = getRequiredField(formData, "resourceId");
  const returnTo = normalizeAdminCatalogReturnTo(getOptionalField(formData, "returnTo"));
  const detailPath = buildAdminCatalogDetailPath(mediaPublicId, { returnTo });

  try {
    await reorderAdminPublishedSources({
      actorId: "operator-ui",
      requestId: `admin-source-reorder-${mediaPublicId}-${resourceId}`,
      notes: getOptionalField(formData, "notes"),
      updates: [
        {
          resourceId,
          priority: getIntegerField(formData, "priority"),
          mirrorOrder: getIntegerField(formData, "mirrorOrder"),
          isPreferred: getBooleanField(formData, "isPreferred"),
          orderingOrigin: "manual",
        },
      ],
    });

    revalidatePath("/admin/catalog");
    revalidatePath(`/admin/catalog/${mediaPublicId}`);
    revalidatePath("/admin/sources");
    redirect(buildAdminCatalogDetailPath(mediaPublicId, { returnTo, flashMessage: "Published source ordering updated." }));
  } catch (error) {
    redirect(buildAdminCatalogDetailPath(mediaPublicId, { returnTo, flashMessage: getErrorMessage(error) }));
  }
}

export async function submitPublishedSourceReplaceAction(formData: FormData) {
  const mediaPublicId = getRequiredField(formData, "mediaPublicId");
  const sourcePublicId = getRequiredField(formData, "sourcePublicId");
  const replacementPublicId = getRequiredField(formData, "replacementPublicId");
  const returnTo = normalizeAdminCatalogReturnTo(getOptionalField(formData, "returnTo"));

  try {
    await replaceAdminPublishedSource({
      sourcePublicId,
      replacementPublicId,
      actorId: "operator-ui",
      requestId: `admin-source-replace-${sourcePublicId}-${replacementPublicId}`,
      notes: getOptionalField(formData, "notes"),
    });

    revalidatePath("/admin/catalog");
    revalidatePath(`/admin/catalog/${mediaPublicId}`);
    revalidatePath("/admin/sources");
    redirect(buildAdminCatalogDetailPath(mediaPublicId, { returnTo, flashMessage: "Published source replaced." }));
  } catch (error) {
    redirect(buildAdminCatalogDetailPath(mediaPublicId, { returnTo, flashMessage: getErrorMessage(error) }));
  }
}

export async function submitPublishedCatalogUnpublishAction(formData: FormData) {
  const mediaPublicId = getRequiredField(formData, "mediaPublicId");
  const returnTo = normalizeAdminCatalogReturnTo(getOptionalField(formData, "returnTo"));

  try {
    await unpublishAdminPublishedCatalogRecord({
      mediaPublicId,
      actorId: "operator-ui",
      requestId: `admin-catalog-unpublish-${mediaPublicId}`,
      notes: getOptionalField(formData, "notes"),
    });

    revalidatePath("/admin/catalog");
    revalidatePath(`/admin/catalog/${mediaPublicId}`);
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}flash=${encodeURIComponent("Published record withdrawn from serving.")}`);
  } catch (error) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}flash=${encodeURIComponent(getErrorMessage(error))}`);
  }
}

export async function submitPublishedCatalogHideAction(formData: FormData) {
  const mediaPublicId = getRequiredField(formData, "mediaPublicId");
  const returnTo = normalizeAdminCatalogReturnTo(getOptionalField(formData, "returnTo"));

  try {
    await hideAdminPublishedCatalogRecord({
      mediaPublicId,
      actorId: "operator-ui",
      requestId: `admin-catalog-hide-${mediaPublicId}`,
      notes: getOptionalField(formData, "notes"),
    });

    revalidatePath("/admin/catalog");
    revalidatePath(`/admin/catalog/${mediaPublicId}`);
    redirect(buildAdminCatalogDetailPath(mediaPublicId, { returnTo, flashMessage: "Published visibility hidden." }));
  } catch (error) {
    redirect(buildAdminCatalogDetailPath(mediaPublicId, { returnTo, flashMessage: getErrorMessage(error) }));
  }
}

export async function submitPublishedCatalogRestoreVisibilityAction(formData: FormData) {
  const mediaPublicId = getRequiredField(formData, "mediaPublicId");
  const returnTo = normalizeAdminCatalogReturnTo(getOptionalField(formData, "returnTo"));

  try {
    await restoreAdminPublishedCatalogVisibility({
      mediaPublicId,
      actorId: "operator-ui",
      requestId: `admin-catalog-restore-${mediaPublicId}`,
      notes: getOptionalField(formData, "notes"),
    });

    revalidatePath("/admin/catalog");
    revalidatePath(`/admin/catalog/${mediaPublicId}`);
    redirect(buildAdminCatalogDetailPath(mediaPublicId, { returnTo, flashMessage: "Published visibility restored." }));
  } catch (error) {
    redirect(buildAdminCatalogDetailPath(mediaPublicId, { returnTo, flashMessage: getErrorMessage(error) }));
  }
}
