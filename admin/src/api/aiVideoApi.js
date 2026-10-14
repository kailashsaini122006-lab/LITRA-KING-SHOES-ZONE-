import { getBaseUrl, getAuthHeaders, handleApiResponse } from './apiConfig';

/**
 * Check if an AI video provider is configured
 */
export const fetchAiVideoStatus = async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/ai-video/status`, {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

/**
 * Save or update AI Video Provider & API key in backend
 */
export const saveAiVideoConfig = async (config) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/ai-video/config`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  });
  return await handleApiResponse(response);
};

/**
 * Test AI video provider credentials
 */
export const testAiVideoConnection = async (provider, apiKey) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/ai-video/test-connection`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ provider, apiKey }),
  });
  return await handleApiResponse(response);
};

/**
 * Initiate AI video generation
 */
export const generateShoeVideo = async ({ productId, image, prompt, motionType }) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/ai-video/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, image, prompt, motionType }),
  });
  return await handleApiResponse(response);
};

/**
 * Poll generation job progress
 */
export const pollJobStatus = async (jobId) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/ai-video/job/${jobId}`, {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

/**
 * Permanently download and attach video to product in DB
 */
export const saveShoeVideo = async (productId, videoUrl) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/ai-video/save`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId, videoUrl }),
  });
  return await handleApiResponse(response);
};

/**
 * Remove video from product
 */
export const deleteShoeVideo = async (productId) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/ai-video/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

/**
 * Toggle whether video displays on product details page
 */
export const toggleShoeVideo = async (productId, videoEnabled) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/ai-video/${productId}/toggle`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ videoEnabled }),
  });
  return await handleApiResponse(response);
};

/**
 * Set or toggle product video for Home Page hero section
 */
export const setHeroVideo = async (productId, enabled) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/ai-video/${productId}/hero`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ enabled }),
  });
  return await handleApiResponse(response);
};

/**
 * Fetch public / admin site settings
 */
export const fetchSiteSettings = async () => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/settings`, {
    headers: getAuthHeaders(),
  });
  return await handleApiResponse(response);
};

/**
 * Update site settings (hero video toggle, selected hero product)
 */
export const updateSiteSettings = async (settingsData) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/settings`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(settingsData),
  });
  return await handleApiResponse(response);
};
