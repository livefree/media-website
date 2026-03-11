import "server-only";

import { requirePrivilegedAdminAccess } from "../admin/access";
import { BackendError } from "../errors";
import { runInTransaction } from "../../db/transactions";
import { createDefaultSourceInventoryRepository } from "../../db/repositories/source";
import { createSourceInventoryRepository } from "../../db/repositories/source";

import type {
  AdminSourceInventoryItemRecord,
  CreateManualSourceSubmissionInput,
  ManualSourceSubmissionDetailRecord,
  ManualSourceSubmissionQuery,
  ManualSourceSubmissionRecord,
  ManualSourceSubmissionStatusUpdateInput,
  ReorderPublishedSourcesInput,
  ReorderPublishedSourcesResult,
  ReplacePublishedSourceInput,
  ReplacePublishedSourceResult,
  SourceInventoryQuery,
  SourceInventoryRecord,
  SourceOrderingUpdate,
  UpsertSourceInventoryInput,
} from "./types";

export async function listSourceInventory(filters?: SourceInventoryQuery): Promise<SourceInventoryRecord[]> {
  return createDefaultSourceInventoryRepository().listSourceInventory(filters);
}

export async function listAdminSourceInventory(filters?: SourceInventoryQuery): Promise<AdminSourceInventoryItemRecord[]> {
  requirePrivilegedAdminAccess("operator");
  return createDefaultSourceInventoryRepository().listAdminSourceInventory(filters);
}

export async function getSourceInventoryByPublicId(publicId: string): Promise<SourceInventoryRecord | null> {
  return createDefaultSourceInventoryRepository().getSourceInventoryByPublicId(publicId);
}

export async function upsertSourceInventory(input: UpsertSourceInventoryInput): Promise<SourceInventoryRecord> {
  return createDefaultSourceInventoryRepository().upsertSourceInventory(input);
}

export async function updateSourceOrdering(updates: SourceOrderingUpdate[]): Promise<SourceInventoryRecord[]> {
  requirePrivilegedAdminAccess("operator");
  return createDefaultSourceInventoryRepository().updateSourceOrdering(updates);
}

export async function reorderPublishedSources(input: ReorderPublishedSourcesInput): Promise<ReorderPublishedSourcesResult> {
  requirePrivilegedAdminAccess("operator");

  if (input.updates.length === 0) {
    throw new BackendError("At least one source ordering update is required.", {
      status: 400,
      code: "source_reorder_updates_required",
    });
  }

  return runInTransaction(
    {
      name: "source.reorderPublishedSources",
    },
    async (context) => createSourceInventoryRepository(context).reorderPublishedSources(input),
    {
      actorId: input.actorId,
      requestId: input.requestId,
    },
  );
}

export async function replacePublishedSource(input: ReplacePublishedSourceInput): Promise<ReplacePublishedSourceResult> {
  requirePrivilegedAdminAccess("operator");

  return runInTransaction(
    {
      name: "source.replacePublishedSource",
    },
    async (context) => createSourceInventoryRepository(context).replacePublishedSource(input),
    {
      actorId: input.actorId,
      requestId: input.requestId,
    },
  );
}

function requireTrimmedValue(value: string | undefined, field: string, code: string) {
  if (!value?.trim()) {
    throw new BackendError(`${field} is required.`, {
      status: 400,
      code,
    });
  }
}

function validateOptionalEmail(email: string | undefined, code: string) {
  if (!email) {
    return;
  }

  if (!email.includes("@")) {
    throw new BackendError("Email must be valid when provided.", {
      status: 400,
      code,
    });
  }
}

function validateManualSourceSubmissionInput(input: CreateManualSourceSubmissionInput) {
  requireTrimmedValue(input.label, "Source label", "manual_source_label_required");
  requireTrimmedValue(input.url, "Source URL", "manual_source_url_required");
  validateOptionalEmail(input.submittedByEmail, "manual_source_submitter_email_invalid");

  if (!input.mediaId && !input.targetTitleText?.trim()) {
    throw new BackendError("Manual source submission requires a target title or media reference.", {
      status: 400,
      code: "manual_source_target_required",
    });
  }
}

function manualSourceActionSummary(status: ManualSourceSubmissionStatusUpdateInput["status"], notes?: string) {
  return notes?.trim() || `Manual source submission moved to ${status}.`;
}

export async function listManualSourceSubmissions(
  query: ManualSourceSubmissionQuery = {},
): Promise<ManualSourceSubmissionRecord[]> {
  requirePrivilegedAdminAccess("operator");
  return createDefaultSourceInventoryRepository().listManualSourceSubmissions(query);
}

export async function getManualSourceSubmissionDetailByPublicId(
  publicId: string,
): Promise<ManualSourceSubmissionDetailRecord | null> {
  requirePrivilegedAdminAccess("operator");
  return createDefaultSourceInventoryRepository().getManualSourceSubmissionDetailByPublicId(publicId);
}

export async function createManualSourceSubmission(
  input: CreateManualSourceSubmissionInput,
): Promise<ManualSourceSubmissionDetailRecord> {
  requirePrivilegedAdminAccess("operator");
  validateManualSourceSubmissionInput(input);

  return runInTransaction(
    {
      name: "source.createManualSourceSubmission",
    },
    async (context) => {
      const repository = createSourceInventoryRepository(context);
      const submission = await repository.createManualSourceSubmission(input);

      await repository.createManualSourceSubmissionAction({
        submissionId: submission.id,
        actorId: input.actorId,
        actionType: "submitted",
        summary: "Manual source submission created.",
        notes: input.notes,
        statusAfter: "submitted",
      });

      const detail = await repository.getManualSourceSubmissionDetailByPublicId(submission.publicId);

      if (!detail) {
        throw new BackendError(`Manual source submission '${submission.publicId}' was not found after creation.`, {
          status: 500,
          code: "manual_source_submission_missing_after_create",
        });
      }

      return detail;
    },
    {
      actorId: input.actorId,
      requestId: input.requestId,
    },
  );
}

export async function updateManualSourceSubmissionStatus(
  publicId: string,
  input: ManualSourceSubmissionStatusUpdateInput,
): Promise<ManualSourceSubmissionDetailRecord> {
  requirePrivilegedAdminAccess("operator");
  return runInTransaction(
    {
      name: "source.updateManualSourceSubmissionStatus",
    },
    async (context) => {
      const repository = createSourceInventoryRepository(context);
      const existing = await repository.getManualSourceSubmissionDetailByPublicId(publicId);

      if (!existing) {
        throw new BackendError(`Manual source submission '${publicId}' was not found.`, {
          status: 404,
          code: "manual_source_submission_not_found",
        });
      }

      await repository.updateManualSourceSubmissionStatus(publicId, input);
      await repository.createManualSourceSubmissionAction({
        submissionId: existing.submission.id,
        actorId: input.actorId,
        actionType: input.linkedResourceId ? "linked_resource" : "status_changed",
        summary: manualSourceActionSummary(input.status, input.notes),
        notes: input.notes,
        statusAfter: input.status,
        metadata: {
          linkedResourceId: input.linkedResourceId ?? null,
          linkedRepairQueueEntryId: input.linkedRepairQueueEntryId ?? null,
        },
      });

      const updated = await repository.getManualSourceSubmissionDetailByPublicId(publicId);

      if (!updated) {
        throw new BackendError(`Manual source submission '${publicId}' was not found after update.`, {
          status: 500,
          code: "manual_source_submission_missing_after_update",
        });
      }

      return updated;
    },
    {
      actorId: input.actorId,
      requestId: input.requestId,
    },
  );
}
