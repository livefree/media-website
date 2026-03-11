"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  acknowledgeAdminModerationReport,
  dismissAdminModerationReport,
  resolveAdminModerationReport,
} from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";
import { normalizeAdminModerationReturnTo } from "../../../components/admin/admin-workstream3.helpers";

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

  return "Unexpected moderation workflow error.";
}

function buildRedirectPath(returnTo: string, message: string) {
  const url = new URL(returnTo, "http://localhost");
  url.searchParams.set("flash", message);
  return `${url.pathname}${url.search}`;
}

export async function submitModerationReportAction(formData: FormData) {
  const publicId = getRequiredField(formData, "publicId");
  const intent = getRequiredField(formData, "intent");
  const returnTo = normalizeAdminModerationReturnTo(getOptionalField(formData, "returnTo"));
  const notes = getOptionalField(formData, "notes");
  const linkedRepairQueueEntryId = getOptionalField(formData, "linkedRepairQueueEntryId");

  try {
    if (intent === "acknowledge") {
      await acknowledgeAdminModerationReport({
        publicId,
        notes,
        linkedRepairQueueEntryId,
        actorId: "operator-ui",
        requestId: `admin-moderation-ack-${publicId}`,
      });
    } else if (intent === "resolve") {
      await resolveAdminModerationReport({
        publicId,
        notes,
        linkedRepairQueueEntryId,
        actorId: "operator-ui",
        requestId: `admin-moderation-resolve-${publicId}`,
      });
    } else if (intent === "dismiss") {
      await dismissAdminModerationReport({
        publicId,
        notes,
        actorId: "operator-ui",
        requestId: `admin-moderation-dismiss-${publicId}`,
      });
    } else {
      throw new Error(`Unsupported moderation intent '${intent}'.`);
    }

    revalidatePath("/admin/moderation");
    revalidatePath(`/admin/moderation/${publicId}`);
    revalidatePath("/admin/repair");
    redirect(buildRedirectPath(returnTo, "Moderation report updated."));
  } catch (error) {
    redirect(buildRedirectPath(returnTo, getErrorMessage(error)));
  }
}
