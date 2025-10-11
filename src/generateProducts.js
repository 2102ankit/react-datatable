function generateDummyProduct(index) {
  const categories = [
    "Electronics",
    "Books",
    "Home & Kitchen",
    "Sports & Outdoors",
    "Clothing",
    "Toys & Games",
    "Automotive",
    "Health & Beauty",
    "Pet Supplies",
    "Office Products",
  ];
  const brands = [
    "BrandA",
    "BrandB",
    "MegaCorp",
    "InnovateTech",
    "EcoFriendly",
    "GlobalGear",
    "QuantumLeap",
  ];
  const colors = ["Red", "Blue", "Green", "Black", "White", "Silver", "Gold"];

  const category = categories[Math.floor(Math.random() * categories.length)];
  const brand = brands[Math.floor(Math.random() * brands.length)];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const price = (Math.random() * 1000 + 10).toFixed(2); // Price between 10 and 1010
  const stock = Math.floor(Math.random() * 500); // Stock up to 499
  const rating = (Math.random() * 4 + 1).toFixed(1); // Rating between 1.0 and 5.0
  const available = stock > 0;
  const createdAt = new Date(
    Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000
  ).toISOString(); // Last year

  return {
    id: `prod-${index}`,
    name: `${brand} ${category.slice(0, -1)} Gadget ${index}`,
    description: `A high-quality ${color} ${category} item from ${brand}.`,
    category: category,
    brand: brand,
    price: parseFloat(price),
    stock: stock,
    rating: parseFloat(rating),
    available: available,
    color: color,
    weightKg: (Math.random() * 5 + 0.1).toFixed(2),
    dimensionsCm: `${Math.floor(Math.random() * 50) + 5}x${
      Math.floor(Math.random() * 50) + 5
    }x${Math.floor(Math.random() * 50) + 5}`,
    warrantyMonths: Math.floor(Math.random() * 24) + 6,
    material: Math.random() > 0.5 ? "Plastic" : "Metal",
    createdAt: createdAt,
    updatedAt: createdAt,
  };
}

// Function to generate a large array of products
export function generateProducts(count) {
  console.time(`Generated ${count} products`);
  const products = [];
  for (let i = 0; i < count; i++) {
    products.push(generateDummyProduct(i));
  }
  console.timeEnd(`Generated ${count} products`);
  return products;
}
