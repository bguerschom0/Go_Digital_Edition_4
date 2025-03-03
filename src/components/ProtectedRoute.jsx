// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { roleBasedNavigation } from '../layout/navigationConfig';
import { getRoleBasedDashboard } from '../utils/roleRoutes';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user's role exists in roleBasedNavigation
  const userRole = user.role?.toLowerCase();
  if (!roleBasedNavigation[userRole]) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Get all allowed paths for the user's role
  const getAllowedPaths = (navItems) => {
    let paths = [];
    navItems.forEach(item => {
      if (item.path) {
        paths.push(item.path);
      }
      if (item.children) {
        paths = [...paths, ...item.children.map(child => child.path)];
      }
    });
    return paths;
  };

  const allowedPaths = getAllowedPaths(roleBasedNavigation[userRole]);

  // If trying to access root or dashboard, redirect to role-specific dashboard
  if (location.pathname === '/' || location.pathname === '/dashboard') {
    return <Navigate to={getRoleBasedDashboard(userRole)} replace />;
  }

  // Check if current path is allowed for user's role
  if (!allowedPaths.includes(location.pathname)) {
    console.log(`Access denied: ${userRole} attempted to access ${location.pathname}`);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
