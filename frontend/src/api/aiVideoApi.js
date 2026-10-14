import { getApiUrl } from '../config/api';

const getAuthHeaders = () => {
  const token =
    sessionStorage.getItem('lk_access_token') ||
    localStorage.getItem('lk_access_token') ||
    localStorage.getItem('litra_admin_token') ||
    '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleApiResponse = async (response) => {
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

export const fetchAiVideoStatus = async () => {
  const response = await fetch(getApiUrl('/ai-video/status'), {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

export const saveAiVideoConfig = async (config) => {
  const response = await fetch(getApiUrl('/ai-video/config'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  });
  return await handleApiResponse(response);
};

export const testAiVideoConnection = async (provider, apiKey) => {
  const response = await fetch(getApiUrl('/ai-video/test-connection'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ provider, apiKey }),
  });
  return await handleApiResponse(response);
};

export const generateShoeVideo = async ({ productId, image, prompt, motionType }) => {
  const response = await fetch(getApiUrl('/ai-video/generate'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, image, prompt, motionType }),
  });
  return await handleApiResponse(response);
};

export const pollJobStatus = async (jobId) => {
  const response = await fetch(getApiUrl(`/ai-video/job/${jobId}`), {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

export const saveShoeVideo = async (productId, videoUrl) => {
  const response = await fetch(getApiUrl('/ai-video/save'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, videoUrl }),
  });
  return await handleApiResponse(response);
};

export const deleteShoeVideo = async (productId) => {
  const response = await fetch(getApiUrl(`/ai-video/${productId}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

export const toggleShoeVideo = async (productId, videoEnabled) => {
  const response = await fetch(getApiUrl(`/ai-video/${productId}/toggle`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ videoEnabled }),
  });
  return await handleApiResponse(response);
};

export const setHeroVideo = async (productId, enabled) => {
  const response = await fetch(getApiUrl(`/ai-video/${productId}/hero`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ enabled }),
  });
  return await handleApiResponse(response);
};

export const fetchSiteSettings = async () => {
  const response = await fetch(getApiUrl('/settings'), {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

export const updateSiteSettings = async (settingsData) => {
  const response = await fetch(getApiUrl('/settings'), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settingsData),
  });
  return await handleApiResponse(response);
};
