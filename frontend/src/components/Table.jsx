// File: src/components/Table.jsx
export default function Table({ columns = [], data = [], renderRowActions }) {
  if (!columns.length) return <div className="p-4 text-center">No columns to display</div>;
  
  if (!data.length) return (
    <div className="p-6 text-center text-gray-500">
      No data available
    </div>
  );

  return (
    <div className="overflow-x-auto">
      {/* Desktop Table */}
      <table className="min-w-full bg-white shadow rounded-lg overflow-hidden hidden md:table">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="text-left p-3 border-b">{col.label}</th>
            ))}
            {renderRowActions && <th className="p-3 border-b">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row._id} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="p-3 border-b">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {renderRowActions && (
                <td className="p-3 border-b">{renderRowActions(row)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div key={row._id} className="bg-white p-4 rounded-lg shadow">
            {columns.map((col) => (
              <div key={col.key} className="mb-2 last:mb-0">
                <div className="text-sm font-medium text-gray-500">{col.label}</div>
                <div className="mt-1">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </div>
              </div>
            ))}
            {renderRowActions && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                {renderRowActions(row)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}