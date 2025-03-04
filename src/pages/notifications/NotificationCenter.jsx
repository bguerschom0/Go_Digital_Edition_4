import React from 'react';
import { motion } from 'framer-motion';
import NotificationList from '../../components/notifications/NotificationList';

const NotificationCenter = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <NotificationList />
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationCenter;
