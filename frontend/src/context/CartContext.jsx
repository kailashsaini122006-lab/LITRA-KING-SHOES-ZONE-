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

  useEffect(() => {
    try {
      localStorage.setItem('lk_cart_items', JSON.stringify(cartItems));
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
  }, [cartItems]);

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
        // Cap quantity at product stock if available
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
          image: Array.isArray(product.images) && product.images.length ? product.images[0] : '',
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
   * Calculate subtotal
   */
  const getCartSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  /**
   * Calculate total quantity
   */
  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
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
