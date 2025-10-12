/* eslint-disable no-unused-vars */
import { createColumnHelper } from "@tanstack/react-table";
import axios from "axios";
import { motion } from "framer-motion";
import React from "react";
import "./App.css";
import DataTable from "./Datatable";

const columnHelper = createColumnHelper();

function App() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [totalRowCount, setTotalRowCount] = React.useState(0);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = React.useState([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [columnOrder, setColumnOrder] = React.useState([]);

  const columns = React.useMemo(
    () => [
      columnHelper.accessor("id", { header: "ID", id: "id" }),
      columnHelper.accessor("title", { header: "Title", id: "title" }),
      columnHelper.accessor("description", {
        header: "Description",
        id: "description",
        minSize: 300,
      }),
      columnHelper.accessor("price", { header: "Price", id: "price" }),
      columnHelper.accessor("brand", { header: "Brand", id: "brand" }),
      columnHelper.accessor("category", { header: "Category", id: "category" }),
      columnHelper.accessor("stock", { header: "Stock", id: "stock" }),
      columnHelper.accessor("rating.rate", {
        header: "Rating",
        id: "rating.rate",
        accessorFn: (row) => row.rating?.rate,
      }),
    ],
    []
  );

  React.useEffect(() => {
    setColumnOrder(columns.map((col) => col.id));
  }, [columns]);

  const fetchData = React.useCallback(async () => {
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
        const column = columns.find((col) => col.accessorKey === filter.id);
        if (column && column.meta?.filterType === "text") {
          params.append(`${filter.id}_like`, filter.value);
        } else if (filter.value) {
          params.append(filter.id, filter.value);
        }
      });

      const { data } = await axios.get(
        `https://dummyjson.com/products?${params}`
      );
      const products = await data.products;
      const total = await data.total;

      setData(products);
      setTotalRowCount(total);
    } catch (e) {
      console.error("Failed to fetch products:", e);
      setError("Failed to load products. Please check the API.");
    } finally {
      setLoading(false);
    }
  }, [pagination, sorting, globalFilter, columnFilters, columns]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <motion.div
        className="App"
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
      className="App"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <header className="App-header">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          TanStack Table (React JS) - Server-Side
        </motion.h1>
      </header>
      <main className="container">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Product List ({totalRowCount.toLocaleString()} total products)
        </motion.h2>
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
        />
      </main>
    </motion.div>
  );
}

export default App;
