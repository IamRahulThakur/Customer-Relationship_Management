export default function Pagination({ page, totalPages, setPage }) {
  const prev = () => page > 1 && setPage(page - 1);
  const next = () => page < totalPages && setPage(page + 1);

  return (
    <div className="flex items-center justify-center space-x-2 mt-4">
      <button
        onClick={prev}
        disabled={page === 1}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        Prev
      </button>
      <span>{page} / {totalPages}</span>
      <button
        onClick={next}
        disabled={page === totalPages}
        className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
