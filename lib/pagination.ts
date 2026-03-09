export type PaginationLink = {
  page: number;
  href: string;
  isCurrent: boolean;
};

function getVisiblePages(currentPage: number, totalPages: number, visibleCount: number): number[] {
  if (totalPages <= visibleCount) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const half = Math.floor(visibleCount / 2);
  let start = Math.max(1, currentPage - half);
  let end = start + visibleCount - 1;

  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - visibleCount + 1);
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function buildPaginationModel({
  currentPage,
  totalPages,
  hrefBuilder,
  visibleCount = 5,
}: {
  currentPage: number;
  totalPages: number;
  hrefBuilder: (page: number) => string;
  visibleCount?: number;
}) {
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
  const safeTotalPages = Math.max(totalPages, 1);

  return {
    currentPage: safeCurrentPage,
    totalPages: safeTotalPages,
    previousHref: safeCurrentPage > 1 ? hrefBuilder(safeCurrentPage - 1) : undefined,
    nextHref: safeCurrentPage < safeTotalPages ? hrefBuilder(safeCurrentPage + 1) : undefined,
    pages: getVisiblePages(safeCurrentPage, safeTotalPages, visibleCount).map<PaginationLink>((page) => ({
      page,
      href: hrefBuilder(page),
      isCurrent: page === safeCurrentPage,
    })),
  };
}
