import React, { createContext, useContext, useState, useEffect } from 'react';

import { calculateCustomerDeliveryDistance, calculateDeliveryChargeFromDistance, calculateHaversineDistance, SHOP_LOCATION } from '../utils/deliveryUtils';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('lk_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [checkoutMode, setCheckoutMode] = useState(() => {
    try {
      return localStorage.getItem('lk_checkout_mode') || 'cart';
    } catch {
      return 'cart';
    }
  });

  const [buyNowItem, setBuyNowItem] = useState(() => {
    try {
      const saved = localStorage.getItem('lk_buynow_item');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Shared Delivery Distance & Delivery Charge State
  const [deliveryDistance, setDeliveryDistance] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState('');
  const [locationError, setLocationError] = useState('');
  const [locationCoords, setLocationCoords] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('lk_cart_items', JSON.stringify(cartItems));
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
  }, [cartItems]);

  useEffect(() => {
    try {
      localStorage.setItem('lk_checkout_mode', checkoutMode);
      if (buyNowItem) {
        localStorage.setItem('lk_buynow_item', JSON.stringify(buyNowItem));
      } else {
        localStorage.removeItem('lk_buynow_item');
      }
    } catch (err) {
      console.error('Error saving checkout state to localStorage:', err);
    }
  }, [checkoutMode, buyNowItem]);

  /**
   * Detect Customer GPS Location and update delivery distance & charge
   */
  const detectLocation = () => {
    if (locationLoading) return;

    setLocationError('');
    setLocationSuccess('');

    if (typeof window === 'undefined' || !navigator || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please enter your address/pincode manually.');
      return;
    }

    setLocationLoading(true);

    const options = {
      enableHighAccuracy: true, // High accuracy hardware GPS positioning
      timeout: 20000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!position || !position.coords) {
          setLocationError('Unable to determine your current location. Please check your network or enter Pincode manually.');
          setLocationSuccess('');
          setLocationLoading(false);
          return;
        }
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocationCoords({ lat, lng });
        const distKm = calculateHaversineDistance(SHOP_LOCATION.lat, SHOP_LOCATION.lng, lat, lng);
        const charge = calculateDeliveryChargeFromDistance(distKm);
        setDeliveryDistance(distKm);
        setDeliveryCharge(charge);
        setLocationError('');
        setLocationSuccess(`GPS Location detected successfully! (${distKm} km from store)`);
        setLocationLoading(false);
      },
      (err) => {
        setLocationSuccess('');
        const code = err ? err.code : 0;
        if (code === 1 || (err && err.PERMISSION_DENIED && code === err.PERMISSION_DENIED)) {
          setLocationError('Location permission was denied or location service is disabled. Please allow location access for this site and try again, or enter your Pincode manually.');
        } else if (code === 2 || (err && err.POSITION_UNAVAILABLE && code === err.POSITION_UNAVAILABLE)) {
          setLocationError('Unable to determine your current location. Please check your network or enter Pincode manually.');
        } else if (code === 3 || (err && err.TIMEOUT && code === err.TIMEOUT)) {
          setLocationError('Location request timed out. Please try again or enter Pincode manually.');
        } else {
          setLocationError('Unable to determine your current location. Please check your network or enter Pincode manually.');
        }
        setLocationLoading(false);
      },
      options
    );
  };

  /**
   * Update Delivery distance & charge from Pincode/Address lookup
   */
  const updateDeliveryFromPincode = async (pincode, customCoords = null) => {
    const cleanPincode = (pincode || '').toString().trim().replace(/\D/g, '');
    const activeCoords = customCoords || locationCoords;
    const hasGps = activeCoords && activeCoords.lat !== undefined && activeCoords.lat !== null && activeCoords.lng !== undefined && activeCoords.lng !== null;

    if (!cleanPincode && !hasGps) {
      setDeliveryDistance(null);
      setDeliveryCharge(null);
      return { success: false, message: '' };
    }

    setLocationLoading(true);

    const result = await calculateCustomerDeliveryDistance({
      pincode: cleanPincode,
      lat: hasGps ? activeCoords.lat : null,
      lng: hasGps ? activeCoords.lng : null,
    });

    if (result.success && result.distanceKm !== null && result.deliveryCharge !== null) {
      setDeliveryDistance(result.distanceKm);
      setDeliveryCharge(result.deliveryCharge);
      setLocationLoading(false);
      return result;
    } else {
      setDeliveryDistance(null);
      setDeliveryCharge(null);
      setLocationLoading(false);
      return result;
    }
  };

  /**
   * Start checkout for a single selected product (Buy Now)
   */
  const startBuyNow = (product, size, color, quantity = 1, imageOverride = '') => {
    if (!product || product.inStock === false || (product.stock !== undefined && product.stock <= 0)) {
      console.warn('Cannot purchase out of stock product:', product?.name);
      return false;
    }

    const selectedSize = Number(size) || (product.sizes ? product.sizes[0] : 8);
    const selectedColor = color || (product.colors ? product.colors[0] : 'Black');
    const selectedQty = Math.max(1, Number(quantity) || 1);
    const itemKey = `${product._id || product.productId}_${selectedSize}_${selectedColor}`;
    const img = imageOverride || (Array.isArray(product.images) && product.images.length ? product.images[0] : (product.img || ''));

    const item = {
      key: itemKey,
      _id: product._id || product.productId,
      productId: product.productId || product._id,
      name: product.name,
      brand: product.brand || 'LITRA KING',
      price: product.price,
      originalPrice: product.originalPrice,
      image: img,
      size: selectedSize,
      color: selectedColor,
      quantity: selectedQty,
      stock: product.stock !== undefined ? product.stock : 25,
      inStock: product.inStock !== false && (product.stock === undefined || product.stock > 0),
    };

    setBuyNowItem(item);
    setCheckoutMode('single');
    return true;
  };

  /**
   * Start checkout for full cart ("Checkout All")
   */
  const startCartCheckout = () => {
    setCheckoutMode('cart');
  };

  /**
   * Update quantity of buyNowItem
   */
  const updateBuyNowQuantity = (delta) => {
    setBuyNowItem((prev) => {
      if (!prev) return null;
      const targetQty = prev.quantity + delta;
      if (targetQty <= 0) return prev;
      const maxQty = prev.stock !== undefined ? prev.stock : 99;
      return { ...prev, quantity: Math.min(targetQty, maxQty) };
    });
  };

  /**
   * Get active checkout items based on checkoutMode
   */
  const getCheckoutItems = () => {
    if (checkoutMode === 'single' && buyNowItem) {
      return [buyNowItem];
    }
    return cartItems;
  };

  /**
   * Get subtotal of active checkout items
   */
  const getCheckoutSubtotal = () => {
    const items = getCheckoutItems();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  /**
   * Get total quantity of active checkout items
   */
  const getCheckoutCount = () => {
    const items = getCheckoutItems();
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  /**
   * Clear active checkout state after order creation
   */
  const clearCheckout = () => {
    if (checkoutMode === 'cart') {
      setCartItems([]);
    }
    setBuyNowItem(null);
    setCheckoutMode('cart');
    try {
      localStorage.removeItem('lk_buynow_item');
      localStorage.setItem('lk_checkout_mode', 'cart');
    } catch {
      // ignore
    }
  };

  /**
   * Add product to cart with size, color, and quantity.
   * Differentiates items by (productId + size + color).
   */
  const addToCart = (product, size, color, quantity = 1) => {
    if (!product || product.inStock === false || (product.stock !== undefined && product.stock <= 0)) {
      console.warn('Cannot add out of stock product to cart:', product?.name);
      return false;
    }

    const selectedSize = Number(size) || (product.sizes ? product.sizes[0] : 8);
    const selectedColor = color || (product.colors ? product.colors[0] : 'Black');
    const selectedQty = Math.max(1, Number(quantity) || 1);
    const itemKey = `${product._id || product.productId}_${selectedSize}_${selectedColor}`;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.key === itemKey);

      if (existingIndex > -1) {
        return prevItems.map((item, index) => {
          if (index === existingIndex) {
            const newQty = item.quantity + selectedQty;
            const maxStock = product.stock !== undefined ? product.stock : 99;
            return { ...item, quantity: Math.min(newQty, maxStock) };
          }
          return item;
        });
      }

      return [
        ...prevItems,
        {
          key: itemKey,
          _id: product._id || product.productId,
          productId: product.productId || product._id,
          name: product.name,
          brand: product.brand || 'LITRA KING',
          price: product.price,
          originalPrice: product.originalPrice,
          image: Array.isArray(product.images) && product.images.length ? product.images[0] : (product.img || ''),
          size: selectedSize,
          color: selectedColor,
          quantity: selectedQty,
          stock: product.stock !== undefined ? product.stock : 25,
          inStock: product.inStock !== false && (product.stock === undefined || product.stock > 0),
        },
      ];
    });
    return true;
  };

  /**
   * Remove item from cart by key
   */
  const removeFromCart = (itemKey) => {
    setCartItems((prev) => prev.filter((item) => item.key !== itemKey));
  };

  /**
   * Update item quantity
   */
  const updateQuantity = (itemKey, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.key === itemKey) {
            const targetQty = item.quantity + delta;
            if (targetQty <= 0) return null;
            const maxQty = item.stock !== undefined ? item.stock : 99;
            return { ...item, quantity: Math.min(targetQty, maxQty) };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  /**
   * Clear all cart items
   */
  const clearCart = () => {
    setCartItems([]);
  };

  /**
   * Calculate cart subtotal
   */
  const getCartSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  /**
   * Calculate cart total count
   */
  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        checkoutMode,
        buyNowItem,
        deliveryDistance,
        deliveryCharge,
        locationLoading,
        locationSuccess,
        locationError,
        locationCoords,
        detectLocation,
        updateDeliveryFromPincode,
        setDeliveryDistance,
        setDeliveryCharge,
        setLocationSuccess,
        setLocationError,
        setLocationCoords,
        startBuyNow,
        startCartCheckout,
        updateBuyNowQuantity,
        getCheckoutItems,
        getCheckoutSubtotal,
        getCheckoutCount,
        clearCheckout,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartSubtotal,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}

