/* eslint-disable no-unused-vars */
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Grid3x3,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Rows,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

const ROW_SIZES = {
  small: { padding: "4px 8px", fontSize: "0.8rem" },
  medium: { padding: "8px 12px", fontSize: "0.875rem" },
  large: { padding: "12px 16px", fontSize: "0.95rem" },
};

const ColumnHeader = ({
  header,
  columnFilters,
  setColumnFilters,
  rowSize,
  darkMode,
  pinnedColumns,
  setPinnedColumns,
  allHeaders,
  showGridLines,
  columnOrder,
  setColumnOrder,
}) => {
  const [showFilter, setShowFilter] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const filterRef = useRef(null);
  const headerRef = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const draggedOverIndex = useRef(null);

  const filterType = header.column.columnDef.meta?.filterType;
  const filterObj = columnFilters.find((f) => f.id === header.id) ?? {};
  const filterValue = filterObj.value ?? "";
  const filterOp =
    filterObj.op ?? (filterType === "number" ? "eq" : "contains");
  const filterValue2 = filterObj.value2 ?? "";

  const isSticky =
    header.id === "actions" || header.column.columnDef.meta?.sticky;
  const pinnedInfo = pinnedColumns[header.id];
  const isPinned = !!pinnedInfo;
  const pinSide = pinnedInfo?.side;

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
          { id: header.id, op: filterOp, value: value, value2: filterValue2 },
        ];
      }
      if (filterOp === "is_blank" || filterOp === "is_not_blank") {
        return [...others, { id: header.id, op: filterOp }];
      }
      if (value === "") return others;
      return [...others, { id: header.id, op: filterOp, value: value }];
    });
  };

  const handleOpChange = (e) => {
    const op = e.target.value;
    setColumnFilters((prev) => {
      const others = prev.filter((f) => f.id !== header.id);
      if (op === "is_blank" || op === "is_not_blank") {
        return [...others, { id: header.id, op: op }];
      }
      return [...others, { id: header.id, op: op, value: "", value2: "" }];
    });
  };

  const handleValue2Change = (e) => {
    const value2 = e.target.value;
    setColumnFilters((prev) => {
      const others = prev.filter((f) => f.id !== header.id);
      return [
        ...others,
        { id: header.id, op: filterOp, value: filterValue, value2: value2 },
      ];
    });
  };

  const handleResetColumnFilter = () => {
    setColumnFilters((prev) => prev.filter((f) => f.id !== header.id));
    setShowFilter(false);
  };

  const handlePin = (side) => {
    setPinnedColumns((prev) => {
      if (prev[header.id]?.side === side) {
        const newPinned = { ...prev };
        delete newPinned[header.id];
        return newPinned;
      }

      const leftPinned = Object.entries(prev)
        .filter(([_, v]) => v.side === "left")
        .map(([k]) => k);
      const rightPinned = Object.entries(prev)
        .filter(([_, v]) => v.side === "right")
        .map(([k]) => k);
      const currentIndex = allHeaders.findIndex((h) => h.id === header.id);

      return {
        ...prev,
        [header.id]: {
          side,
          order: side === "left" ? leftPinned.length : rightPinned.length,
          originalIndex: currentIndex,
        },
      };
    });
  };

  const getPinnedPosition = () => {
    if (!isPinned) return {};

    const sameSidePinned = Object.entries(pinnedColumns)
      .filter(([_, v]) => v.side === pinSide)
      .sort((a, b) => a[1].order - b[1].order);

    let offset = 0;
    for (const [colId] of sameSidePinned) {
      if (colId === header.id) break;
      const col = allHeaders.find((h) => h.id === colId);
      if (col) offset += col.column.getSize();
    }

    return {
      position: "sticky",
      [pinSide]: offset,
      zIndex: 20,
      boxShadow:
        pinSide === "left"
          ? "2px 0 8px -2px rgba(0,0,0,0.10)"
          : "-2px 0 8px -2px rgba(0,0,0,0.10)",
      backdropFilter: "blur(2px)",
      backgroundColor: darkMode ? "#1e293b" : "#f8f9fa",
    };
  };

  const handlePointerDown = (e) => {
    if (isPinned || isSticky) return;
    e.preventDefault();
    setIsDragging(true);
    const rect = headerRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragStartPos.current = { x: rect.left, y: rect.top };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      if (headerRef.current) {
        const x = e.clientX - dragOffset.current.x;
        const y = dragStartPos.current.y;
        headerRef.current.style.position = "fixed";
        headerRef.current.style.left = `${x}px`;
        headerRef.current.style.top = `${y}px`;
        headerRef.current.style.zIndex = "1000";
        headerRef.current.style.pointerEvents = "none";
      }
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      if (headerRef.current) {
        headerRef.current.style.position = "";
        headerRef.current.style.left = "";
        headerRef.current.style.top = "";
        headerRef.current.style.zIndex = "";
        headerRef.current.style.pointerEvents = "";
      }
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

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
    <th
      ref={headerRef}
      colSpan={header.colSpan}
      style={{
        width: header.column.getSize(),
        minWidth: header.column.getSize(),
        textAlign: header.column.columnDef.meta?.align || "left",
        ...getPinnedPosition(),
        display: "flex",
        alignItems: "center",
        border: showGridLines
          ? darkMode
            ? "1px solid #374151"
            : "1px solid #ddd"
          : "none",
        backgroundColor: darkMode ? "#1e293b" : "#f8f9fa",
        color: darkMode ? "#e2e8f0" : "#334155",
        ...ROW_SIZES[rowSize],
        position: isPinned ? "sticky" : "relative",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      <motion.div
        className="drag-handle"
        onPointerDown={handlePointerDown}
        whileHover={{ opacity: isPinned || isSticky ? 0.3 : 1 }}
        style={{
          cursor: isPinned || isSticky ? "default" : "grab",
          userSelect: "none",
          marginRight: "8px",
          fontSize: "12px",
          lineHeight: "1",
          color: darkMode ? "#94a3b8" : "#64748b",
          opacity: isPinned || isSticky ? 0.3 : 0.5,
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
          gap: "6px",
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
            <motion.span
              className="sort-indicator"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {header.column.getIsSorted() === "asc" && " ▲"}
              {header.column.getIsSorted() === "desc" && " ▼"}
            </motion.span>
          )}
        </span>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          {!isSticky && (
            <motion.span
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                color: isPinned ? "#007bff" : darkMode ? "#94a3b8" : "#888",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handlePin(pinSide === "left" ? "right" : "left");
              }}
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 0.1 }}
              title={isPinned ? `Pinned ${pinSide}` : "Pin column"}
            >
              {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
            </motion.span>
          )}
          {filterType && (
            <motion.span
              style={{
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                color: isFilterActive
                  ? "#007bff"
                  : darkMode
                  ? "#94a3b8"
                  : "#888",
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
        </div>
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
            backgroundColor: darkMode ? "#1e293b" : "#fff",
            border: darkMode ? "1px solid #374151" : "1px solid #ddd",
            borderRadius: "4px",
            padding: "6px",
            boxShadow: darkMode
              ? "0 4px 12px rgba(0,0,0,0.4)"
              : "0 2px 8px rgba(0,0,0,0.08)",
            minWidth: "180px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <select
              value={filterOp}
              onChange={handleOpChange}
              style={{
                width: "100%",
                fontSize: "13px",
                padding: "4px",
                borderRadius: "3px",
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#0f172a" : "#fff",
                color: darkMode ? "#e2e8f0" : "black",
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
              <div style={{ display: "flex", gap: "4px" }}>
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
                    border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                    background: darkMode ? "#0f172a" : "#fff",
                    color: darkMode ? "#e2e8f0" : "black",
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
                    border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                    background: darkMode ? "#0f172a" : "#fff",
                    color: darkMode ? "#e2e8f0" : "black",
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
                  border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                  background: darkMode ? "#0f172a" : "#fff",
                  color: darkMode ? "#e2e8f0" : "black",
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
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#0f172a" : "#f5f5f5",
                cursor: "pointer",
                color: darkMode ? "#e2e8f0" : "#333",
              }}
            >
              Reset
            </button>
          </div>
        </motion.div>
      )}
    </th>
  );
};

