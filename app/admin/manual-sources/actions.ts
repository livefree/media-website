"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAdminManualSourceSubmission,
  updateAdminManualSourceSubmissionStatus,
} from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";
import {
  normalizeAdminManualSourceSubmissionReturnTo,
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

function getErrorMessage(error: unknown) {
  if (isBackendError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected manual source workflow error.";
}

function buildRedirectPath(returnTo: string, message: string, selectedPublicId?: string) {
  const url = new URL(returnTo, "http://localhost");
  url.searchParams.set("flash", message);

  if (selectedPublicId) {
    url.searchParams.set("submission", selectedPublicId);
  }

  return `${url.pathname}${url.search}`;
}

export async function createManualSourceSubmissionAction(formData: FormData) {
  const returnTo = normalizeAdminManualSourceSubmissionReturnTo(getOptionalField(formData, "returnTo"));

  try {
    const detail = await createAdminManualSourceSubmission({
      targetTitleText: getOptionalField(formData, "targetTitleText"),
      targetEpisodeText: getOptionalField(formData, "targetEpisodeText"),
      kind: getRequiredField(formData, "kind") as "stream" | "download" | "subtitle" | "trailer",
      provider: getRequiredField(formData, "provider") as
        | "internal"
        | "m3u8"
        | "mp4"
        | "quark"
        | "baidu"
        | "aliyun"
        | "magnet"
        | "other",
      format: getRequiredField(formData, "format"),
      label: getRequiredField(formData, "label"),
      quality: getOptionalField(formData, "quality"),
      url: getRequiredField(formData, "url"),
      maskedUrl: getOptionalField(formData, "maskedUrl"),
      accessCode: getOptionalField(formData, "accessCode"),
      notes: getOptionalField(formData, "notes"),
      sourceUrl: getOptionalField(formData, "sourceUrl"),
      submittedByName: getOptionalField(formData, "submittedByName"),
      submittedByEmail: getOptionalField(formData, "submittedByEmail"),
      actorId: "operator-ui",
      requestId: `admin-manual-source-create-${Date.now()}`,
    });

    revalidatePath("/admin/manual-sources");
    redirect(buildRedirectPath(returnTo, "Manual source submission created.", detail.submission.publicId));
  } catch (error) {
    redirect(buildRedirectPath(returnTo, getErrorMessage(error)));
  }
}

export async function submitManualSourceStatusAction(formData: FormData) {
  const publicId = getRequiredField(formData, "publicId");
  const status = getRequiredField(formData, "status") as "submitted" | "in_review" | "accepted" | "rejected" | "needs_followup";
  const returnTo = normalizeAdminManualSourceSubmissionReturnTo(getOptionalField(formData, "returnTo"));

  try {
    await updateAdminManualSourceSubmissionStatus(publicId, {
      status,
      notes: getOptionalField(formData, "notes"),
      linkedResourceId: getOptionalField(formData, "linkedResourceId"),
      linkedRepairQueueEntryId: getOptionalField(formData, "linkedRepairQueueEntryId"),
      actorId: "operator-ui",
      requestId: `admin-manual-source-status-${publicId}-${status}`,
    });

    revalidatePath("/admin/manual-sources");
    redirect(buildRedirectPath(returnTo, "Manual source submission updated.", publicId));
  } catch (error) {
    redirect(buildRedirectPath(returnTo, getErrorMessage(error), publicId));
  }
}
