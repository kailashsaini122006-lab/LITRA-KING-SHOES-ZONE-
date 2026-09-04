import React, { createContext, useContext, useState, useEffect } from 'react';

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
   * Start checkout for a single selected product (Buy Now)
   */
  const startBuyNow = (product, size, color, quantity = 1, imageOverride = '') => {
    const selectedSize = Number(size) || (product.sizes ? product.sizes[0] : 8);
    const selectedColor = color || (product.colors ? product.colors[0] : 'Black');
    const selectedQty = Math.max(1, Number(quantity) || 1);
    const itemKey = `${product.productId || product._id}_${selectedSize}_${selectedColor}`;
    const img = imageOverride || (Array.isArray(product.images) && product.images.length ? product.images[0] : (product.img || ''));

    const item = {
      key: itemKey,
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
    };

    setBuyNowItem(item);
    setCheckoutMode('single');
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
    const selectedSize = Number(size) || (product.sizes ? product.sizes[0] : 8);
    const selectedColor = color || (product.colors ? product.colors[0] : 'Black');
    const selectedQty = Math.max(1, Number(quantity) || 1);
    const itemKey = `${product.productId || product._id}_${selectedSize}_${selectedColor}`;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.key === itemKey);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + selectedQty;
        const maxStock = product.stock !== undefined ? product.stock : 99;
        updated[existingIndex].quantity = Math.min(newQty, maxStock);
        return updated;
      }

      return [
        ...prevItems,
        {
          key: itemKey,
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
        },
      ];
    });
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

