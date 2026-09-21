import { API_BASE_URL, getAuthHeaders, handleApiResponse } from './apiConfig';
import { MOCK_PRODUCTS } from './mockData';

let localProducts = [...MOCK_PRODUCTS];

export const fetchProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`);
    const data = await handleApiResponse(response);
    const productsList = Array.isArray(data) ? data : (data.products || data.data || []);
    if (productsList.length > 0) return productsList;
    return localProducts;
  } catch (error) {
    console.warn('Using local fallback products due to API error:', error.message);
    return localProducts;
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.warn('Simulating local product creation:', error.message);
    const newProd = {
      _id: 'prod_' + Date.now(),
      productId: productData.productId || 'LK-PROD-' + Math.floor(100 + Math.random() * 900),
      ...productData,
      inStock: productData.stock > 0,
    };
    localProducts.unshift(newProd);
    return { success: true, product: newProd };
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.warn('Simulating local product update:', error.message);
    localProducts = localProducts.map((p) =>
      p._id === id || p.productId === id ? { ...p, ...productData, inStock: (productData.stock ?? p.stock) > 0 } : p
    );
    return { success: true };
  }
};

export const toggleProductStock = async (id, stockCount, inStockBool) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}/stock`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ stock: stockCount, inStock: inStockBool }),
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.warn('Simulating local stock toggle:', error.message);
    localProducts = localProducts.map((p) =>
      p._id === id || p.productId === id ? { ...p, stock: stockCount, inStock: inStockBool } : p
    );
    return { success: true };
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return await handleApiResponse(response);
  } catch (error) {
    console.warn('Simulating local product deletion:', error.message);
    localProducts = localProducts.filter((p) => p._id !== id && p.productId !== id);
    return { success: true };
  }
};
