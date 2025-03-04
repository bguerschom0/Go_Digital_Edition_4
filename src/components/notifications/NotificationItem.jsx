import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Check, FileText } from 'lucide-react';
import { supabase } from '../../config/supabase';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const navigate = useNavigate();
  
  // Format date
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
  
  // Handle notification click
  const handleClick = async () => {
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
        
        if (onMarkAsRead) {
          onMarkAsRead(notification.id);
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Navigate to related content if available
    if (notification.related_request_id) {
      navigate(`/requests/${notification.related_request_id}`);
    }
  };
  
  // Mark notification as read
  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('v4_notifications')
      .update({ is_read: true })
      .eq('id', id);
      
    if (error) throw error;
  };
  
  // Handle mark as read without navigating
  const handleMarkAsRead = async (e) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    
    if (!notification.is_read) {
      try {
        await markAsRead(notification.id);
        
        if (onMarkAsRead) {
          onMarkAsRead(notification.id);
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };
  
  // Get icon based on notification content
  const getIcon = () => {
    if (notification.title.toLowerCase().includes('request')) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    
    // Default icon
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div 
      onClick={handleClick}
      className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
        !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        
        <div className="flex-grow min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {notification.message}
          </p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {timeAgo}
            </span>
            
            {!notification.is_read && (
              <button 
                onClick={handleMarkAsRead}
                className="flex items-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
