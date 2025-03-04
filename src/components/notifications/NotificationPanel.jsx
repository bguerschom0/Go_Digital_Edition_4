import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Eye, Loader2, ChevronRight, X } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

const NotificationPanel = ({ isOpen, onClose, maxHeight = '80vh', maxWidth = '400px' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Fetch notifications
  useEffect(() => {
    if (!isOpen || !user) return;
    
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (error) throw error;
        
        setNotifications(data || []);
        // Check if there are any unread notifications
        setHasUnread(data?.some(n => !n.is_read) || false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Set up real-time subscription for new notifications
    const notificationSubscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Add new notification to the list
        setNotifications(prev => [payload.new, ...prev]);
        setHasUnread(true);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, [isOpen, user]);

  // Mark a notification as read
  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
      
      // Check if there are still unread notifications
      setHasUnread(notifications.some(n => n.id !== id && !n.is_read));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (notifications.length === 0) return;
    
    setMarkingAll(true);
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      setHasUnread(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    // Mark as read
    await markAsRead(notification.id);
    
    // Navigate to related request if available
    if (notification.related_request_id) {
      navigate(`/requests/${notification.related_request_id}`);
      if (onClose) onClose();
    }
  };

  return (
    <div 
      style={{ 
        display: isOpen ? 'block' : 'none',
        maxHeight,
        maxWidth,
        width: '100%'
      }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Notifications
          </h2>
        </div>
        
        <div className="flex items-center">
          {hasUnread && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="mr-3 text-xs flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
            >
              {markingAll ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Eye className="h-3 w-3 mr-1" />
              )}
              Mark all as read
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Notifications list */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 60px)' }}>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Bell className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No notifications
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs">
              You don't have any notifications yet. They'll appear here when they arrive.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <motion.li
                key={notification.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative ${notification.is_read ? '' : 'bg-blue-50 dark:bg-blue-900/10'}`}
              >
                <button
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-start"
                >
                  {!notification.is_read && (
                    <span className="absolute top-0 left-0 h-full w-1 bg-blue-500 dark:bg-blue-600"></span>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm font-medium ${notification.is_read ? 'text-gray-900 dark:text-white' : 'text-blue-800 dark:text-blue-300'}`}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      {notification.message}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                      </span>
                      
                      {notification.related_request_id && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center">
                          View details
                          <ChevronRight className="h-3 w-3 ml-0.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
        <button
          onClick={() => {
            navigate('/notifications');
            if (onClose) onClose();
          }}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationPanel;
