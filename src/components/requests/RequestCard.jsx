import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare, FileText, ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const RequestCard = ({ request, onClick }) => {
  const { 
    reference_number, 
    date_received, 
    subject, 
    sender_name, // Organization name
    status, 
    created_at,
    files_count = 0,
    comments_count = 0,
    priority = 'normal'
  } = request;

  // Format the date for display
  const formattedDate = new Date(date_received).toLocaleDateString();
  
  // Calculate how long ago the request was created
  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });

  // Determine status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Determine priority color
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'; // Default to normal
    }
  };

  // Format status text for display
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-all hover:shadow-md"
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {reference_number}
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {formatStatus(status)}
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
          {subject}
        </p>

        <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Received: {formattedDate}</span>
        </div>

        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <ExternalLink className="h-4 w-4 mr-1" />
          <span className="truncate">From: {sender_name}</span>
        </div>

        <div className="mt-3 flex items-center">
          <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityColor(priority)}`}>
            {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3.5 w-3.5 mr-1" />
            <span>{timeAgo}</span>
          </div>
          
          <div className="flex space-x-3">
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <FileText className="h-3.5 w-3.5 mr-1" />
              <span>{files_count}</span>
            </div>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              <span>{comments_count}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RequestCard;
