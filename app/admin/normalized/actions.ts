"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { queueAdminNormalizedCandidateForReview } from "../../../lib/server/admin";
import { isBackendError } from "../../../lib/server/errors";

function getRequiredField(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required form field '${key}'.`);
  }

  return value.trim();
}

export async function queueNormalizedCandidateAction(formData: FormData) {
  const normalizedCandidateId = getRequiredField(formData, "normalizedCandidateId");

  try {
    await queueAdminNormalizedCandidateForReview({
      normalizedCandidateId,
      actorId: "operator-ui",
      requestId: `admin-normalized-queue-${normalizedCandidateId}`,
    });
    revalidatePath("/admin/normalized");
    revalidatePath("/admin/review");
    redirect("/admin/review?flash=" + encodeURIComponent("Candidate queued for review."));
  } catch (error) {
    const message = isBackendError(error) ? error.message : "Unable to queue candidate.";
    redirect("/admin/normalized?flash=" + encodeURIComponent(message));
  }
}
