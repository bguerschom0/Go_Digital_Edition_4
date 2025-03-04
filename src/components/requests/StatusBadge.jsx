import React from 'react';
import { Clock, Loader2, CheckCircle } from 'lucide-react';

const StatusBadge = ({ status, size = 'md', showIcon = true }) => {
  // Format status text for display
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get status color and icon
  const getStatusInfo = (status) => {
    switch(status) {
      case 'pending':
        return { 
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          icon: <Clock className="h-4 w-4" />
        };
      case 'in_progress':
        return { 
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-200',
          icon: <Loader2 className="h-4 w-4 animate-spin" />
        };
      case 'completed':
        return { 
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-800 dark:text-green-200',
          icon: <CheckCircle className="h-4 w-4" />
        };
      default:
        return { 
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          textColor: 'text-gray-800 dark:text-gray-200',
          icon: <Clock className="h-4 w-4" />
        };
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const { bgColor, textColor, icon } = getStatusInfo(status);
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${bgColor} ${textColor} ${sizeClass}`}>
      {showIcon && <span className="mr-1">{icon}</span>}
      {formatStatus(status)}
    </span>
  );
};

export default StatusBadge;
