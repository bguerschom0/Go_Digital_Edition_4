import { motion } from 'framer-motion';

export const StatCard = ({ title, value, icon, change, changeType }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{value}</h3>
      </div>
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
        {icon}
      </div>
    </div>
    {change && (
      <div className="mt-4 flex items-center">
        <span className={`text-sm ${
          changeType === 'increase' ? 'text-green-500' : 'text-red-500'
        }`}>
          {changeType === 'increase' ? '↑' : '↓'} {change}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
      </div>
    )}
  </motion.div>
);

export default StatCard;
