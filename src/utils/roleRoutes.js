export const getRoleBasedDashboard = (role) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return '/admindashboard';
    case 'user':
      return '/userdashboard';
    default:
      return '/unauthorized';
  }
};
