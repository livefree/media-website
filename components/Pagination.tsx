type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const visiblePages = Math.min(totalPages, 5);
  const pages = Array.from({ length: visiblePages }, (_, index) => index + 1);

  return (
    <nav className="pagination-shell" aria-label="Catalog pagination">
      <button type="button" className="pagination-button" disabled={currentPage === 1}>
        Previous
      </button>

      <div className="pagination-pages" aria-label={`Page ${currentPage} of ${totalPages}`}>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className="pagination-page"
            data-active={page === currentPage ? "true" : "false"}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </button>
        ))}
      </div>

      <button type="button" className="pagination-button" disabled={currentPage === totalPages}>
        Next
      </button>
    </nav>
  );
}
