import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const UserDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smooth transition
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {getGreeting()}, {user?.full_name}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Welcome to Visitor Management Platform!
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
