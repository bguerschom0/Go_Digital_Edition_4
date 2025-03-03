import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './useAuth';
import {
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../services/notificationService';

/**
 * Custom hook for managing notifications
 * 
 * @param {number} limit - Maximum number of notifications to fetch
 * @returns {Object} - Notification related state and functions
 */
const useNotifications = (limit = 10) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get notifications
      const { notifications: data, error: notifError } = await getUserNotifications(user.id, limit);
      
      if (notifError) throw notifError;
      
      // Get unread count
      const { count, error: countError } = await getUnreadCount(user.id);
      
      if (countError) throw countError;
      
      setNotifications(data);
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const { success, error: markError } = await markNotificationAsRead(notificationId);
      
      if (markError) throw markError;
      
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true } 
              : notification
          )
        );
        
        // Decrement unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return { success };
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return { success: false };
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return { success: false };
    
    try {
      const { success, error: markError } = await markAllNotificationsAsRead(user.id);
      
      if (markError) throw markError;
      
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        
        // Reset unread count
        setUnreadCount(0);
      }
      
      return { success };
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return { success: false };
    }
  }, [user]);

  // Delete a notification
  const removeNotification = useCallback(async (notificationId) => {
    try {
      const { success, error: deleteError } = await deleteNotification(notificationId);
      
      if (deleteError) throw deleteError;
      
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
        
        // Update unread count if needed
        const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      
      return { success };
    } catch (err) {
      console.error('Error deleting notification:', err);
      return { success: false };
    }
  }, [notifications]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;
    
    const subscription = supabase
      .channel('public:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Add new notification to the list
        setNotifications(prev => [payload.new, ...prev].slice(0, limit));
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, limit]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification
  };
};

export default useNotifications;
