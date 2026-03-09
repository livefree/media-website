import { NextResponse } from "next/server";

import { getServerEnv, isDatabaseConfigured } from "../../../lib/config/env";
import { getDb } from "../../../lib/db/client";
import { getErrorResponse } from "../../../lib/server/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const env = getServerEnv();
    const db = getDb();
    let database = {
      configured: isDatabaseConfigured(),
      reachable: false,
    };

    if (db) {
      await db.$queryRaw`SELECT 1`;
      database = {
        configured: true,
        reachable: true,
      };
    }

    return NextResponse.json({
      ok: true,
      service: "media-atlas",
      environment: env.APP_ENV,
      timestamp: new Date().toISOString(),
      database,
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
