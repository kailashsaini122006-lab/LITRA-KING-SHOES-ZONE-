const Product = require('../models/Product');

// Default initial footwear product dataset
const DEFAULT_PRODUCTS = [
  {
    productId: 'LK-SP-001',
    name: 'Air Max Pro Sport Shoes',
    brand: 'LITRA KING',
    category: 'Sports Shoes',
    description: 'High performance athletic shoes with ultra-grip cushioning, breathable mesh, and flexible soles for workouts, running, and active wear.',
    price: 1499,
    originalPrice: 2499,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Red', 'Black', 'White'],
    stock: 20,
    rating: 4.9,
    tag: 'Top Rated',
    isFeatured: true,
  },
  {
    productId: 'LK-SN-002',
    name: 'Streetwear Urban Edition Sneakers',
    brand: 'LITRA KING',
    category: 'Sneakers',
    description: 'Modern street style sneakers crafted with premium synthetic leather, lightweight shock-absorbing insoles, and trendy high-top finish.',
    price: 1899,
    originalPrice: 2999,
    images: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: [6, 7, 8, 9, 10],
    colors: ['White/Black', 'Grey', 'Full Black'],
    stock: 18,
    rating: 4.8,
    tag: 'Best Wholesale Seller',
    isFeatured: true,
  },
  {
    productId: 'LK-CS-003',
    name: 'Comfort Soft Casual Loafers',
    brand: 'LITRA KING',
    category: 'Casual Shoes',
    description: 'Ultra lightweight daily casual walk shoes designed for effortless slip-on comfort, all-day cushioning, and casual office or outing wear.',
    price: 1299,
    originalPrice: 1999,
    images: [
      'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: [7, 8, 9, 10],
    colors: ['Brown', 'Tan', 'Navy Blue'],
    stock: 25,
    rating: 4.7,
    tag: 'Wholesale Favorite',
    isFeatured: true,
  },
  {
    productId: 'LK-RN-004',
    name: 'FlyRunner Cushion Marathon Shoes',
    brand: 'LITRA KING',
    category: 'Running Shoes',
    description: 'Professional marathon running footwear featuring energy-returning foam midsole, arch support, and anti-slip rubber outsole.',
    price: 1699,
    originalPrice: 2799,
    images: [
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Neon Green', 'Blue', 'Black'],
    stock: 15,
    rating: 4.9,
    tag: 'Pro Runner Choice',
    isFeatured: true,
  },
  {
    productId: 'LK-FM-005',
    name: 'Royal Heritage Leather Formal Shoes',
    brand: 'LITRA KING',
    category: 'Formal Shoes',
    description: 'Classic Oxford handcrafted formal shoes with sleek gloss finish, cushioned heel padding, and timeless wedding/office elegance.',
    price: 2199,
    originalPrice: 3499,
    images: [
      'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'Dark Brown'],
    stock: 12,
    rating: 4.8,
    tag: 'Premium Leather',
    isFeatured: true,
  },
  {
    productId: 'LK-SL-006',
    name: 'UltraSoft Ortho Cushion Slippers',
    brand: 'LITRA KING',
    category: 'Slippers',
    description: 'Orthopedic memory foam slides and slippers designed for home comfort, anti-skid bathroom safety, and daily indoor relaxing.',
    price: 599,
    originalPrice: 999,
    images: [
      'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Grey', 'Black', 'Blue'],
    stock: 30,
    rating: 4.6,
    tag: 'Daily Comfort',
    isFeatured: false,
  },
  {
    productId: 'LK-SD-007',
    name: 'Sturdy Outdoor Leather Strap Sandals',
    brand: 'LITRA KING',
    category: 'Sandals',
    description: 'Rugged outdoor casual sandals with adjustable velcro straps, reinforced toe bumpers, and weather-resistant flexible soles.',
    price: 999,
    originalPrice: 1599,
    images: [
      'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: [7, 8, 9, 10],
    colors: ['Brown', 'Camel', 'Black'],
    stock: 22,
    rating: 4.7,
    tag: 'All Terrain',
    isFeatured: false,
  },
  {
    productId: 'LK-KD-008',
    name: 'Vibrant Light-Up Kids Sneakers',
    brand: 'LITRA KING',
    category: 'Kids Footwear',
    description: 'Fun, safe, and flexible footwear for growing children featuring soft non-toxic padding, easy velcro enclosure, and durable rubber soles.',
    price: 799,
    originalPrice: 1299,
    images: [
      'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=800&q=80',
    ],
    sizes: [1, 2, 3, 4, 5],
    colors: ['Red/Yellow', 'Blue/White'],
    stock: 16,
    rating: 4.9,
    tag: 'Kids Special',
    isFeatured: false,
  },
];

/**
 * Seed initial products if DB is empty
 */
async function seedProductsIfEmpty() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(DEFAULT_PRODUCTS);
      console.log('🛍️  [MongoDB Seed] Successfully auto-seeded initial Litra King Footwear Products collection!');
    }
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

module.exports.seedProductsIfEmpty = seedProductsIfEmpty;
