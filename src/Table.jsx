/* eslint-disable no-unused-vars */
import { createColumnHelper } from "@tanstack/react-table";
import axios from "axios";
import { motion } from "framer-motion";

import { useCallback, useEffect, useMemo, useState } from "react";
import DataTable from "./Datatable";
import "./table-style.css";

const columnHelper = createColumnHelper();

function Table({ darkMode }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalRowCount, setTotalRowCount] = useState(0);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnOrder, setColumnOrder] = useState([]);

  const handleEdit = (row) => {
    console.log("Edit row:", row);
    // Add your edit logic here
    alert(`Editing product: ${row.title}`);
  };

  const handleDelete = (row) => {
    console.log("Delete row:", row);
    // Add your delete logic here
    if (confirm(`Are you sure you want to delete "${row.title}"?`)) {
      // Delete logic here
      alert(`Deleted product: ${row.title}`);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "actions",
        header: "Actions",
        size: 100,
        meta: {
          sticky: true,
          align: "center",
        },
        enableSorting: false,
      }),
      columnHelper.accessor("id", {
        header: "ID",
        id: "id",
        meta: {
          filterType: "number",
          align: "center",
        },
        enableSorting: true,
      }),
      columnHelper.accessor("title", {
        header: "Title",
        id: "title",
        meta: {
          filterType: "text",
        },
        enableSorting: true,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        id: "description",
        minSize: 300,
        meta: {
          filterType: "text",
        },
        enableSorting: true,
      }),
      columnHelper.accessor("price", {
        header: "Price",
        id: "price",
        meta: {
          filterType: "number",
          align: "center",
        },
        enableSorting: true,
      }),
      columnHelper.accessor("brand", {
        header: "Brand",
        id: "brand",
        meta: {
          filterType: "text",
        },
        enableSorting: true,
      }),
      columnHelper.accessor("category", {
        header: "Category",
        id: "category",
        meta: {
          filterType: "text",
        },
        enableSorting: true,
      }),
      columnHelper.accessor("stock", {
        header: "Stock",
        id: "stock",
        meta: {
          filterType: "number",
          align: "center",
        },
        enableSorting: true,
      }),
      columnHelper.accessor("rating.rate", {
        header: "Rating",
        id: "rating.rate",
        accessorFn: (row) => row.rating?.rate,
        meta: {
          filterType: "number",
          align: "center",
        },
        enableSorting: true,
      }),
    ],
    []
  );

  useEffect(() => {
    setColumnOrder(columns.map((col) => col.id));
  }, [columns]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { pageIndex, pageSize } = pagination;

      const params = new URLSearchParams();
      params.append("limit", pageSize);
      params.append("skip", pageIndex * pageSize);

      if (sorting.length > 0) {
        params.append("sortBy", sorting[0].id);
        params.append("order", sorting[0].desc ? "desc" : "asc");
      }

      if (globalFilter) {
        params.append("q", globalFilter);
      }

      columnFilters.forEach((filter) => {
        const column = columns.find(
          (col) => col.id === filter.id || col.accessorKey === filter.id
        );
        if (column && column.meta?.filterType === "text") {
          switch (filter.op) {
            case "contains":
              params.append(`${filter.id}_like`, filter.value);
              break;
            case "not_contains":
              params.append(`${filter.id}_not_like`, filter.value);
              break;
            case "begins_with":
              params.append(`${filter.id}_starts_with`, filter.value);
              break;
            case "ends_with":
              params.append(`${filter.id}_ends_with`, filter.value);
              break;
            case "equals":
              params.append(`${filter.id}_eq`, filter.value);
              break;
            case "not_equals":
              params.append(`${filter.id}_neq`, filter.value);
              break;
            case "is_blank":
              params.append(`${filter.id}_blank`, "true");
              break;
            case "is_not_blank":
              params.append(`${filter.id}_not_blank`, "true");
              break;
            default:
              break;
          }
        } else if (column && column.meta?.filterType === "number") {
          switch (filter.op) {
            case "eq":
              params.append(`${filter.id}_eq`, filter.value);
              break;
            case "neq":
              params.append(`${filter.id}_neq`, filter.value);
              break;
            case "gt":
              params.append(`${filter.id}_gt`, filter.value);
              break;
            case "lt":
              params.append(`${filter.id}_lt`, filter.value);
              break;
            case "gte":
              params.append(`${filter.id}_gte`, filter.value);
              break;
            case "lte":
              params.append(`${filter.id}_lte`, filter.value);
              break;
            case "between":
              if (filter.value) params.append(`${filter.id}_gte`, filter.value);
              if (filter.value2)
                params.append(`${filter.id}_lte`, filter.value2);
              break;
            default:
              break;
          }
        }
      });

      const { data } = await axios.get(
        `http://localhost:3001/api/products?${params}`
        // `https://dummyjson.com/products?${params}` // Use local server for full features
      );
      const products = data.products;
      const total = data.total;

      setData(products);
      setTotalRowCount(total);
    } catch (e) {
      console.error("Failed to fetch products:", e);
      setError("Failed to load products. Please check the API.");
    } finally {
      setLoading(false);
    }
  }, [pagination, sorting, globalFilter, columnFilters, columns]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <motion.div
        className="table-layout"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="container" style={{ color: "red", marginTop: "50px" }}>
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            Error loading data:
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {error}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="table-layout"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <header className="table-layout-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          TanStack Table (React JS) - Server-Side
        </motion.h1>
      </header>
      <main className="container">
        <DataTable
          data={data}
          columns={columns}
          manualPagination={true}
          manualSorting={true}
          manualGlobalFilter={true}
          manualColumnFilters={true}
          pageCount={Math.ceil(totalRowCount / pagination.pageSize)}
          pagination={pagination}
          setPagination={setPagination}
          sorting={sorting}
          setSorting={setSorting}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
          columnFilters={columnFilters}
          setColumnFilters={setColumnFilters}
          loading={loading}
          totalRowCount={totalRowCount}
          columnOrder={columnOrder}
          setColumnOrder={setColumnOrder}
          onEdit={handleEdit}
          onDelete={handleDelete}
          darkMode={darkMode}
        />
      </main>
    </motion.div>
  );
}

export default Table;
