/* eslint-disable no-unused-vars */
import fs from "fs/promises"; // Add fs for reading JSON file
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path"; // Add path for reliable file paths

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001; // Use PORT from .env or default to 3001
app.use(cors());
app.use(express.json());
// app.use(express.static(path.join(__dirname, 'public'))); // Serve static files if needed

// Fetch full products data on startup from products.json
let allProducts = [];
async function loadProducts() {
  try {
    const filePath = path.join(process.cwd(), "products.json"); // Use process.cwd() for Vercel compatibility
    const fileData = await fs.readFile(filePath, "utf8");
    const data = JSON.parse(fileData);
    allProducts = data.products || data; // Handle both { products: [] } and direct [] formats
    console.log(`Loaded ${allProducts.length} products from products.json.`);
  } catch (error) {
    console.error("Failed to load products from products.json:", error);
  }
}
loadProducts();

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

  // Handle nested fields like 'rating.rate'
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
      val.toString().toLowerCase().includes(query)
    )
  );
}

// Main API endpoint
app.get("/api/products", (req, res) => {
  try {
    let filteredProducts = [...allProducts];

    // Apply global search
    const q = req.query.q;
    filteredProducts = applyGlobalSearch(filteredProducts, q);

    // Apply column filters
    Object.keys(req.query).forEach((key) => {
      if (key.includes("_")) {
        const [field, suffix] = key.split("_");
        const op = suffix; // e.g., price_gte -> field='price', op='gte'
        const value = req.query[key];

        if (suffix === "like") {
          filteredProducts = applyTextFilter(
            filteredProducts,
            field,
            "contains",
            value
          );
        } else if (suffix === "not_like") {
          filteredProducts = applyTextFilter(
            filteredProducts,
            field,
            "not_contains",
            value
          );
        } else if (suffix === "starts_with") {
          filteredProducts = applyTextFilter(
            filteredProducts,
            field,
            "begins_with",
            value
          );
        } else if (suffix === "ends_with") {
          filteredProducts = applyTextFilter(
            filteredProducts,
            field,
            "ends_with",
            value
          );
        } else if (suffix === "eq") {
          if (isNaN(parseFloat(value))) {
            filteredProducts = applyTextFilter(
              filteredProducts,
              field,
              "equals",
              value
            );
          } else {
            filteredProducts = applyNumberFilter(
              filteredProducts,
              field,
              "eq",
              value
            );
          }
        } else if (suffix === "neq") {
          if (isNaN(parseFloat(value))) {
            filteredProducts = applyTextFilter(
              filteredProducts,
              field,
              "not_equals",
              value
            );
          } else {
            filteredProducts = applyNumberFilter(
              filteredProducts,
              field,
              "neq",
              value
            );
          }
        } else if (["gt", "lt", "gte", "lte"].includes(suffix)) {
          filteredProducts = applyNumberFilter(
            filteredProducts,
            field,
            suffix,
            value
          );
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

    // Handle between separately (two params: field_gte and field_lte)
    // But since client sends both, the loop above handles gte/lte individually

    // Apply sorting
    const sortBy = req.query.sortBy;
    const order = req.query.order || "asc";
    filteredProducts = applySorting(filteredProducts, sortBy, order);

    // Pagination
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;
    const total = filteredProducts.length;
    const paginatedProducts = filteredProducts.slice(skip, skip + limit);

    res.json({
      products: paginatedProducts,
      total,
      skip,
      limit,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});