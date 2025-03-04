import { useAuth } from './useAuth';

/**
 * Custom hook for checking user role-based access
 * @returns {Object} - Object with methods for checking roles
 */
const useRoleCheck = () => {
  const { user } = useAuth();
  
  /**
   * Check if current user has the administrator role
   * @returns {boolean} - True if user is an administrator
   */
  const isAdministrator = () => {
    if (!user) return false;
    return user.role === 'administrator';
  };
  
  /**
   * Check if current user has the organization role
   * @returns {boolean} - True if user is an organization
   */
  const isOrganization = () => {
    if (!user) return false;
    return user.role === 'organization';
  };
  
  /**
   * Check if current user has the user role
   * @returns {boolean} - True if user has the user role (which includes processing capabilities)
   */
  const isUser = () => {
    if (!user) return false;
    return user.role === 'user';
  };
  
  /**
   * Check if the user has any of the specified roles
   * @param {Array<string>} roles - Array of roles to check
   * @returns {boolean} - True if user has any of the specified roles
   */
  const hasAnyRole = (roles) => {
    if (!user || !roles || !Array.isArray(roles)) return false;
    return roles.includes(user.role);
  };
  
  /**
   * Check if the user has all of the specified roles
   * @param {Array<string>} roles - Array of roles to check
   * @returns {boolean} - True if user has all specified roles
   */
  const hasAllRoles = (roles) => {
    if (!user || !roles || !Array.isArray(roles)) return false;
    return roles.every(role => user.role === role);
  };
  
  /**
   * Check if the user can manage users (only administrators can)
   * @returns {boolean} - True if user can manage users
   */
  const canManageUsers = () => {
    return isAdministrator();
  };
  
  /**
   * Check if the user can process requests (administrators and users can)
   * @returns {boolean} - True if user can process requests
   */
  const canProcessRequests = () => {
    return isAdministrator() || isUser();
  };
  
  /**
   * Check if the user can access reports and analytics (only administrators can)
   * @returns {boolean} - True if user can access reports
   */
  const canAccessReports = () => {
    return isAdministrator();
  };
  
  /**
   * Check if the user can upload response files (administrators and users can)
   * @returns {boolean} - True if user can upload files
   */
  const canUploadFiles = () => {
    return isAdministrator() || isUser();
  };
  
  /**
   * Check if the user can only view their own organization's requests
   * @returns {boolean} - True if user is restricted to viewing their organization's requests
   */
  const isRestrictedToOrganization = () => {
    return isOrganization();
  };
  
  return {
    isAdministrator,
    isOrganization,
    isUser,
    hasAnyRole,
    hasAllRoles,
    canManageUsers,
    canProcessRequests,
    canAccessReports,
    canUploadFiles,
    isRestrictedToOrganization
  };
};

export default useRoleCheck;