const ColumnChooser = ({
  columns,
  columnVisibility,
  setColumnVisibility,
  darkMode,
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  const filteredColumns = columns.filter((col) =>
    col.header?.toLowerCase().includes(search.toLowerCase())
  );

  const allVisible = filteredColumns.every(
    (col) => columnVisibility[col.id] !== false
  );
  const someVisible = filteredColumns.some(
    (col) => columnVisibility[col.id] !== false
  );

  const handleSelectAll = () => {
    const newVisibility = { ...columnVisibility };
    filteredColumns.forEach((col) => {
      newVisibility[col.id] = !allVisible;
    });
    setColumnVisibility(newVisibility);
  };

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          fontSize: "13px",
          padding: "6px 12px",
          borderRadius: "4px",
          border: darkMode ? "1px solid #374151" : "1px solid #ccc",
          background: darkMode ? "#1e293b" : "#f5f5f5",
          cursor: "pointer",
          color: darkMode ? "#e2e8f0" : "#333",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          height: "32px",
        }}
      >
        <Settings2 size={16} />
        Columns
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              zIndex: 1000,
              backgroundColor: darkMode ? "#1e293b" : "#fff",
              border: darkMode ? "1px solid #374151" : "1px solid #ddd",
              borderRadius: "6px",
              padding: "8px",
              boxShadow: darkMode
                ? "0 4px 16px rgba(0,0,0,0.4)"
                : "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: "220px",
              maxHeight: "400px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: "4px 0 8px 0" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: darkMode ? "#94a3b8" : "#888",
                  }}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search columns..."
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    padding: "6px 6px 6px 28px",
                    borderRadius: "4px",
                    border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                    background: darkMode ? "#0f172a" : "#fff",
                    color: darkMode ? "#e2e8f0" : "black",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 4px",
                borderBottom: darkMode
                  ? "1px solid #374151"
                  : "1px solid #e2e8f0",
                marginBottom: "4px",
              }}
            >
              <input
                type="checkbox"
                checked={allVisible}
                ref={(el) =>
                  el && (el.indeterminate = someVisible && !allVisible)
                }
                onChange={handleSelectAll}
                style={{ cursor: "pointer" }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: darkMode ? "#e2e8f0" : "#333",
                }}
              >
                {allVisible ? "Unselect All" : "Select All"}
              </span>
            </div>

            <div style={{ overflowY: "auto", maxHeight: "300px" }}>
              {filteredColumns.map((col) => (
                <motion.label
                  key={col.id}
                  whileHover={{
                    backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 4px",
                    cursor: "pointer",
                    borderRadius: "3px",
                    transition: "background-color 0.15s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={columnVisibility[col.id] !== false}
                    onChange={(e) => {
                      setColumnVisibility({
                        ...columnVisibility,
                        [col.id]: e.target.checked,
                      });
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      color: darkMode ? "#e2e8f0" : "#333",
                    }}
                  >
                    {col.header}
                  </span>
                </motion.label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ActionsMenu = ({ row, onEdit, onDelete, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        justifyContent: "center",
      }}
      ref={ref}
    >
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: darkMode ? "#94a3b8" : "#64748b",
        }}
      >
        <MoreVertical size={18} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed",
              transform: "translate(-50%, 8px)",
              left: ref.current
                ? `${
                    ref.current.getBoundingClientRect().left +
                    ref.current.offsetWidth / 2
                  }px`
                : "50%",
              top: ref.current
                ? `${ref.current.getBoundingClientRect().bottom}px`
                : "auto",
              zIndex: 9999,
              backgroundColor: darkMode ? "#1e293b" : "#fff",
              border: darkMode ? "1px solid #374151" : "1px solid #ddd",
              borderRadius: "6px",
              padding: "4px",
              boxShadow: darkMode
                ? "0 4px 16px rgba(0,0,0,0.4)"
                : "0 4px 12px rgba(0,0,0,0.1)",
              minWidth: "140px",
            }}
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
                setIsOpen(false);
              }}
              whileHover={{ backgroundColor: darkMode ? "#334155" : "#f1f5f9" }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: darkMode ? "#e2e8f0" : "#333",
                fontSize: "13px",
                borderRadius: "4px",
                textAlign: "left",
              }}
            >
              <Pencil size={14} />
              Edit
            </motion.button>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
                setIsOpen(false);
              }}
              whileHover={{ backgroundColor: darkMode ? "#450a0a" : "#fee2e2" }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: darkMode ? "#f87171" : "#dc2626",
                fontSize: "13px",
                borderRadius: "4px",
                textAlign: "left",
              }}
            >
              <Trash2 size={14} />
              Delete
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  onEdit,
  onDelete,
  darkMode,
}) => {
  const [selected, setSelected] = useState(null);
  const [rowSize, setRowSize] = useState("medium");
  const [showGridLines, setShowGridLines] = useState(true);
  const [stripedRows, setStripedRows] = useState(true);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pinnedColumns, setPinnedColumns] = useState({});
  const [focusedCell, setFocusedCell] = useState(null);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
      columnOrder,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
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
  const handleResetAllFilters = () => setColumnFilters([]);

  const tableRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableRef.current && !tableRef.current.contains(e.target)) {
        setFocusedCell(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!focusedCell || !tableRef.current) return;

      const rows = getRowModel().rows;
      const visibleCells = rows[focusedCell.row]?.getVisibleCells() || [];

      let newRow = focusedCell.row;
      let newCol = focusedCell.col;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          newRow = Math.max(0, focusedCell.row - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          newRow = Math.min(rows.length - 1, focusedCell.row + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          newCol = Math.max(0, focusedCell.col - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          newCol = Math.min(visibleCells.length - 1, focusedCell.col + 1);
          break;
        case "Home":
          e.preventDefault();
          if (e.ctrlKey) newRow = 0;
          newCol = 0;
          break;
        case "End":
          e.preventDefault();
          if (e.ctrlKey) newRow = rows.length - 1;
          newCol = visibleCells.length - 1;
          break;
        case "PageUp":
          e.preventDefault();
          if (getCanPreviousPage()) previousPage();
          break;
        case "PageDown":
          e.preventDefault();
          if (getCanNextPage()) nextPage();
          break;
        default:
          return;
      }

      setFocusedCell({ row: newRow, col: newCol });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    focusedCell,
    getRowModel,
    getCanPreviousPage,
    getCanNextPage,
    previousPage,
    nextPage,
  ]);

  return (
    <motion.div
      ref={tableRef}
      className="data-table-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        backgroundColor: darkMode ? "#0f172a" : "#fff",
        color: darkMode ? "#e2e8f0" : "#334155",
        padding: "16px",
        borderRadius: "8px",
      }}
    >
      <motion.div
        className="table-controls"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <motion.div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              padding: 0,
              margin: 0,
            }}
          >
            Product List ({totalRowCount.toLocaleString()} total products)
          </motion.h2>
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
            style={{
              padding: "8px 12px",
              borderRadius: "4px",
              border: darkMode ? "1px solid #374151" : "1px solid #ced4da",
              background: darkMode ? "#1e293b" : "#fff",
              color: darkMode ? "#e2e8f0" : "#000",
              fontSize: "0.9rem",
              minWidth: "200px",
            }}
          />
        </motion.div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "8px",
            }}
          >
            <select
              value={rowSize}
              onChange={(e) => setRowSize(e.target.value)}
              style={{
                fontSize: "13px",
                padding: "6px 12px",
                borderRadius: "4px",
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#1e293b" : "#f5f5f5",
                cursor: "pointer",
                color: darkMode ? "#e2e8f0" : "#333",
                height: "32px",
              }}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>

            <motion.button
              onClick={() => setShowGridLines(!showGridLines)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                fontSize: "13px",
                padding: "6px 12px",
                borderRadius: "4px",
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#1e293b" : "#f5f5f5",
                cursor: "pointer",
                color: darkMode ? "#e2e8f0" : "#333",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                height: "32px",
              }}
            >
              <Grid3x3 size={16} />
              {showGridLines ? "Hide" : "Show"} Grid
            </motion.button>

            <motion.button
              onClick={() => setStripedRows(!stripedRows)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                fontSize: "13px",
                padding: "6px 12px",
                borderRadius: "4px",
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#1e293b" : "#f5f5f5",
                cursor: "pointer",
                color: darkMode ? "#e2e8f0" : "#333",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                height: "32px",
              }}
            >
              <Rows size={16} />
              {stripedRows ? "Solid" : "Striped"}
            </motion.button>

            <ColumnChooser
              columns={columns.map((col) => ({
                id: col.id || col.accessorKey,
                header: typeof col.header === "string" ? col.header : col.id,
              }))}
              columnVisibility={columnVisibility}
              setColumnVisibility={setColumnVisibility}
              darkMode={darkMode}
            />

            <motion.button
              onClick={handleResetAllFilters}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                fontSize: "13px",
                padding: "6px 12px",
                borderRadius: "4px",
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#1e293b" : "#f5f5f5",
                cursor: "pointer",
                color: darkMode ? "#e2e8f0" : "#333",
                height: "32px",
              }}
            >
              Reset Filters
            </motion.button>
          </div>

          <motion.div
            className="pagination-controls"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <motion.button
              onClick={() => {
                setPageIndex(0);
                setSelected(null);
              }}
              disabled={!getCanPreviousPage()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              style={{
                display: "flex",
                padding: "6px",
                borderRadius: "4px",
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#1e293b" : "#f5f5f5",
                cursor: getCanPreviousPage() ? "pointer" : "not-allowed",
                opacity: getCanPreviousPage() ? 1 : 0.5,
                color: darkMode ? "#e2e8f0" : "#333",
              }}
            >
              <ChevronsLeft size={18} />
            </motion.button>
            <motion.button
              onClick={() => {
                previousPage();
                setSelected(null);
              }}
              disabled={!getCanPreviousPage()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              style={{
                display: "flex",
                padding: "6px",
                borderRadius: "4px",
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#1e293b" : "#f5f5f5",
                cursor: getCanPreviousPage() ? "pointer" : "not-allowed",
                opacity: getCanPreviousPage() ? 1 : 0.5,
                color: darkMode ? "#e2e8f0" : "#333",
              }}
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.span
              className="page-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                fontSize: "14px",
                color: darkMode ? "#e2e8f0" : "#495057",
              }}
            >
              Page{" "}
              <strong>
                {tablePagination.pageIndex + 1} of {getPageCount()}
              </strong>
            </motion.span>
            <motion.button
              onClick={() => {
                nextPage();
                setSelected(null);
              }}
              disabled={!getCanNextPage()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              style={{
                display: "flex",
                padding: "6px",
                borderRadius: "4px",
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#1e293b" : "#f5f5f5",
                cursor: getCanNextPage() ? "pointer" : "not-allowed",
                opacity: getCanNextPage() ? 1 : 0.5,
                color: darkMode ? "#e2e8f0" : "#333",
              }}
            >
              <ChevronRight size={18} />
            </motion.button>
            <motion.button
              onClick={() => {
                setPageIndex(getPageCount() - 1);
                setSelected(null);
              }}
              disabled={!getCanNextPage()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
              style={{
                display: "flex",
                padding: "6px",
                borderRadius: "4px",
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#1e293b" : "#f5f5f5",
                cursor: getCanNextPage() ? "pointer" : "not-allowed",
                opacity: getCanNextPage() ? 1 : 0.5,
                color: darkMode ? "#e2e8f0" : "#333",
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
              style={{
                fontSize: "13px",
                padding: "6px 12px",
                borderRadius: "4px",
                border: darkMode ? "1px solid #374151" : "1px solid #ccc",
                background: darkMode ? "#1e293b" : "#f5f5f5",
                cursor: "pointer",
                color: darkMode ? "#e2e8f0" : "#333",
              }}
            >
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  Show {pageSize}
                </option>
              ))}
            </motion.select>
          </motion.div>
        </div>
      </motion.div>
      <div
        className="table-wrapper"
        style={{
          overflowX: "auto",
          borderRadius: "6px",
          border: darkMode ? "1px solid #374151" : "1px solid #ddd",
          backgroundColor: darkMode ? "#0f172a" : "#fff",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: darkMode ? "#0f172a" : "#fff",
          }}
        >
          <thead>
            {(() => {
              const headerGroup = getHeaderGroups()[0];
              if (!headerGroup) return null;

              const leftPinned = headerGroup.headers
                .filter((h) => pinnedColumns[h.id]?.side === "left")
                .sort(
                  (a, b) =>
                    pinnedColumns[a.id].order - pinnedColumns[b.id].order
                );
              const rightPinned = headerGroup.headers
                .filter((h) => pinnedColumns[h.id]?.side === "right")
                .sort(
                  (a, b) =>
                    pinnedColumns[a.id].order - pinnedColumns[b.id].order
                );
              const unpinned = headerGroup.headers.filter(
                (h) => !pinnedColumns[h.id]
              );

              return (
                <tr style={{ display: "flex" }}>
                  {leftPinned.map((header) => (
                    <ColumnHeader
                      key={header.id}
                      header={header}
                      columnFilters={columnFilters}
                      setColumnFilters={setColumnFilters}
                      rowSize={rowSize}
                      darkMode={darkMode}
                      pinnedColumns={pinnedColumns}
                      setPinnedColumns={setPinnedColumns}
                      allHeaders={headerGroup.headers}
                      showGridLines={showGridLines}
                    />
                  ))}

                  {unpinned.map((header) => (
                    <ColumnHeader
                      key={header.id}
                      header={header}
                      columnFilters={columnFilters}
                      setColumnFilters={setColumnFilters}
                      rowSize={rowSize}
                      darkMode={darkMode}
                      pinnedColumns={pinnedColumns}
                      setPinnedColumns={setPinnedColumns}
                      allHeaders={headerGroup.headers}
                      showGridLines={showGridLines}
                    />
                  ))}

                  {rightPinned.map((header) => (
                    <ColumnHeader
                      key={header.id}
                      header={header}
                      columnFilters={columnFilters}
                      setColumnFilters={setColumnFilters}
                      rowSize={rowSize}
                      darkMode={darkMode}
                      pinnedColumns={pinnedColumns}
                      setPinnedColumns={setPinnedColumns}
                      allHeaders={headerGroup.headers}
                      showGridLines={showGridLines}
                    />
                  ))}
                </tr>
              );
            })()}
          </thead>
          <tbody style={{ paddingBottom: "10px" }}>
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
                        color: darkMode ? "#94a3b8" : "#888",
                      }}
                    >
                      Loading data...
                    </div>
                  </td>
                </motion.tr>
              ) : getRowModel().rows.length ? (
                getRowModel().rows.map((row, rowIndex) => {
                  const allCells = row.getVisibleCells();
                  const leftPinnedCells = allCells
                    .filter(
                      (cell) => pinnedColumns[cell.column.id]?.side === "left"
                    )
                    .sort(
                      (a, b) =>
                        pinnedColumns[a.column.id].order -
                        pinnedColumns[b.column.id].order
                    );
                  const rightPinnedCells = allCells
                    .filter(
                      (cell) => pinnedColumns[cell.column.id]?.side === "right"
                    )
                    .sort(
                      (a, b) =>
                        pinnedColumns[a.column.id].order -
                        pinnedColumns[b.column.id].order
                    );
                  const unpinnedCells = allCells.filter(
                    (cell) => !pinnedColumns[cell.column.id]
                  );

                  const orderedCells = [
                    ...leftPinnedCells,
                    ...unpinnedCells,
                    ...rightPinnedCells,
                  ];

                  return (
                    <motion.tr
                      key={row.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: rowIndex * 0.03 }}
                      style={{
                        backgroundColor:
                          stripedRows && rowIndex % 2 === 1
                            ? darkMode
                              ? "#1e293b"
                              : "#f8f9fb"
                            : darkMode
                            ? "#0f172a"
                            : "#fff",
                      }}
                      whileHover={{
                        backgroundColor: darkMode ? "#334155" : "#f1f5f9",
                        transition: { duration: 0.15 },
                      }}
                    >
                      {orderedCells.map((cell) => {
                        const colIndex = allCells.findIndex(
                          (c) => c.id === cell.id
                        );
                        const pinnedInfo = pinnedColumns[cell.column.id];
                        const isPinned = !!pinnedInfo;
                        const pinSide = pinnedInfo?.side;
                        const isExpanded = selected === rowIndex && !isPinned;
                        const isFocused =
                          focusedCell &&
                          focusedCell.row === rowIndex &&
                          focusedCell.col === colIndex;

                        const getPinnedPosition = () => {
                          if (!isPinned) return {};

                          const sameSidePinned = Object.entries(pinnedColumns)
                            .filter(([_, v]) => v.side === pinSide)
                            .sort((a, b) => a[1].order - b[1].order);

                          let offset = 0;
                          for (const [colId] of sameSidePinned) {
                            if (colId === cell.column.id) break;
                            const col = getHeaderGroups()[0].headers.find(
                              (h) => h.id === colId
                            );
                            if (col) offset += col.column.getSize();
                          }

                          return {
                            position: "sticky",
                            [pinSide]: offset,
                            zIndex: 15,
                            boxShadow:
                              pinSide === "left"
                                ? "2px 0 8px -2px rgba(0,0,0,0.10)"
                                : "-2px 0 8px -2px rgba(0,0,0,0.10)",
                            backdropFilter: "blur(2px)",
                          };
                        };

                        return (
                          <motion.td
                            key={cell.id}
                            layout
                            style={{
                              textAlign:
                                cell.column.columnDef.meta?.align || "left",
                              width: cell.column.getSize(),
                              minWidth: cell.column.getSize(),
                              ...getPinnedPosition(),
                              overflow:
                                isExpanded || cell.column.id === "actions"
                                  ? "visible"
                                  : "hidden",
                              whiteSpace: isExpanded ? "normal" : "nowrap",
                              textOverflow: isExpanded ? "unset" : "ellipsis",
                              ...ROW_SIZES[rowSize],
                              border: showGridLines
                                ? darkMode
                                  ? "1px solid #374151"
                                  : "1px solid #e0e0e0"
                                : "none",
                              outline: isFocused
                                ? darkMode
                                  ? "1px solid #3b82f6"
                                  : "1px solid #3b82f6"
                                : "none",
                              outlineOffset: "-1px",
                              backgroundColor: isPinned
                                ? stripedRows && rowIndex % 2 === 1
                                  ? darkMode
                                    ? "#1e293b"
                                    : "#f8f9fb"
                                  : darkMode
                                  ? "#0f172a"
                                  : "#fff"
                                : undefined,
                              color: darkMode ? "#e2e8f0" : "#334155",
                              cursor: "pointer",
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected((prev) => {
                                if (prev != null) {
                                  return null;
                                }
                                return rowIndex;
                              });
                              setFocusedCell({ row: rowIndex, col: colIndex });
                            }}
                            tabIndex={0}
                            onFocus={() => {
                              setFocusedCell({ row: rowIndex, col: colIndex });
                            }}
                          >
                            {cell.column.id === "actions" ? (
                              <ActionsMenu
                                row={row.original}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                darkMode={darkMode}
                              />
                            ) : (
                              flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )
                            )}
                          </motion.td>
                        );
                      })}
                    </motion.tr>
                  );
                })
              ) : (
                <motion.tr
                  key="no-data"
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
                        color: darkMode ? "#94a3b8" : "#888",
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
