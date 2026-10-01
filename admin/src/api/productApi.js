import { getBaseUrl, getAuthHeaders, handleApiResponse } from './apiConfig';

export const fetchProducts = async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/products`);
  const data = await handleApiResponse(response);
  const productsList = Array.isArray(data) ? data : (data.products || data.data || []);
  return productsList;
};

export const createProduct = async (productData) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  return await handleApiResponse(response);
};

export const updateProduct = async (id, productData) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/products/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  return await handleApiResponse(response);
};

export const toggleProductStock = async (id, stockCount, inStockBool) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/products/${id}/stock`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ stock: stockCount, inStock: inStockBool }),
  });
  return await handleApiResponse(response);
};

export const deleteProduct = async (id) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/products/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};
