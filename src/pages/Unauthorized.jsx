import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Home, LogOut } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <div className="flex flex-col items-center">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 mb-4">
            <Shield className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Access Denied
          </h1>
          
          <p className="mt-2 text-center text-gray-500 dark:text-gray-400">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          
          {user && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg w-full">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Current User:</span> {user.full_name}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Role:</span> {user.role}
              </p>
            </div>
          )}
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center px-6 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                     hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </button>
            
            <button
              onClick={handleLogout}
              className="flex items-center justify-center px-6 py-2 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg
                     hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
