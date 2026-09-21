import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminLogin, verifyAdminToken } from '../api/authApi';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await verifyAdminToken();
      if (isValid) {
        setIsAuthenticated(true);
        setAdminUser(JSON.parse(localStorage.getItem('litra_admin_user') || '{"name":"Admin Store Owner"}'));
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const data = await adminLogin(credentials);
    if (data && (data.token || data.success)) {
      const token = data.token || 'admin-session-token';
      const user = data.admin || { name: 'Admin Store Owner', role: 'admin' };
      localStorage.setItem('litra_admin_token', token);
      localStorage.setItem('litra_admin_user', JSON.stringify(user));
      setIsAuthenticated(true);
      setAdminUser(user);
      return { success: true };
    }
    throw new Error(data.message || 'Login failed. Invalid credentials.');
  };

  const logout = () => {
    localStorage.removeItem('litra_admin_token');
    localStorage.removeItem('litra_admin_user');
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, adminUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
