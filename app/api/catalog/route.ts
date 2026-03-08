import { NextRequest, NextResponse } from "next/server";

import { getCatalogConfig, getSearchSeed } from "../../../lib/media-catalog";
import { parseSearchParams } from "../../../lib/search-params";
import { getErrorResponse } from "../../../lib/server/errors";
import type { CatalogQueryState } from "../../../types/media";

export const runtime = "nodejs";

function mapRouteParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  return parseSearchParams(
    {
      q: searchParams.get("q") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      genre: searchParams.get("genre") ?? undefined,
      region: searchParams.get("region") ?? undefined,
      year: searchParams.get("year") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    },
    searchParams.get("pageSize") ? Number.parseInt(searchParams.get("pageSize") ?? "18", 10) : 18,
  );
}

export async function GET(request: NextRequest) {
  try {
    const params = mapRouteParams(request);
    const config = getCatalogConfig();

    const query: CatalogQueryState = {
      q: params.q,
      type: params.type,
      genre: params.genre || undefined,
      region: params.region || undefined,
      year: params.year ? Number.parseInt(params.year, 10) : undefined,
      sort: params.sort,
      page: params.page,
      pageSize: params.pageSize,
    };

    const seed = getSearchSeed(query);
    const totalPages = Math.max(1, Math.ceil(seed.total / params.pageSize));

    return NextResponse.json({
      ok: true,
      params,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        totalItems: seed.total,
        totalPages,
      },
      facets: seed.facets,
      filters: config.filterGroups,
      hotSearches: config.hotSearches,
      items: seed.cards,
    });
  } catch (error) {
    const response = getErrorResponse(error);
    return NextResponse.json(response.body, { status: response.status });
  }
}
