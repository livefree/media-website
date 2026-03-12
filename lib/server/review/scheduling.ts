import "server-only";

import { BackendError } from "../errors";

export function requireFuturePublishAt(value: string, now: () => number = Date.now): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BackendError("Publish schedule must be a valid timestamp.", {
      status: 400,
      code: "review_publish_schedule_invalid",
    });
  }

  if (parsed.getTime() <= now()) {
    throw new BackendError("Publish schedule must be in the future.", {
      status: 400,
      code: "review_publish_schedule_not_future",
    });
  }

  return parsed.toISOString();
}
