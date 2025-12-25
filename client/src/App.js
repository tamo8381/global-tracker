import React, { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

// Layout
import MainLayout from './layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import Countries from './pages/Countries';
import Companies from './pages/Companies';
import People from './pages/People';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Page404 from './pages/Page404';

// Theme
import buildTheme from './theme/theme';

// Context Providers
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeSettingsProvider, useThemeSettings } from './contexts/ThemeSettingsContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

const AppContent = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      {/* Protected Routes - Wrapped in MainLayout */}
      <Route element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/countries/*" element={<Countries />} />
        <Route path="/companies/*" element={<Companies />} />
        <Route path="/people/*" element={<People />} />
        <Route path="/settings/*" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      
      {/* 404 Route */}
      <Route path="*" element={<Page404 />} />
    </Routes>
  );
};

const ThemedApp = () => {
  const { effectiveMode, primaryColor, secondaryColor } = useThemeSettings();
  const theme = useMemo(() => buildTheme({ mode: effectiveMode, primaryColor, secondaryColor }), [effectiveMode, primaryColor, secondaryColor]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

const App = () => (
  <ThemeSettingsProvider>
    <ThemedApp />
  </ThemeSettingsProvider>
);

export default App;
