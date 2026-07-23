// Reusable pagination bar for list pages.
// `meta` is the { total, page, limit, pages } object every paginated
// list endpoint returns alongside `data` (see backend `success()` helper).
const Pagination = ({ meta, onPageChange }) => {
  if (!meta || meta.pages <= 1) return null;

  const { page, pages, total, limit } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Compact page-number list: first, last, current +/-1, with ellipses.
  const pageNumbers = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
      pageNumbers.push(i);
    } else if (pageNumbers[pageNumbers.length - 1] !== "...") {
      pageNumbers.push("...");
    }
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50 text-sm">
      <p className="text-ink-400 text-xs">
        Showing <span className="font-medium text-ink-600">{from}-{to}</span> of{" "}
        <span className="font-medium text-ink-600">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-600 border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Prev
        </button>
        {pageNumbers.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-ink-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border ${
                p === page
                  ? "bg-navy-900 text-white border-navy-900"
                  : "text-ink-600 border-gray-200 hover:bg-white"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-600 border border-gray-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;