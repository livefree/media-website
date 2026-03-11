"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isBackendError } from "../../../lib/server/errors";
import { publishReviewDecision, startReview, submitReviewDecision } from "../../../lib/server/review";

function buildReviewPath(queueEntryId: string, message?: string) {
  const path = `/admin/review/${queueEntryId}`;

  if (!message) {
    return path;
  }

  return `${path}?flash=${encodeURIComponent(message)}`;
}

function getRequiredField(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required form field '${key}'.`);
  }

  return value.trim();
}

function getOptionalField(formData: FormData, key: string): string | undefined {
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

  return "Unexpected operator workflow error.";
}

export async function startReviewAction(formData: FormData) {
  const queueEntryId = getRequiredField(formData, "queueEntryId");

  try {
    await startReview({
      queueEntryId,
      actorId: "operator-ui",
      requestId: `admin-review-start-${queueEntryId}`,
    });
    revalidatePath("/admin/review");
    revalidatePath(`/admin/review/${queueEntryId}`);
    redirect(buildReviewPath(queueEntryId, "Review started."));
  } catch (error) {
    redirect(buildReviewPath(queueEntryId, getErrorMessage(error)));
  }
}

export async function submitDecisionAction(formData: FormData) {
  const queueEntryId = getRequiredField(formData, "queueEntryId");
  const decisionType = getRequiredField(formData, "decisionType") as
    | "approve"
    | "reject"
    | "merge"
    | "replace"
    | "unpublish";

  try {
    await submitReviewDecision({
      queueEntryId,
      decisionType,
      targetCanonicalMediaId: getOptionalField(formData, "targetCanonicalMediaId"),
      notes: getOptionalField(formData, "notes"),
      actorId: "operator-ui",
      requestId: `admin-review-decision-${queueEntryId}-${decisionType}`,
    });
    revalidatePath("/admin/review");
    revalidatePath(`/admin/review/${queueEntryId}`);
    redirect(buildReviewPath(queueEntryId, `Decision recorded: ${decisionType}.`));
  } catch (error) {
    redirect(buildReviewPath(queueEntryId, getErrorMessage(error)));
  }
}

export async function publishDecisionAction(formData: FormData) {
  const queueEntryId = getRequiredField(formData, "queueEntryId");
  const reviewDecisionId = getRequiredField(formData, "reviewDecisionId");

  try {
    await publishReviewDecision({
      reviewDecisionId,
      actorId: "operator-ui",
      requestId: `admin-review-publish-${reviewDecisionId}`,
    });
    revalidatePath("/admin/review");
    revalidatePath(`/admin/review/${queueEntryId}`);
    redirect(buildReviewPath(queueEntryId, "Publish operation completed."));
  } catch (error) {
    redirect(buildReviewPath(queueEntryId, getErrorMessage(error)));
  }
}
