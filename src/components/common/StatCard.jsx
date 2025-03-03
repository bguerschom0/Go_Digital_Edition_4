import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({ title, value, icon, description, color = 'bg-white', textColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${color} dark:bg-gray-800 rounded-xl p-6 shadow-sm`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${textColor || 'text-gray-900 dark:text-white'} mb-1`}>
        {value}
      </p>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </motion.div>
  );
};
