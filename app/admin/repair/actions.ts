"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { acknowledgeAdminRepairQueueEntry, resolveAdminRepairQueueEntry } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";

function getRequiredField(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required form field '${key}'.`);
  }

  return value.trim();
}

function getReturnTo(formData: FormData) {
  const value = formData.get("returnTo");

  if (typeof value !== "string" || !value.startsWith("/admin/repair")) {
    return "/admin/repair";
  }

  return value;
}

function getErrorMessage(error: unknown) {
  if (isBackendError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected repair queue workflow error.";
}

function buildRedirectPath(returnTo: string, message: string) {
  const url = new URL(returnTo, "http://localhost");
  url.searchParams.set("flash", message);
  return `${url.pathname}${url.search}`;
}

export async function acknowledgeRepairQueueEntryAction(formData: FormData) {
  const entryId = getRequiredField(formData, "entryId");
  const returnTo = getReturnTo(formData);

  try {
    await acknowledgeAdminRepairQueueEntry({
      entryId,
      actorId: "operator-ui",
      requestId: `admin-repair-ack-${entryId}`,
    });
    revalidatePath("/admin/repair");
    revalidatePath("/admin/sources");
    redirect(buildRedirectPath(returnTo, "Repair entry acknowledged."));
  } catch (error) {
    redirect(buildRedirectPath(returnTo, getErrorMessage(error)));
  }
}

export async function resolveRepairQueueEntryAction(formData: FormData) {
  const entryId = getRequiredField(formData, "entryId");
  const returnTo = getReturnTo(formData);

  try {
    await resolveAdminRepairQueueEntry({
      entryId,
      actorId: "operator-ui",
      requestId: `admin-repair-resolve-${entryId}`,
    });
    revalidatePath("/admin/repair");
    revalidatePath("/admin/sources");
    redirect(buildRedirectPath(returnTo, "Repair entry marked resolved."));
  } catch (error) {
    redirect(buildRedirectPath(returnTo, getErrorMessage(error)));
  }
}
