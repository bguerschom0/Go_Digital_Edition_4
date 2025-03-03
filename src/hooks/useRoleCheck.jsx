// src/hooks/useRoleAccess.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { roleBasedNavigation } from '../components/layout/navigationConfig';

export const useRoleAccess = (pagePath) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = () => {
      // If no user, redirect to login
      if (!user) {
        navigate('/login');
        return;
      }

      const userRole = user.role?.toLowerCase();
      const userNavigation = roleBasedNavigation[userRole] || [];

      // Get all allowed paths for the role
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

      const allowedPaths = getAllowedPaths(userNavigation);

      // If current page path is not in allowed paths, redirect to unauthorized
      if (!allowedPaths.includes(pagePath)) {
        navigate('/unauthorized');
      }
    };

    checkAccess();
  }, [user, pagePath, navigate]);
};
