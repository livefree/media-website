"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAdminManualTitleSubmission,
  updateAdminManualTitleSubmissionStatus,
} from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";
import {
  normalizeAdminManualTitleSubmissionReturnTo,
} from "../../../components/admin/admin-workstream3.helpers";

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

function getOptionalInteger(formData: FormData, key: string) {
  const value = getOptionalField(formData, key);
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function getErrorMessage(error: unknown) {
  if (isBackendError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected manual title workflow error.";
}

function buildRedirectPath(returnTo: string, message: string, selectedPublicId?: string) {
  const url = new URL(returnTo, "http://localhost");
  url.searchParams.set("flash", message);

  if (selectedPublicId) {
    url.searchParams.set("submission", selectedPublicId);
  }

  return `${url.pathname}${url.search}`;
}

export async function createManualTitleSubmissionAction(formData: FormData) {
  const returnTo = normalizeAdminManualTitleSubmissionReturnTo(getOptionalField(formData, "returnTo"));

  try {
    const detail = await createAdminManualTitleSubmission({
      title: getRequiredField(formData, "title"),
      originalTitle: getOptionalField(formData, "originalTitle"),
      typeHint: (getOptionalField(formData, "typeHint") ?? "unknown") as
        | "movie"
        | "series"
        | "anime"
        | "variety"
        | "documentary"
        | "special"
        | "unknown",
      releaseYear: getOptionalInteger(formData, "releaseYear"),
      originCountry: getOptionalField(formData, "originCountry"),
      language: getOptionalField(formData, "language"),
      summary: getOptionalField(formData, "summary"),
      notes: getOptionalField(formData, "notes"),
      sourceUrl: getOptionalField(formData, "sourceUrl"),
      submittedByName: getOptionalField(formData, "submittedByName"),
      submittedByEmail: getOptionalField(formData, "submittedByEmail"),
      actorId: "operator-ui",
      requestId: `admin-manual-title-create-${Date.now()}`,
    });

    revalidatePath("/admin/manual-titles");
    redirect(buildRedirectPath(returnTo, "Manual title submission created.", detail.submission.publicId));
  } catch (error) {
    redirect(buildRedirectPath(returnTo, getErrorMessage(error)));
  }
}

export async function submitManualTitleStatusAction(formData: FormData) {
  const publicId = getRequiredField(formData, "publicId");
  const status = getRequiredField(formData, "status") as "submitted" | "in_review" | "accepted" | "rejected" | "needs_followup";
  const returnTo = normalizeAdminManualTitleSubmissionReturnTo(getOptionalField(formData, "returnTo"));

  try {
    await updateAdminManualTitleSubmissionStatus(publicId, {
      status,
      notes: getOptionalField(formData, "notes"),
      canonicalMediaId: getOptionalField(formData, "canonicalMediaId"),
      reviewQueueEntryId: getOptionalField(formData, "reviewQueueEntryId"),
      actorId: "operator-ui",
      requestId: `admin-manual-title-status-${publicId}-${status}`,
    });

    revalidatePath("/admin/manual-titles");
    redirect(buildRedirectPath(returnTo, "Manual title submission updated.", publicId));
  } catch (error) {
    redirect(buildRedirectPath(returnTo, getErrorMessage(error), publicId));
  }
}
