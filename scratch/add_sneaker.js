require('dotenv').config({ path: './backend/.env' });
const mongoose = require('./backend/node_modules/mongoose');

const productSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    brand: { type: String, default: 'LITRA KING' },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, default: 0 },
    images: [{ type: String }],
    sizes: [{ type: Number }],
    colors: [{ type: String }],
    stock: { type: Number, default: 25 },
    inStock: { type: Boolean, default: true },
    rating: { type: Number, default: 4.8 },
    tag: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function addSneaker() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB!');

    const sneakerData = {
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
    };

    const doc = await Product.findOneAndUpdate(
      { productId: sneakerData.productId },
      sneakerData,
      { upsert: true, new: true }
    );

    console.log('✅ Successfully added/updated retro sneaker in MongoDB!');
    console.log('Product ID:', doc._id.toString());
    console.log('Product Name:', doc.name);
    console.log('Price: ₹' + doc.price);
    console.log('Category:', doc.category);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error adding sneaker to DB:', err);
    process.exit(1);
  }
}

addSneaker();
