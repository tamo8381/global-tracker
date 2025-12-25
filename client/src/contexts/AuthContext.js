import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

// Use sessionStorage instead of localStorage so closing the browser/session forces login
const storage = window.sessionStorage;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Set up axios response interceptor
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401) {
          // If unauthorized, log the user out
          storage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setUser(null);
          navigate('/login');
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptor
    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [navigate]);

  // Check authentication status on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = storage.getItem('token');
        if (token) {
          // Set the auth token
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user data
          const response = await api.get('/auth/me');
          const fetchedUser = response.data.data || {};
          setUser({ ...fetchedUser, id: fetchedUser.id || fetchedUser._id });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        storage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      console.log('Attempting login with:', { email });
      
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.token) {
        const { token, user } = response.data;
        
        // Store the token in sessionStorage (so it's cleared on browser close)
        storage.setItem('token', token);
        
        // Set the auth header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Update user data
        setUser({ ...user, id: user.id || user._id });
        
        return { success: true };
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      const message = error.response?.data?.error || 'Login failed. Please check your credentials.';
      return { 
        success: false, 
        message: message
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Store the current token before removing it
      const token = storage.getItem('token');
      
      // Clear client-side auth state first to prevent race conditions
      storage.removeItem('token');
      if (api?.defaults?.headers?.common?.Authorization) delete api.defaults.headers.common['Authorization'];
      setUser(null);
      
      // Attempt to call the server-side logout endpoint with the token
      if (token) {
        try {
          await api.post('/auth/logout', {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          console.error('Logout API error:', error);
          // Continue with client-side logout even if server logout fails
        }
      }
      
      // Ensure all auth state is cleared
      storage.removeItem('token');
      if (api?.defaults?.headers?.common?.Authorization) delete api.defaults.headers.common['Authorization'];
      setUser(null);
      
      // Navigate to login page
      navigate('/login');
      
      // Force a full page reload to ensure all state is cleared
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Error during logout:', error);
      // Still redirect to login even if there's an error
      window.location.href = '/login';
    }
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const updateUser = (newUserData) => {
    setUser(prevUser => ({ ...prevUser, ...newUserData }));
  };

  const hasRole = (requiredRole) => {
    if (!user) return false;
    return user.role === requiredRole;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
