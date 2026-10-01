import { getBaseUrl, handleApiResponse } from './apiConfig';

export const adminLogin = async (credentials) => {
  const baseUrl = getBaseUrl();
  const inputStr = String(credentials.pin || credentials.password || '').trim();

  // If 4-digit numeric PIN, try verify-pin first
  if (/^\d{4}$/.test(inputStr)) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: inputStr }),
      });
      const data = await handleApiResponse(response);
      return {
        success: true,
        token: data.accessToken || data.token,
        admin: data.admin || { name: 'Store Owner', role: 'admin' },
      };
    } catch (err) {
      // If verify-pin fails, fall through to try login password
    }
  }

  // Password / Admin ID Login
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email || credentials.adminId || 'admin',
      password: inputStr,
    }),
  });
  const data = await handleApiResponse(response);
  return {
    success: true,
    token: data.accessToken || data.token,
    admin: data.admin || { name: 'Store Owner', role: 'admin' },
  };
};

export const verifyAdminToken = async () => {
  const token =
    localStorage.getItem('litra_admin_token') ||
    sessionStorage.getItem('lk_access_token') ||
    localStorage.getItem('lk_access_token');

  if (!token) return false;

  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/verify-token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.valid) {
        return true;
      }
    }
  } catch (err) {
    console.error('Token verification error:', err.message);
  }

  // Invalid or expired token — clear stored tokens
  localStorage.removeItem('litra_admin_token');
  localStorage.removeItem('litra_admin_user');
  localStorage.removeItem('lk_access_token');
  sessionStorage.removeItem('lk_access_token');
  return false;
};

export const forgotPassword = async (email) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return await handleApiResponse(response);
};

export const verifyOtp = async ({ email, otp }) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  return await handleApiResponse(response);
};

export const resetPassword = async ({ email, otp, newPassword, confirmPassword }) => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
  });
  return await handleApiResponse(response);
};
