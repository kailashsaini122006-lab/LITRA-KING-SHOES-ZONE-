import { getBaseUrl, getAuthHeaders, handleApiResponse } from './apiConfig';

export const fetchOrders = async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/orders`, {
    headers: getAuthHeaders(),
  });
  const data = await handleApiResponse(response);
  const ordersList = Array.isArray(data) ? data : (data.orders || data.data || []);
  return ordersList;
};

export const fetchDashboardMetrics = async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/orders/admin/metrics`, {
    headers: getAuthHeaders(),
  });
  const data = await handleApiResponse(response);
  if (data && data.metrics) return data.metrics;
  if (data && typeof data.todaySales === 'number') return data;
  return {
    todaySales: 0,
    monthlySales: 0,
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  };
};

export const updateOrderStatus = async (orderId, newStatus) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/orders/${orderId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderStatus: newStatus }),
  });
  return await handleApiResponse(response);
};

export const updateDeliveryBoyInfo = async (orderId, { deliveryBoyName, deliveryBoyPhone }) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/orders/${orderId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      deliveryBoyName,
      deliveryBoyPhone,
    }),
  });
  return await handleApiResponse(response);
};

export const updateDeliveryAssignment = async (orderId, deliveryData = {}) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/orders/${orderId}/delivery-send`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(deliveryData),
  });
  return await handleApiResponse(response);
};

export const sendOrderToDeliveryBoy = async (orderId) => {
  return updateDeliveryAssignment(orderId, {});
};

export const acceptDeliveryOrder = async (orderId, { deliveryBoyName, deliveryBoyPhone }) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/orders/${orderId}/accept-delivery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deliveryBoyName, deliveryBoyPhone }),
  });
  return await handleApiResponse(response);
};
