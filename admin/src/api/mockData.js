// Fallback and Mock Data for LITRA KING Admin Panel

export const MOCK_PRODUCTS = [
  {
    _id: 'prod_101',
    productId: 'LK-SP-001',
    name: 'LITRA KING Air Runner Pro',
    brand: 'LITRA KING',
    category: 'Sports Shoes',
    price: 2499,
    originalPrice: 3499,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'],
    sizes: [6, 7, 8, 9, 10, 11],
    colors: ['Black/Gold', 'White/Red'],
    stock: 18,
    inStock: true,
    rating: 4.8,
    description: 'High-performance cushioning sports shoe built for long endurance and maximum speed.',
    tag: 'Best Seller'
  },
  {
    _id: 'prod_102',
    productId: 'LK-CS-002',
    name: 'LITRA KING Urban Sneaker X',
    brand: 'LITRA KING',
    category: 'Sneakers',
    price: 1999,
    originalPrice: 2999,
    images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80'],
    sizes: [7, 8, 9, 10],
    colors: ['White', 'Navy'],
    stock: 4,
    inStock: true,
    rating: 4.7,
    description: 'Sleek streetwear sneakers designed with breathable mesh and memory foam insoles.',
    tag: 'Trending'
  },
  {
    _id: 'prod_103',
    productId: 'LK-FM-003',
    name: 'LITRA KING Monarch Leather Formal',
    brand: 'LITRA KING',
    category: 'Formal Shoes',
    price: 3299,
    originalPrice: 4500,
    images: ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80'],
    sizes: [7, 8, 9, 10, 11],
    colors: ['Tan Brown', 'Jet Black'],
    stock: 2,
    inStock: true,
    rating: 4.9,
    description: 'Handcrafted genuine leather formal dress shoes for modern professionals.',
    tag: 'Premium'
  },
  {
    _id: 'prod_104',
    productId: 'LK-SL-004',
    name: 'LITRA KING Cloud Comfort Slides',
    brand: 'LITRA KING',
    category: 'Slippers',
    price: 799,
    originalPrice: 1299,
    images: ['https://images.unsplash.com/photo-1603808033192-082d6919d3e1?auto=format&fit=crop&w=600&q=80'],
    sizes: [6, 7, 8, 9, 10],
    colors: ['Black', 'Olive Green'],
    stock: 0,
    inStock: false,
    rating: 4.5,
    description: 'Lightweight ultra-soft EVA cushion slides for daily casual comfort.',
    tag: 'Comfort'
  }
];

export const MOCK_ORDERS = [
  {
    _id: 'ord_lk1051',
    orderId: 'LK1051',
    createdAt: new Date().toISOString(),
    customer: {
      name: 'Aadhiya Saini',
      phone: '9257960226',
      email: 'aadhiya.saini@gmail.com',
      address: 'Gandipat Road, Agarwal Caterers के सामने',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302021',
      latitude: 26.905204684070238,
      longitude: 75.74607948523447
    },
    items: [
      {
        productId: 'LK-SP-001',
        name: 'LITRA KING Air Runner Pro',
        price: 2499,
        size: 7,
        color: 'Black/Gold',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
      }
    ],
    subtotal: 2499,
    deliveryCharge: 99,
    totalAmount: 2598,
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    orderStatus: 'Out for Delivery',
    deliveryBoyName: 'Vikram Singh',
    deliveryBoyPhone: '+91 94140 88776',
    estimatedDeliveryTime: 'Same Day'
  },
  {
    _id: 'ord_9001',
    orderId: 'LK-ORD-8821',
    createdAt: '2026-09-21T10:30:00.000Z',
    customer: {
      name: 'Ramesh Sharma',
      phone: '+91 98290 12345',
      email: 'ramesh.sharma@gmail.com',
      address: 'Plot 45, Station Road',
      city: 'Chomu',
      state: 'Rajasthan',
      pincode: '303702'
    },
    items: [
      {
        productId: 'LK-SP-001',
        name: 'LITRA KING Air Runner Pro',
        price: 2499,
        size: 9,
        color: 'Black/Gold',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80'
      }
    ],
    subtotal: 2499,
    deliveryCharge: 0,
    totalAmount: 2499,
    paymentMethod: 'COD',
    paymentStatus: 'Pending',
    orderStatus: 'Out for Delivery',
    deliveryBoyName: 'Vikram Singh',
    deliveryBoyPhone: '+91 94140 88776',
    estimatedDeliveryTime: 'Today by 6:00 PM'
  },
  {
    _id: 'ord_9002',
    orderId: 'LK-ORD-8822',
    createdAt: '2026-09-21T14:15:00.000Z',
    customer: {
      name: 'Priya Verma',
      phone: '+91 97851 65432',
      email: 'priya.verma@yahoo.com',
      address: '12-B Near City Park',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001'
    },
    items: [
      {
        productId: 'LK-CS-002',
        name: 'LITRA KING Urban Sneaker X',
        price: 1999,
        size: 7,
        color: 'White',
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80'
      }
    ],
    subtotal: 3998,
    deliveryCharge: 50,
    totalAmount: 4048,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    orderStatus: 'Confirmed',
    deliveryBoyName: 'Not Assigned',
    deliveryBoyPhone: '',
    estimatedDeliveryTime: 'Tomorrow'
  },
  {
    _id: 'ord_9003',
    orderId: 'LK-ORD-8823',
    createdAt: '2026-09-20T18:45:00.000Z',
    customer: {
      name: 'Amit Choudhary',
      phone: '+91 96102 33445',
      email: 'amit.c@hotmail.com',
      address: 'Main Market, Opposite Litra Shop',
      city: 'Chomu',
      state: 'Rajasthan',
      pincode: '303702'
    },
    items: [
      {
        productId: 'LK-FM-003',
        name: 'LITRA KING Monarch Leather Formal',
        price: 3299,
        size: 8,
        color: 'Tan Brown',
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=600&q=80'
      }
    ],
    subtotal: 3299,
    deliveryCharge: 0,
    totalAmount: 3299,
    paymentMethod: 'Razorpay',
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    deliveryBoyName: 'Vikram Singh',
    deliveryBoyPhone: '+91 94140 88776',
    estimatedDeliveryTime: 'Delivered Sep 21'
  }
];

export const MOCK_METRICS = {
  todaySales: 6547,
  monthlySales: 142850,
  totalOrders: 38,
  deliveredOrders: 29,
  pendingOrders: 9,
  totalProducts: 24,
  lowStockProducts: 3
};
