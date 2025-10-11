import React from "react";
import "./App.css";
import DataTable from "./Datatable";
import { generateProducts } from "./generateProducts";

const NUM_PRODUCTS = 100000;

function App() {
  const products = React.useMemo(() => {
    return generateProducts(NUM_PRODUCTS);
  }, []);
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "name",
        header: "Product Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: (info) => `$${info.getValue().toFixed(2)}`,
        meta: {
          align: "right", // Custom meta for styling
        },
      },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: (info) => info.getValue(),
        meta: {
          align: "center",
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const status = info.getValue();
          let color = "gray";
          if (status === "In Stock") color = "green";
          if (status === "Low Stock") color = "orange";
          if (status === "Out of Stock") color = "red";
          return (
            <span style={{ color: color, fontWeight: 500 }}>{status}</span>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      },
    ],
    []
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>TanStack Table ({NUM_PRODUCTS.toLocaleString()} products)</h1>
      </header>
      <main className="container">
        <h2>Product List</h2>
        <div className="table-container">
          <DataTable data={products} columns={columns} />
        </div>
      </main>
    </div>
  );
}

export default App;
