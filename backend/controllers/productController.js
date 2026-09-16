const Product = require('../models/Product');

// Default initial footwear product dataset
const DEFAULT_PRODUCTS = [
  {
    productId: 'LK-NTR-001',
    name: 'Puma MAG MAX NITRO Black Running Shoe',
    brand: 'Puma',
    category: 'Running Shoes',
    description: 'High-performance Puma MAG MAX NITRO running shoe with max cushioning sole, lightweight breathable mesh upper, and ultimate running comfort.',
    price: 999,
    originalPrice: 1999,
    images: ['/assets/real-nitro-black-white.jpg', '/assets/nitro-black-white.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'White'],
    stock: 25,
    inStock: true,
    rating: 4.9,
    tag: 'HOT RUNNER',
    isFeatured: true,
  },
  {
    productId: 'LK-NTR-002',
    name: 'Puma NITRO Grey & Yellow Running Shoe',
    brand: 'Puma',
    category: 'Running Shoes',
    description: 'Dynamic Puma NITRO grey running shoe with high-visibility yellow accents, ergonomic heel lock, and responsive cushion sole.',
    price: 999,
    originalPrice: 1999,
    images: ['/assets/real-nitro-grey-yellow.jpg', '/assets/nitro-grey-yellow.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Grey', 'Yellow'],
    stock: 25,
    inStock: true,
    rating: 4.9,
    tag: 'POPULAR CHOICE',
    isFeatured: true,
  },
  {
    productId: 'LK-NTR-003',
    name: 'Puma NITRO White & Cyan Running Shoe',
    brand: 'Puma',
    category: 'Running Shoes',
    description: 'Fresh white & cyan turquoise Puma NITRO running shoe with shock-absorbing foam midsole, ultra-soft footbed, and stylish look.',
    price: 999,
    originalPrice: 1999,
    images: ['/assets/real-nitro-white-turquoise.jpg', '/assets/nitro-white-turquoise.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['White', 'Cyan'],
    stock: 25,
    inStock: true,
    rating: 5.0,
    tag: 'SPECIAL OFFER',
    isFeatured: true,
  },
  {
    productId: 'LK-ASCS-1100',
    name: 'ASICS FF BLAST Running Shoe',
    brand: 'ASICS',
    category: 'Running Shoes',
    description: 'High-performance ASICS FF Blast running shoe with light responsive cushioning, breathable mesh upper, and dynamic grip.',
    price: 1100,
    originalPrice: 2200,
    images: ['/assets/asics-ff-blast-1100.png'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'Grey', 'White'],
    stock: 25,
    inStock: true,
    rating: 4.9,
    tag: 'NEW COLLECTION',
    isFeatured: true,
  },
  {
    productId: 'LK-CHNK-899',
    name: 'Black Chunky Platform Sneaker',
    brand: 'LITRA KING',
    category: 'Casual Shoes',
    description: 'Stylish black chunky platform sneaker with metallic accent bubble cushioning midsole and comfortable slip-resistant sole.',
    price: 899,
    originalPrice: 1799,
    images: ['/assets/chunky-black-platform-899.png'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'White'],
    stock: 25,
    inStock: true,
    rating: 4.8,
    tag: 'BEST SELLER',
    isFeatured: true,
  },
  {
    productId: 'LK-RBK-1750',
    name: 'Reebok Speed Black & White Shoe',
    brand: 'Reebok',
    category: 'Running Shoes',
    description: 'Premium Reebok black and white athletic shoe featuring breathable mesh, ergonomic heel support, and durable rubber traction.',
    price: 1750,
    originalPrice: 3500,
    images: ['/assets/reebok-black-white-1750.png'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'White'],
    stock: 20,
    inStock: true,
    rating: 4.9,
    tag: 'PREMIUM FOOTWEAR',
    isFeatured: true,
  },
  {
    productId: 'LK-ADS-999',
    name: 'Adidas 3-Stripe Bubble Sneaker',
    brand: 'Adidas',
    category: 'Sneakers',
    description: 'Iconic black Adidas sneaker with 3 white side stripes and translucent air bubble pod cushioning sole.',
    price: 999,
    originalPrice: 1999,
    images: ['/assets/adidas-bubble-sole-999.png'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'White'],
    stock: 22,
    inStock: true,
    rating: 4.8,
    tag: 'WHOLESALE FAVORITE',
    isFeatured: true,
  },
  {
    productId: 'LK-RBK-750',
    name: 'Reebok Air Cushion Black Runner',
    brand: 'Reebok',
    category: 'Casual Shoes',
    description: 'Sleek black Reebok runner shoe with translucent air bubble heel section and lightweight comfortable everyday sole.',
    price: 750,
    originalPrice: 1500,
    images: ['/assets/reebok-air-heel-750.png'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'White'],
    stock: 30,
    inStock: true,
    rating: 4.7,
    tag: 'HOT DEAL',
    isFeatured: true,
  },
  {
    productId: 'LK-SNK-799',
    name: 'Classic White & Green Striped Retro Sneaker',
    brand: 'LITRA KING',
    category: 'Sneakers',
    description: 'Classic retro white sneaker featuring dark green & red side stripes, light grey suede toe overlay, soft inner cushioning, and slip-resistant sole.',
    price: 799,
    originalPrice: 1599,
    images: ['/assets/green-red-white-sneaker-799.jpg'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['White', 'Green', 'Red'],
    stock: 30,
    inStock: true,
    rating: 4.9,
    tag: 'NEW SNEAKER',
    isFeatured: true,
  },
];

/**
 * Seed initial products if DB is empty, or ensure shoes exist
 */
async function seedProductsIfEmpty() {
  try {
    // 1. Check all existing products in DB for missing or invalid originalPrice / price
    const existingProducts = await Product.find({}).lean();
    for (const prod of existingProducts) {
      const orig = Number(prod.originalPrice);
      const prc = Number(prod.price);
      const isPriceValid = typeof prod.price === 'number' && !isNaN(prc) && prc >= 0;
      const isOrigValid = typeof prod.originalPrice === 'number' && !isNaN(orig) && orig > 0;

      if (!isOrigValid || !isPriceValid) {
        const validPrice = isPriceValid ? prc : 999;
        const validOriginalPrice = isOrigValid ? orig : Math.round(validPrice * 1.4);
        await Product.updateOne(
          { _id: prod._id },
          { $set: { price: validPrice, originalPrice: validOriginalPrice } }
        );
      }
    }

    // 2. Insert default products ONLY if they do not exist in MongoDB yet ($setOnInsert)
    // This guarantees all Admin updates (price, originalPrice, stock, name, description, sizes, colors, images, tags)
    // are PERMANENT and NEVER overwritten on page refresh or server restart!
    for (const prod of DEFAULT_PRODUCTS) {
      await Product.findOneAndUpdate(
        { productId: prod.productId },
        {
          $setOnInsert: prod,
        },
        { upsert: true, new: true }
      );
    }
    console.log('🛍️  [MongoDB Seed] Verified & synced Footwear Products in database.');
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
      // Smart search query normalization
      let cleanSearch = search.trim();
      cleanSearch = cleanSearch.replace(/\bruning\b/gi, 'running')
                               .replace(/\bshoze\b|\bshose\b|\bjute\b|\bjuta\b/gi, 'shoes');

      const terms = cleanSearch.split(/\s+/).filter(Boolean);
      const regexPatterns = terms.map(t => new RegExp(t, 'i'));

      filter.$or = [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { brand: { $regex: cleanSearch, $options: 'i' } },
        { category: { $regex: cleanSearch, $options: 'i' } },
        { description: { $regex: cleanSearch, $options: 'i' } },
        { tag: { $regex: cleanSearch, $options: 'i' } },
        ...regexPatterns.map(r => ({ name: r })),
        ...regexPatterns.map(r => ({ category: r })),
        ...regexPatterns.map(r => ({ description: r })),
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
 * POST /api/products/upload-image (Admin)
 * Upload product image (Base64 data URL) and save to /uploads folder
 */
exports.uploadProductImage = async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    const matches = imageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format',
      });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const dataBuffer = Buffer.from(matches[2], 'base64');
    const safeFilename = `shoe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const uploadsFolder = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsFolder)) {
      fs.mkdirSync(uploadsFolder, { recursive: true });
    }

    const filePath = path.join(uploadsFolder, safeFilename);
    fs.writeFileSync(filePath, dataBuffer);

    const imageUrl = `/uploads/${safeFilename}`;

    return res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
    });
  } catch (err) {
    console.error('Error uploading product image:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image: ' + err.message,
    });
  }
};

/**
 * POST /api/products (Admin)
 * Add a new shoe product to MongoDB
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, brand, category, description, price, originalPrice, images, image, sizes, colors, color, stock, tag, isFeatured } = req.body;

    if (!name || !category || !description || price === undefined || price === null || price === '') {
      return res.status(400).json({
        success: false,
        message: 'Shoe Name, Category, Description, and Selling Price are required.',
      });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Selling Price must be a valid non-negative number.',
      });
    }

    let numOriginalPrice = originalPrice !== undefined && originalPrice !== null && originalPrice !== '' ? Number(originalPrice) : NaN;
    if (isNaN(numOriginalPrice) || numOriginalPrice <= 0) {
      numOriginalPrice = Math.round(numPrice * 1.4);
    }

    const numStock = stock !== undefined && stock !== null && stock !== '' && !isNaN(Number(stock)) ? Math.max(0, Number(stock)) : 25;
    const isStockAvailable = numStock > 0;

    let finalImages = [];
    if (Array.isArray(images) && images.length > 0) {
      finalImages = images.filter(Boolean);
    } else if (image && typeof image === 'string' && image.trim()) {
      finalImages = [image.trim()];
    }

    if (finalImages.length === 0) {
      finalImages = ['/assets/real-nitro-black-white.jpg'];
    }

    let parsedSizes = [6, 7, 8, 9, 10];
    if (Array.isArray(sizes) && sizes.length > 0) {
      parsedSizes = sizes.map(s => Number(s)).filter(n => !isNaN(n));
    } else if (typeof sizes === 'string' && sizes.trim()) {
      parsedSizes = sizes.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
    }
    if (parsedSizes.length === 0) parsedSizes = [6, 7, 8, 9, 10];

    let parsedColors = ['Black', 'White'];
    if (Array.isArray(colors) && colors.length > 0) {
      parsedColors = colors.filter(Boolean);
    } else if (color && typeof color === 'string' && color.trim()) {
      parsedColors = color.split(',').map(c => c.trim()).filter(Boolean);
    }

    const productId = 'LK-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    const product = await Product.create({
      productId,
      name: name.trim(),
      brand: (brand || 'LITRA KING').trim(),
      category: category.trim(),
      description: description.trim(),
      price: numPrice,
      originalPrice: numOriginalPrice,
      images: finalImages,
      sizes: parsedSizes,
      colors: parsedColors,
      stock: numStock,
      inStock: isStockAvailable,
      tag: (tag || 'New').trim(),
      isFeatured: isFeatured !== undefined ? !!isFeatured : true,
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
    const updateData = { ...req.body };

    if (updateData.price !== undefined) {
      const numPrice = Number(updateData.price);
      if (!isNaN(numPrice) && numPrice >= 0) {
        updateData.price = numPrice;
      } else {
        delete updateData.price;
      }
    }

    if (updateData.originalPrice !== undefined) {
      const numOriginal = Number(updateData.originalPrice);
      if (!isNaN(numOriginal) && numOriginal > 0) {
        updateData.originalPrice = numOriginal;
      } else {
        delete updateData.originalPrice;
      }
    }

    if (updateData.stock !== undefined) {
      const numStock = Number(updateData.stock);
      if (!isNaN(numStock) && numStock >= 0) {
        updateData.stock = numStock;
        updateData.inStock = numStock > 0;
      } else {
        delete updateData.stock;
      }
    }

    if (updateData.sizes) {
      if (Array.isArray(updateData.sizes)) {
        updateData.sizes = updateData.sizes.map(s => Number(s)).filter(n => !isNaN(n));
      } else if (typeof updateData.sizes === 'string') {
        updateData.sizes = updateData.sizes.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));
      }
    }

    if (updateData.colors && typeof updateData.colors === 'string') {
      updateData.colors = updateData.colors.split(',').map(c => c.trim()).filter(Boolean);
    }

    if (updateData.image && typeof updateData.image === 'string' && updateData.image.trim()) {
      updateData.images = [updateData.image.trim()];
    }

    let product;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    }
    if (!product) {
      product = await Product.findOneAndUpdate({ productId: id }, updateData, { new: true, runValidators: true });
    }

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
 * PATCH /api/products/:id/stock (Admin)
 * Toggle product stock availability (In Stock ↔ Out of Stock)
 */
exports.toggleProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { inStock } = req.body;

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

    if (typeof inStock === 'boolean') {
      product.inStock = inStock;
    } else {
      product.inStock = !product.inStock;
    }

    if (product.inStock) {
      if (product.stock === undefined || product.stock <= 0) {
        product.stock = 25;
      }
    } else {
      product.stock = 0;
    }

    await product.save();

    return res.json({
      success: true,
      message: `Product stock status updated to ${product.inStock ? 'Available' : 'Out of Stock'}`,
      product,
    });
  } catch (err) {
    console.error('Error toggling product stock:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update product stock: ' + err.message,
    });
  }
};

/**
 * DELETE /api/products/:id (Admin)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findByIdAndDelete(id);
    }
    if (!product) {
      product = await Product.findOneAndDelete({ productId: id });
    }

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
  uploadProductImage: exports.uploadProductImage,
  createProduct: exports.createProduct,
  updateProduct: exports.updateProduct,
  toggleProductStock: exports.toggleProductStock,
  deleteProduct: exports.deleteProduct,
  seedProductsIfEmpty,
  DEFAULT_PRODUCTS,
};
