/**
 * Dynamically construct valid backend API endpoint URLs
 * Handles trailing slashes, missing /api prefix, and env variables.
 */
export function getApiUrl(endpoint = '') {
  let envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  // Remove trailing slashes
  envUrl = envUrl.replace(/\/+$/, '');
  
  // Ensure /api suffix
  if (!envUrl.endsWith('/api')) {
    envUrl += '/api';
  }

  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return `${envUrl}${cleanEndpoint}`;
}
