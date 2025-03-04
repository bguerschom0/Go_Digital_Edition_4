import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

const MetricsCard = ({
  title,
  value,
  icon,
  trend = null, // Can be a number: positive for increase, negative for decrease
  trendPeriod = 'vs. previous period',
  trendInverse = false, // Set to true if negative trends are good (e.g., reduced errors)
  formatter = (val) => val, // Function to format the value
  className = '',
  onClick,
}) => {
  // Determine trend direction and styling
  const trendDirection = trend > 0 ? 'up' : trend < 0 ? 'down' : null;
  
  // Determine if trend is positive or negative
  // By default: up is good, down is bad
  // If trendInverse: up is bad, down is good
  const isPositiveTrend = trendInverse
    ? trendDirection === 'down'
    : trendDirection === 'up';

  // Get trend color class
  const getTrendColor = () => {
    if (trendDirection === null) return 'text-gray-500 dark:text-gray-400';
    return isPositiveTrend
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  // Format trend value as percentage
  const formatTrend = (val) => {
    if (val === null) return '';
    const absVal = Math.abs(val);
    return `${absVal.toFixed(1)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm cursor-pointer
                 transition-shadow hover:shadow-md ${className}`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        {icon && (
          <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-700">
            {icon}
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatter(value)}
        </div>
        
        {trend !== null && (
          <div className="mt-2 flex items-center">
            <span className={`flex items-center text-sm ${getTrendColor()}`}>
              {trendDirection === 'up' ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : trendDirection === 'down' ? (
                <ArrowDown className="h-4 w-4 mr-1" />
              ) : null}
              {formatTrend(trend)}
            </span>
            <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
              {trendPeriod}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MetricsCard;
