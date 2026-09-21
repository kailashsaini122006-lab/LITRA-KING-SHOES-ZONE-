// API Configuration for LITRA KING Admin Panel

const getBaseUrl = () => {
  const savedUrl = localStorage.getItem('litra_admin_api_url');
  if (savedUrl) return savedUrl;
  return 'http://localhost:5000';
};

export const API_BASE_URL = getBaseUrl();

export const getAuthHeaders = () => {
  const token = localStorage.getItem('litra_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const handleApiResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `API Request failed with status ${response.status}`);
    }
    return data;
  }
  if (!response.ok) {
    throw new Error(`API Request failed with status ${response.status}`);
  }
  return { success: true };
};
