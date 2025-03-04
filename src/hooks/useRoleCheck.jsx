import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { roleBasedNavigation } from '../components/layout/navigationConfig';

/**
 * Custom hook to check if the current user has access to a specific page
 * @param {string} pagePath - The path of the page being accessed
 */
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

/**
 * Custom hook to check if the current user has a specific role or set of roles
 * @returns {Object} Object with functions to check role access
 */
const useRoleCheck = () => {
  const { user } = useAuth();

  /**
   * Check if the user has any of the provided roles
   * @param {Array<string>} roles - Array of role names to check
   * @returns {boolean} True if user has any of the specified roles
   */
  const hasAnyRole = (roles = []) => {
    if (!user || !user.role) {
      return false;
    }
    
    return roles.includes(user.role.toLowerCase());
  };

  /**
   * Check if the user has all of the provided roles
   * @param {Array<string>} roles - Array of role names to check
   * @returns {boolean} True if user has all of the specified roles
   */
  const hasAllRoles = (roles = []) => {
    if (!user || !user.role) {
      return false;
    }
    
    // For a single role, this is the same check
    return roles.every(role => user.role.toLowerCase() === role.toLowerCase());
  };

  /**
   * Check if the user is an administrator
   * @returns {boolean} True if user has admin role
   */
  const isAdmin = () => {
    if (!user || !user.role) {
      return false;
    }
    
    return user.role.toLowerCase() === 'admin';
  };

  /**
   * Check if the user is a supervisor
   * @returns {boolean} True if user has supervisor role
   */
  const isSupervisor = () => {
    if (!user || !user.role) {
      return false;
    }
    
    return user.role.toLowerCase() === 'supervisor';
  };
  
  /**
   * Check if the user is a processor
   * @returns {boolean} True if user has processor role
   */
  const isProcessor = () => {
    if (!user || !user.role) {
      return false;
    }
    
    return user.role.toLowerCase() === 'processor';
  };
  
  /**
   * Check if the user is from an organization
   * @returns {boolean} True if user has organization role
   */
  const isOrganization = () => {
    if (!user || !user.role) {
      return false;
    }
    
    return user.role.toLowerCase() === 'organization';
  };
  
  /**
   * Check if the user has admin or supervisor role
   * @returns {boolean} True if user is admin or supervisor
   */
  const isAdminOrSupervisor = () => {
    return hasAnyRole(['admin', 'supervisor']);
  };
  
  /**
   * Check if the user has permissions to manage requests
   * @returns {boolean} True if user can manage requests
   */
  const canManageRequests = () => {
    return hasAnyRole(['admin', 'processor']);
  };
  
  /**
   * Check if the user has permissions to view reports
   * @returns {boolean} True if user can view reports
   */
  const canViewReports = () => {
    return hasAnyRole(['admin', 'supervisor']);
  };
  
  /**
   * Check if the user has permissions to manage users
   * @returns {boolean} True if user can manage users
   */
  const canManageUsers = () => {
    return isAdmin();
  };
  
  /**
   * Check if the user belongs to a specific organization
   * @param {string} orgName - Organization name to check
   * @returns {boolean} True if user belongs to the specified organization
   */
  const belongsToOrg = (orgName) => {
    if (!user || !user.organization || !orgName) {
      return false;
    }
    
    return user.organization.toLowerCase() === orgName.toLowerCase();
  };

  return {
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isSupervisor,
    isProcessor,
    isOrganization,
    isAdminOrSupervisor,
    canManageRequests,
    canViewReports,
    canManageUsers,
    belongsToOrg
  };
};

export default useRoleCheck;
