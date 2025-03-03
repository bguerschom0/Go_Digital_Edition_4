// src/hooks/useAccess.js
import { useAuth } from './useAuth';

const roleAccess = {
  admin: [
    '/admindashboard',
    '/user-management'
  ],
  user: [
    '/userdashboard',
  ]
};

export const useAccess = () => {
  const { user } = useAuth();

  const hasAccess = (path) => {
    if (!user || !user.role) return false;
    return roleAccess[user.role]?.includes(path) || false;
  };

  return { hasAccess };
};
