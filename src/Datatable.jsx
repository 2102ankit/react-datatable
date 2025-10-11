/* eslint-disable no-unused-vars */
import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

// Helper function to format header text (e.g., 'firstName' -> 'First Name')
const formatHeader = (key) => {
  if (!key) return ""; // Handle cases where key might be undefined
  return String(key)
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};

const DataTable = ({ data, columns }) => {
  const [sorting, setSorting] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState([]); // For column-specific filters
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    // State management for table features
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    // Model getters to enable table features
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Optional: debug to see internal state in console
    debugTable: false,
    debugHeaders: false,
    debugColumns: false,
  });

  const {
    getHeaderGroups,
    getRowModel,
    setGlobalFilter: setTableGlobalFilter, // Rename to avoid conflict with local state
    getCanPreviousPage,
    getCanNextPage,
    previousPage,
    nextPage,
    setPageIndex,
    getPageCount,
    getState,
    setPageSize,
  } = table;

  const { pagination: tablePagination } = getState();

  return (
    <div className="data-table-container">
      <div className="table-controls">
        <input
          type="text"
          value={globalFilter ?? ""} // Ensure it's not null/undefined
          onChange={(e) => setTableGlobalFilter(e.target.value)}
          placeholder="Global Search..."
          className="global-filter-input"
        />
        <div className="pagination-controls">
          <button
            onClick={() => setPageIndex(0)}
            disabled={!getCanPreviousPage()}
          >
            {"<<"}
          </button>
          <button
            onClick={() => previousPage()}
            disabled={!getCanPreviousPage()}
          >
            {"<"}
          </button>
          <span className="page-info">
            Page{" "}
            <strong>
              {tablePagination.pageIndex + 1} of {getPageCount()}
            </strong>
          </span>
          <button onClick={() => nextPage()} disabled={!getCanNextPage()}>
            {">"}
          </button>
          <button
            onClick={() => setPageIndex(getPageCount() - 1)}
            disabled={!getCanNextPage()}
          >
            {">>"}
          </button>
          <select
            value={tablePagination.pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
            }}
          >
            {[5, 10, 20, 30, 40, 50, 100, 200, 500, 1000].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            {getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    // Style attributes directly from TanStack Table metadata if defined
                    style={{
                      width: header.column.getSize(),
                      textAlign: header.column.columnDef.meta?.align || "left",
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {/* Render header content, using flexRender for custom headers */}
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {/* Sorting Indicator */}
                        {header.column.getCanSort() && (
                          <span className="sort-indicator">
                            {{
                              asc: " ▲",
                              desc: " ▼",
                            }[header.column.getIsSorted()] ?? ""}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="table-body">
            {getRowModel().rows.length ? (
              getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        textAlign: cell.column.columnDef.meta?.align || "left",
                      }}
                    >
                      {/* Render cell content, using flexRender for custom cells */}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: "center" }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Optional: Debugging current state */}
      {/* <pre>{JSON.stringify(getState(), null, 2)}</pre> */}
    </div>
  );
};

export default DataTable;
