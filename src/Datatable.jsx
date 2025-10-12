/* eslint-disable no-unused-vars */
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  AnimatePresence,
  motion,
  Reorder,
  useDragControls,
} from "framer-motion";
import React, { useState } from "react";

const ColumnHeader = React.memo(({ header }) => {
  const controls = useDragControls();

  return (
    <Reorder.Item
      key={header.id}
      value={header.id}
      as="th"
      colSpan={header.colSpan}
      layout
      style={{
        width: header.column.getSize(),
        textAlign: header.column.columnDef.meta?.align || "left",
        position: "relative",
        display: "flex",
        alignItems: "center",
      }}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.05,
        zIndex: 999,
        // boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <motion.div
        className="drag-handle"
        onPointerDown={(e) => controls.start(e)}
        initial={{ opacity: 0.5 }}
        whileHover={{ opacity: 1 }}
        whileDrag={{ scale: 1.1, cursor: "grabbing" }}
        style={{
          // display: "inline-block",
          cursor: "grab",
          userSelect: "none",
          marginRight: "8px",
          fontSize: "12px",
          lineHeight: "1",
        }}
      >
        ⋮⋮
      </motion.div>
      <motion.div
        className={
          header.column.getCanSort() ? "cursor-pointer select-none" : ""
        }
        onClick={header.column.getToggleSortingHandler()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
      >
        {flexRender(header.column.columnDef.header, header.getContext())}
        {header.column.getCanSort() && (
          <span className="sort-indicator">
            {{
              asc: " ▲",
              desc: " ▼",
            }[header.column.getIsSorted()] ?? ""}
          </span>
        )}
      </motion.div>
    </Reorder.Item>
  );
});

const DataTable = ({
  data,
  columns,
  manualPagination,
  manualSorting,
  manualGlobalFilter,
  manualColumnFilters,
  pageCount,
  pagination,
  setPagination,
  sorting,
  setSorting,
  globalFilter,
  setGlobalFilter,
  columnFilters,
  setColumnFilters,
  loading,
  totalRowCount,
  columnOrder,
  setColumnOrder,
}) => {
  const [selected, setSelected] = useState(null);
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
      columnOrder,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    manualPagination,
    manualSorting,
    manualGlobalFilter,
    manualColumnFilters,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    debugTable: false,
    debugHeaders: false,
    debugColumns: false,
  });

  const {
    getHeaderGroups,
    getRowModel,
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
    <motion.div
      className="data-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className="table-controls"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ display: "flex" }}
      >
        <motion.input
          type="text"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Global Search..."
          className="global-filter-input"
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          whileFocus={{ scale: 1.01, borderColor: "#007bff" }}
          transition={{ duration: 0.2 }}
        />
        <motion.div
          className="pagination-controls"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.button
            onClick={() => setPageIndex(0)}
            disabled={!getCanPreviousPage()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            «
          </motion.button>
          <motion.button
            onClick={() => previousPage()}
            disabled={!getCanPreviousPage()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            ‹
          </motion.button>
          <motion.span
            className="page-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            Page{" "}
            <strong>
              {tablePagination.pageIndex + 1} of {getPageCount()}
            </strong>
          </motion.span>
          <motion.button
            onClick={() => nextPage()}
            disabled={!getCanNextPage()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            ›
          </motion.button>
          <motion.button
            onClick={() => setPageIndex(getPageCount() - 1)}
            disabled={!getCanNextPage()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
          >
            »
          </motion.button>
          <motion.select
            value={tablePagination.pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
            }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.1 }}
          >
            {[5, 10, 20, 30, 40, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </motion.select>
        </motion.div>
      </motion.div>
      <div className="table-wrapper">
        <table>
          <thead>
            {(() => {
              const headerGroup = getHeaderGroups()[0];
              if (!headerGroup) return null;
              return (
                <tr
                  style={{
                    display: "flex",
                  }}
                >
                  <Reorder.Group
                    as={React.Fragment}
                    axis="x"
                    values={columnOrder}
                    onReorder={setColumnOrder}
                    layoutScroll
                  >
                    {headerGroup.headers.map((header) => (
                      <ColumnHeader key={header.id} header={header} />
                    ))}
                  </Reorder.Group>
                </tr>
              );
            })()}
          </thead>
          <tbody>
            <AnimatePresence>
              {loading ? (
                <motion.tr
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td colSpan={columns.length} style={{ textAlign: "center" }}>
                    Loading data...
                  </td>
                </motion.tr>
              ) : getRowModel().rows.length ? (
                getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <motion.td
                          key={cell.id}
                          layout
                          style={{
                            textAlign:
                              cell.column.columnDef.meta?.align || "left",
                            width: cell.column.getSize(),
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            textWrap: selected === index ? "wrap" : "nowrap",
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                          onTap={() => {
                            setSelected((prev) => {
                              if (prev != null) {
                                return null;
                              }
                              return index;
                            });
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </motion.td>
                      );
                    })}
                  </motion.tr>
                ))
              ) : (
                <motion.tr
                  key="no-data"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td colSpan={columns.length} style={{ textAlign: "center" }}>
                    No data available
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default DataTable;
