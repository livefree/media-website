import { NextResponse } from "next/server";

import { getMediaDetail } from "../../../../lib/media-catalog";
import { ApiError, getErrorResponse } from "../../../../lib/server/errors";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  try {
    const detail = getMediaDetail(params.slug);

    if (!detail) {
      throw new ApiError("Media item not found.", { status: 404, code: "media_not_found" });
    }

    return NextResponse.json({
      ok: true,
      item: detail,
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
