/**
 * Get the appropriate dashboard route based on user role
 * @param {string} role - The user's role
 * @returns {string} - The dashboard route path
 */
export const getRoleBasedDashboard = (role) => {
  if (!role) return '/login';
  
  switch (role.toLowerCase()) {
    case 'admin':
      return '/admindashboard';
    case 'organization':
      return '/orgdashboard';
    case 'user':
      return '/userdashboard';
    default:
      return '/userdashboard'; // Default fallback
  }
};
