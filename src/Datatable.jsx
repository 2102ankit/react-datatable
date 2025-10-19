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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

const TEXT_FILTERS = [
  { label: "Contains", value: "contains" },
  { label: "Does not contain", value: "not_contains" },
  { label: "Begins with", value: "begins_with" },
  { label: "Ends with", value: "ends_with" },
  { label: "Equals", value: "equals" },
  { label: "Does not equal", value: "not_equals" },
  { label: "Is blank", value: "is_blank" },
  { label: "Is not blank", value: "is_not_blank" },
];

const NUMBER_FILTERS = [
  { label: "Equal to", value: "eq" },
  { label: "Not equal to", value: "neq" },
  { label: "Greater than", value: "gt" },
  { label: "Lesser than", value: "lt" },
  { label: "Greater than or equal to", value: "gte" },
  { label: "Lesser than or equal to", value: "lte" },
  { label: "between", value: "between" },
];

const ColumnHeader = ({
  header,
  columnFilters,
  setColumnFilters,
  isCompact,
}) => {
  const controls = useDragControls();
  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef(null);
  const filterType = header.column.columnDef.meta?.filterType;
  const filterObj = columnFilters.find((f) => f.id === header.id) ?? {};
  const filterValue = filterObj.value ?? "";
  const filterOp =
    filterObj.op ?? (filterType === "number" ? "eq" : "contains");
  const filterValue2 = filterObj.value2 ?? "";

  const isSticky =
    header.id === "actions" || header.column.columnDef.meta?.sticky;

  const isFilterActive =
    filterOp === "is_blank" ||
    filterOp === "is_not_blank" ||
    (filterType === "number" &&
      filterOp === "between" &&
      (filterValue || filterValue2)) ||
    !!filterValue;

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setColumnFilters((prev) => {
      const others = prev.filter((f) => f.id !== header.id);
      if (filterType === "number" && filterOp === "between") {
        if (!value && !filterValue2) return others;
        return [
          ...others,
          {
            id: header.id,
            op: filterOp,
            value: value,
            value2: filterValue2,
          },
        ];
      }
      if (filterOp === "is_blank" || filterOp === "is_not_blank") {
        return [
          ...others,
          {
            id: header.id,
            op: filterOp,
          },
        ];
      }
      if (value === "") return others;

      return [
        ...others,
        {
          id: header.id,
          op: filterOp,
          value: value,
        },
      ];
    });
  };

  const handleOpChange = (e) => {
    const op = e.target.value;
    setColumnFilters((prev) => {
      const others = prev.filter((f) => f.id !== header.id);
      if (op === "is_blank" || op === "is_not_blank") {
        return [
          ...others,
          {
            id: header.id,
            op: op,
          },
        ];
      }
      return [
        ...others,
        {
          id: header.id,
          op: op,
          value: "",
          value2: "",
        },
      ];
    });
  };

  const handleValue2Change = (e) => {
    const value2 = e.target.value;
    setColumnFilters((prev) => {
      const others = prev.filter((f) => f.id !== header.id);
      return [
        ...others,
        {
          id: header.id,
          op: filterOp,
          value: filterValue,
          value2: value2,
        },
      ];
    });
  };

  const handleResetColumnFilter = () => {
    setColumnFilters((prev) => prev.filter((f) => f.id !== header.id));
    setShowFilter(false);
  };

  useEffect(() => {
    if (!showFilter) return;
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilter]);

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
        position: isSticky ? "sticky" : "relative",
        left: isSticky ? 0 : undefined,
        zIndex: isSticky ? 20 : undefined,
        boxShadow: isSticky ? "2px 0 8px -2px rgba(0,0,0,0.10)" : undefined,
        backdropFilter: isSticky ? "blur(2px)" : undefined,
        backgroundColor: isSticky ? "#f8f9fa" : undefined,
        display: "flex",
        alignItems: "center",
        border: "1px solid #ddd",
      }}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.05,
        zIndex: 999,
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
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <span
          className={
            header.column.getCanSort() ? "cursor-pointer select-none" : ""
          }
          onClick={header.column.getToggleSortingHandler()}
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            userSelect: "none",
          }}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {header.column.getCanSort() && (
            <span className="sort-indicator">
              {header.column.getIsSorted() === "asc" && " ▲"}
              {header.column.getIsSorted() === "desc" && " ▼"}
            </span>
          )}
        </span>
        {filterType && (
          <motion.span
            style={{
              marginLeft: "6px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              color: isFilterActive ? "#007bff" : "#888",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowFilter((prev) => !prev);
            }}
            whileHover={{ scale: 1.2 }}
            transition={{ duration: 0.1 }}
            title="Filter"
          >
            <Filter size={16} />
          </motion.span>
        )}
      </motion.div>
      {showFilter && filterType && (
        <motion.div
          ref={filterRef}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 100,
            backgroundColor: "#fff",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: isCompact ? "3px" : "6px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            minWidth: "180px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "4px",
            }}
          >
            <select
              value={filterOp}
              onChange={handleOpChange}
              style={{
                width: "100%",
                fontSize: "13px",
                marginBottom: "4px",
                padding: "4px",
                borderRadius: "3px",
                border: "1px solid #ccc",
                background: "#fff",
                color: "black",
              }}
            >
              {(filterType === "number" ? NUMBER_FILTERS : TEXT_FILTERS).map(
                (f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                )
              )}
            </select>

            {filterType === "number" && filterOp === "between" ? (
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                }}
              >
                <input
                  type="number"
                  value={filterValue}
                  onChange={handleFilterChange}
                  placeholder="Min"
                  style={{
                    width: "50%",
                    fontSize: "13px",
                    padding: "4px",
                    borderRadius: "3px",
                    border: "1px solid #ccc",
                    background: "#fff",
                    color: "black",
                  }}
                  autoFocus
                />
                <input
                  type="number"
                  value={filterValue2}
                  onChange={handleValue2Change}
                  placeholder="Max"
                  style={{
                    width: "50%",
                    fontSize: "13px",
                    padding: "4px",
                    borderRadius: "3px",
                    border: "1px solid #ccc",
                    background: "#fff",
                    color: "black",
                  }}
                />
              </div>
            ) : filterOp !== "is_blank" && filterOp !== "is_not_blank" ? (
              <input
                type={filterType === "number" ? "number" : "text"}
                value={filterValue}
                onChange={handleFilterChange}
                placeholder={`${header.column.columnDef.header}`}
                style={{
                  width: "100%",
                  fontSize: "13px",
                  padding: "4px",
                  borderRadius: "3px",
                  border: "1px solid #ccc",
                  background: "#fff",
                  color: "black",
                }}
                autoFocus
              />
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={handleResetColumnFilter}
              style={{
                marginTop: "4px",
                fontSize: "12px",
                padding: "2px 8px",
                borderRadius: "3px",
                border: "1px solid #ccc",
                background: "#f5f5f5",
                cursor: "pointer",
                color: "#333",
              }}
            >
              Reset
            </button>
          </div>
        </motion.div>
      )}
    </Reorder.Item>
  );
};

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
  const [compact, setCompact] = useState(false);
  const handleResetAllFilters = () => setColumnFilters([]);

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
        style={{ display: "flex", alignItems: "center", gap: "12px" }}
      >
        <motion.input
          type="text"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Global Search..."
          className="global-filter-input"
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          whileFocus={{ scale: 1.01, borderColor: "grey" }}
          transition={{ duration: 0.2 }}
        />
        <button
          onClick={() => setCompact((prev) => !prev)}
          style={{
            marginLeft: "8px",
            fontSize: "13px",
            padding: "4px 12px",
            borderRadius: "3px",
            border: "1px solid #ccc",
            background: "#f5f5f5",
            cursor: "pointer",
            color: "#333",
            height: "32px",
          }}
        >
          {compact ? "Disable Compact View" : "Enable Compact View"}
        </button>
        <button
          onClick={handleResetAllFilters}
          style={{
            marginLeft: "8px",
            fontSize: "13px",
            padding: "4px 12px",
            borderRadius: "3px",
            border: "1px solid #ccc",
            background: "#f5f5f5",
            cursor: "pointer",
            color: "#333",
            height: "32px",
          }}
        >
          Reset All Filters
        </button>
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
            style={{
              display: "flex",
            }}
          >
            <ChevronsLeft size={18} />
          </motion.button>
          <motion.button
            onClick={() => previousPage()}
            disabled={!getCanPreviousPage()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              display: "flex",
            }}
          >
            <ChevronLeft size={18} />
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
            style={{
              display: "flex",
            }}
          >
            <ChevronRight size={18} />
          </motion.button>
          <motion.button
            onClick={() => setPageIndex(getPageCount() - 1)}
            disabled={!getCanNextPage()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              display: "flex",
            }}
          >
            <ChevronsRight size={18} />
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
                      <ColumnHeader
                        key={header.id}
                        header={header}
                        columnFilters={columnFilters}
                        setColumnFilters={setColumnFilters}
                        isCompact={compact}
                      />
                    ))}
                  </Reorder.Group>
                </tr>
              );
            })()}
          </thead>
          <tbody
            style={{
              paddingBottom: "10px",
            }}
          >
            <AnimatePresence>
              {loading ? (
                <motion.tr
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ height: "300px" }}
                >
                  <td
                    colSpan={columns.length}
                    style={{
                      textAlign: "center",
                      height: "300px",
                      verticalAlign: "middle",
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        width: "100%",
                        minHeight: "300px",
                        fontSize: "1.2rem",
                        fontWeight: "lighter",
                        color: "#888",
                      }}
                    >
                      Loading data...
                    </div>
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
                      const isSticky = cell.column.id === "actions";
                      const isExpanded = selected === index && !isSticky;
                      return (
                        <motion.td
                          key={cell.id}
                          layout
                          style={{
                            textAlign:
                              cell.column.columnDef.meta?.align || "left",
                            width: cell.column.getSize(),
                            position: isSticky ? "sticky" : "relative",
                            left: isSticky ? 0 : undefined,
                            zIndex: isSticky ? 9999 : undefined,
                            boxShadow: isSticky
                              ? "2px 0 8px -2px rgba(0,0,0,0.10)"
                              : undefined,
                            backdropFilter: isSticky ? "blur(2px)" : undefined,
                            background: isSticky ? "#f8f9fa" : undefined,
                            overflow: isExpanded ? "visible" : "hidden",
                            whiteSpace: isExpanded ? "normal" : "nowrap",
                            textOverflow: isExpanded ? "unset" : "ellipsis",
                            padding: compact ? "4px 8px" : "10px 16px",
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
                  style={{
                    height: "300px",
                  }}
                >
                  <td
                    colSpan={columns.length}
                    style={{
                      textAlign: "center",
                      height: "300px",
                      verticalAlign: "middle",
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        width: "100%",
                        minHeight: "300px",
                        fontSize: "1.2rem",
                        fontWeight: "lighter",
                        color: "#888",
                      }}
                    >
                      No data available
                    </div>
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