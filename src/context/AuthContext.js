import React, { createContext, useState, useEffect } from 'react';

// Create the AuthContext
export const AuthContext = createContext();

// AuthProvider component to wrap the application and provide auth state
export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage for persistence across reloads
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [role, setRole] = useState(user ? user.role : null);
  const [loading, setLoading] = useState(true); // To indicate if auth state is being loaded

  useEffect(() => {
    // On initial load or state changes, update localStorage
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      setRole(user.role);
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setRole(null);
    }
    setLoading(false); // Auth state loaded
  }, [user, token]);

  // Login function
  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    window.location.href = '/login'; // Redirect to login page after logout
  };

  const authContextValue = {
    user,
    token,
    role,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};