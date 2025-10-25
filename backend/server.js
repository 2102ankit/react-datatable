/* eslint-disable no-unused-vars */
import fs from "fs/promises";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global products array
let allProducts = [];

// Load products from products.json
async function loadProducts() {
  try {
    const filePath = path.join(process.cwd(), "products.json");
    console.log(`Attempting to load products from: ${filePath}`);
    await fs.access(filePath); // Check if file exists
    const fileData = await fs.readFile(filePath, "utf8");
    if (!fileData) {
      console.warn("products.json is empty");
      return;
    }
    const data = JSON.parse(fileData);
    allProducts = Array.isArray(data) ? data : data.products || [];
    console.log(`Loaded ${allProducts.length} products from products.json`);
    if (allProducts.length === 0) {
      console.warn("Warning: products.json contains no products");
    }
  } catch (error) {
    console.error(`Failed to load products.json: ${error.message}`);
    allProducts = [];
  }
}

// Initialize products on startup
loadProducts().catch((err) => {
  console.error(`Initial load error: ${err.message}`);
});

// Helper to apply text filter
function applyTextFilter(products, field, op, value) {
  if (!value) return products;
  value = value.toLowerCase().trim();
  return products.filter((product) => {
    const fieldValue = (product[field] || "").toString().toLowerCase().trim();
    switch (op) {
      case "contains":
        return fieldValue.includes(value);
      case "not_contains":
        return !fieldValue.includes(value);
      case "begins_with":
        return fieldValue.startsWith(value);
      case "ends_with":
        return fieldValue.endsWith(value);
      case "equals":
        return fieldValue === value;
      case "not_equals":
        return fieldValue !== value;
      case "is_blank":
        return !fieldValue;
      case "is_not_blank":
        return !!fieldValue;
      default:
        return true;
    }
  });
}

// Helper to apply number filter
function applyNumberFilter(products, field, op, value, value2 = null) {
  if (value === undefined || value === "") return products;
  const numValue = parseFloat(value);
  const numValue2 = value2 ? parseFloat(value2) : null;
  if (isNaN(numValue)) return products;

  const getFieldValue = (product) => {
    if (field === "rating.rate") return product.rating?.rate;
    return product[field];
  };

  return products.filter((product) => {
    const fieldValue = getFieldValue(product);
    const numFieldValue = parseFloat(fieldValue);
    if (isNaN(numFieldValue)) return false;

    switch (op) {
      case "eq":
        return numFieldValue === numValue;
      case "neq":
        return numFieldValue !== numValue;
      case "gt":
        return numFieldValue > numValue;
      case "lt":
        return numFieldValue < numValue;
      case "gte":
        return numFieldValue >= numValue;
      case "lte":
        return numFieldValue <= numValue;
      case "between":
        if (!numValue2) return false;
        return numFieldValue >= numValue && numFieldValue <= numValue2;
      default:
        return true;
    }
  });
}

// Apply sorting
function applySorting(products, sortBy, order = "asc") {
  if (!sortBy) return products;
  const getSortValue = (product) => {
    if (sortBy === "rating.rate") return product.rating?.rate || 0;
    return product[sortBy] || 0;
  };
  return products.sort((a, b) => {
    const valA = getSortValue(a);
    const valB = getSortValue(b);
    if (valA < valB) return order === "asc" ? -1 : 1;
    if (valA > valB) return order === "asc" ? 1 : -1;
    return 0;
  });
}

// Apply global search
function applyGlobalSearch(products, query) {
  if (!query) return products;
  query = query.toLowerCase().trim();
  return products.filter((product) =>
    Object.values(product).some((val) =>
      val && val.toString().toLowerCase().includes(query)
    )
  );
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    productsLoaded: allProducts.length,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "unknown",
  });
});

// Main API endpoint
app.get("/api/products", async (req, res) => {
  try {
    // Retry loading products if empty
    if (allProducts.length === 0) {
      console.log("Products empty, retrying load...");
      await loadProducts();
      if (allProducts.length === 0) {
        console.error("No products available after retry");
        return res.status(500).json({
          error: "No products available. Ensure products.json exists and contains valid data.",
        });
      }
    }

    let filteredProducts = [...allProducts];

    // Apply global search
    const q = req.query.q;
    if (q) console.log(`Applying global search: ${q}`);
    filteredProducts = applyGlobalSearch(filteredProducts, q);

    // Apply column filters
    Object.keys(req.query).forEach((key) => {
      if (key.includes("_")) {
        const [field, suffix] = key.split("_");
        const op = suffix;
        const value = req.query[key];
        console.log(`Applying filter: ${field}_${op}=${value}`);

        if (suffix === "like") {
          filteredProducts = applyTextFilter(filteredProducts, field, "contains", value);
        } else if (suffix === "not_like") {
          filteredProducts = applyTextFilter(filteredProducts, field, "not_contains", value);
        } else if (suffix === "starts_with") {
          filteredProducts = applyTextFilter(filteredProducts, field, "begins_with", value);
        } else if (suffix === "ends_with") {
          filteredProducts = applyTextFilter(filteredProducts, field, "ends_with", value);
        } else if (suffix === "eq") {
          if (isNaN(parseFloat(value))) {
            filteredProducts = applyTextFilter(filteredProducts, field, "equals", value);
          } else {
            filteredProducts = applyNumberFilter(filteredProducts, field, "eq", value);
          }
        } else if (suffix === "neq") {
          if (isNaN(parseFloat(value))) {
            filteredProducts = applyTextFilter(filteredProducts, field, "not_equals", value);
          } else {
            filteredProducts = applyNumberFilter(filteredProducts, field, "neq", value);
          }
        } else if (["gt", "lt", "gte", "lte"].includes(suffix)) {
          filteredProducts = applyNumberFilter(filteredProducts, field, suffix, value);
        } else if (suffix === "blank" || suffix === "not_blank") {
          filteredProducts = applyTextFilter(
            filteredProducts,
            field,
            suffix.replace("_", "is_"),
            ""
          );
        }
      }
    });

    // Apply sorting
    const sortBy = req.query.sortBy;
    const order = req.query.order || "asc";
    if (sortBy) console.log(`Sorting by ${sortBy} in ${order} order`);
    filteredProducts = applySorting(filteredProducts, sortBy, order);

    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    const total = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(skip, skip + limit);

    console.log(`Returning ${paginatedProducts.length} products (total: ${total})`);

    res.json({
      products: paginatedProducts,
      total,
      skip,
      limit,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error(`Error in /api/products: ${error.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Export for Vercel
export default app;

// Start server locally (not needed in Vercel)
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}