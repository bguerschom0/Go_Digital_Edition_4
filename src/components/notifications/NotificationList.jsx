import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import NotificationItem from './NotificationItem';
import { Bell, Loader2, Filter, Eye, Trash2 } from 'lucide-react';

const NotificationList = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOption, setFilterOption] = useState('all'); // 'all', 'unread', 'read'
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  // Fetch notifications
  useEffect(() => {
    fetchNotifications(0);
  }, [user, filterOption]);

  const fetchNotifications = async (pageIndex) => {
    if (!user) return;
    
    try {
      setLoadingMore(pageIndex > 0);
      if (pageIndex === 0) {
        setLoading(true);
      }
      
      let query = supabase
        .from('v4_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);
      
      // Apply filter
      if (filterOption === 'unread') {
        query = query.eq('is_read', false);
      } else if (filterOption === 'read') {
        query = query.eq('is_read', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Check if this is the last page
      if (!data || data.length < pageSize) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      // If this is the first page, replace all notifications
      // Otherwise, append to existing notifications
      if (pageIndex === 0) {
        setNotifications(data || []);
      } else {
        setNotifications(prev => [...prev, ...(data || [])]);
      }
      
      setPage(pageIndex);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Mark a notification as read
  const handleMarkAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: true } 
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      
      const { error } = await supabase
        .from('v4_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
        
      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };
  
  // Delete all read notifications
  const deleteReadNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete all read notifications? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('v4_notifications')
        .delete()
        .eq('user_id', user.id)
        .eq('is_read', true);
        
      if (error) throw error;
      
      // Refresh notifications
      fetchNotifications(0);
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (hasMore && !loadingMore) {
      fetchNotifications(page + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          Notifications
        </h2>
        
        <div className="flex flex-wrap gap-3">
          {/* Filter options */}
          <div className="relative">
            <select
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-gray-400"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          
          {/* Action buttons */}
          <button
            onClick={markAllAsRead}
            disabled={markingAllRead || notifications.every(n => n.is_read)}
            className="flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
          >
            {markingAllRead ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Mark All as Read
          </button>
          
          <button
            onClick={deleteReadNotifications}
            disabled={notifications.every(n => !n.is_read)}
            className="flex items-center px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Read
          </button>
        </div>
      </div>
      
      {/* Notification list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <Bell className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-center">No notifications found</p>
            <p className="text-sm text-center mt-1">
              {filterOption === 'all' 
                ? "You don't have any notifications yet" 
                : `You don't have any ${filterOption} notifications`}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map(notification => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onMarkAsRead={handleMarkAsRead}
                />
              ))}
            </div>
            
            {/* Load more button */}
            {hasMore && (
              <div className="p-4 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
