// src/pages/Unauthorized.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getRoleBasedDashboard } from '../utils/roleRoutes';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturn = () => {
    if (user) {
      navigate(getRoleBasedDashboard(user.role));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          You don't have permission to access this page.
        </p>
        <button
          onClick={handleReturn}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800
                   transition-colors dark:bg-white dark:text-black dark:hover:bg-gray-100"
        >
          {user ? 'Return to Dashboard' : 'Return to Login'}
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;
