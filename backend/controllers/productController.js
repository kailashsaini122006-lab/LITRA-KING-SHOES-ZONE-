const Product = require('../models/Product');

// Default initial footwear product dataset (4 Nitro Running Shoes)
const DEFAULT_PRODUCTS = [
  {
    productId: 'LK-NTR-001',
    name: 'Black & White Nitro Running Shoe',
    brand: 'LITRA KING',
    category: 'Running Shoes',
    description: 'High-performance athletic running footwear featuring responsive Nitro foam cushioning, breathable mesh upper, and anti-slip rubber outsole.',
    price: 850,
    originalPrice: 1999,
    images: ['/assets/nitro-black-white.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: [],
    stock: 25,
    inStock: true,
    rating: 4.9,
    tag: 'WHOLESALE FAVORITE',
    isFeatured: true,
  },
  {
    productId: 'LK-NTR-002',
    name: 'Grey/Yellow Nitro Running Shoe',
    brand: 'LITRA KING',
    category: 'Running Shoes',
    description: 'Vibrant electric yellow highlight running footwear with high rebound Nitro foam technology, ergonomic heel support, and flexible tread.',
    price: 850,
    originalPrice: 1999,
    images: ['/assets/nitro-grey-yellow.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: [],
    stock: 20,
    inStock: true,
    rating: 4.8,
    tag: 'WHOLESALE FAVORITE',
    isFeatured: true,
  },
  {
    productId: 'LK-NTR-003',
    name: 'White/Turquoise Nitro Running Shoe',
    brand: 'LITRA KING',
    category: 'Running Shoes',
    description: 'Clean crisp white and bright turquoise edition athletic shoes with energy returning Nitro foam midsole and breathable airflow mesh.',
    price: 850,
    originalPrice: 1999,
    images: ['/assets/nitro-white-turquoise.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: [],
    stock: 22,
    inStock: true,
    rating: 4.9,
    tag: 'WHOLESALE FAVORITE',
    isFeatured: true,
  },
  {
    productId: 'LK-NTR-004',
    name: 'Red/Black Nitro Sport Edition',
    brand: 'LITRA KING',
    category: 'Running Shoes',
    description: 'Aggressive crimson red and black edition athletic shoes featuring Nitro Elite foam energy core and metallic silver side accents.',
    price: 850,
    originalPrice: 1999,
    images: ['/assets/nitro-red-black.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: [],
    stock: 18,
    inStock: true,
    rating: 4.9,
    tag: 'WHOLESALE FAVORITE',
    isFeatured: true,
  },
];

/**
 * Seed initial products if DB is empty, or ensure 3 Nitro shoes exist
 */
async function seedProductsIfEmpty() {
  try {
    for (const prod of DEFAULT_PRODUCTS) {
      await Product.updateOne(
        { productId: prod.productId },
        { $set: prod },
        { upsert: true }
      );
    }
    console.log('🛍️  [MongoDB Seed] Verified & synced 3 Nitro Running Shoes in database.');
  } catch (err) {
    console.error('❌  [Product Seeding Error]:', err.message);
  }
}

/**
 * GET /api/products
 * Fetch all footwear products (supports category, search, featured filters)
 */
exports.getProducts = async (req, res) => {
  try {
    await seedProductsIfEmpty();

    const { category, search, featured } = req.query;
    const filter = {};

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (featured === 'true') {
      filter.isFeatured = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (err) {
    console.error('Error fetching products:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to load products: ' + err.message,
    });
  }
};

/**
 * GET /api/products/:id
 * Fetch single product details by _id or productId
 */
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }

    if (!product) {
      product = await Product.findOne({ productId: id });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (err) {
    console.error('Error fetching product details:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch product details: ' + err.message,
    });
  }
};

/**
 * POST /api/products (Admin)
 * Add a new shoe product to MongoDB
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, brand, category, description, price, originalPrice, images, sizes, colors, stock, isFeatured } = req.body;

    if (!name || !category || !description || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, Category, Description, and Price are required.',
      });
    }

    const productId = 'LK-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    const product = await Product.create({
      productId,
      name,
      brand: brand || 'LITRA KING',
      category,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : Math.round(Number(price) * 1.4),
      images: Array.isArray(images) && images.length ? images : ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
      sizes: Array.isArray(sizes) ? sizes : [6, 7, 8, 9, 10],
      colors: Array.isArray(colors) ? colors : ['Black', 'White'],
      stock: stock !== undefined ? Number(stock) : 25,
      isFeatured: !!isFeatured,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product,
    });
  } catch (err) {
    console.error('Error creating product:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create product: ' + err.message,
    });
  }
};

/**
 * PUT /api/products/:id (Admin)
 * Update existing product details or stock quantity
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (err) {
    console.error('Error updating product:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product: ' + err.message,
    });
  }
};

/**
 * DELETE /api/products/:id (Admin)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    return res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting product:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete product: ' + err.message,
    });
  }
};

module.exports = {
  getProducts: exports.getProducts,
  getProductById: exports.getProductById,
  createProduct: exports.createProduct,
  updateProduct: exports.updateProduct,
  deleteProduct: exports.deleteProduct,
  seedProductsIfEmpty,
  DEFAULT_PRODUCTS,
};
