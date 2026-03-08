import Link from "next/link";

import { buildPaginationModel } from "../lib/pagination";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  hrefBuilder?: (page: number) => string;
};

export function Pagination({ currentPage, totalPages, hrefBuilder }: PaginationProps) {
  const model = hrefBuilder
    ? buildPaginationModel({
        currentPage,
        totalPages,
        hrefBuilder,
      })
    : undefined;

  const pages = model?.pages ?? Array.from({ length: Math.min(totalPages, 5) }, (_, index) => ({
    page: index + 1,
    href: "",
    isCurrent: index + 1 === currentPage,
  }));

  return (
    <nav className="pagination-shell" aria-label="Catalog pagination">
      {model?.previousHref ? (
        <Link href={model.previousHref} className="pagination-button">
          Previous
        </Link>
      ) : (
        <button type="button" className="pagination-button" disabled={currentPage === 1}>
          Previous
        </button>
      )}

      <div className="pagination-pages" aria-label={`Page ${currentPage} of ${totalPages}`}>
        {pages.map((page) => (
          hrefBuilder ? (
            <Link
              key={page.page}
              href={page.href}
              className="pagination-page"
              data-active={page.isCurrent ? "true" : "false"}
              aria-current={page.isCurrent ? "page" : undefined}
            >
              {page.page}
            </Link>
          ) : (
            <button
              key={page.page}
              type="button"
              className="pagination-page"
              data-active={page.isCurrent ? "true" : "false"}
              aria-current={page.isCurrent ? "page" : undefined}
            >
              {page.page}
            </button>
          )
        ))}
      </div>

      {model?.nextHref ? (
        <Link href={model.nextHref} className="pagination-button">
          Next
        </Link>
      ) : (
        <button type="button" className="pagination-button" disabled={currentPage === totalPages}>
          Next
        </button>
      )}
    </nav>
  );
}
