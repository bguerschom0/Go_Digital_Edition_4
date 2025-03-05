import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import notificationService from '../services/notificationService';

/**
 * Hook for managing notifications
 * @returns {Object} Notification state and functions
 */
const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  
  /**
   * Fetch notifications for the current user
   * @param {Object} options - Query options
   */
  const fetchNotifications = useCallback(async (options = {}) => {
    if (!user) return;
    
    setLoading(true);
    
    const { notifications, error } = await notificationService.getUserNotifications(
      user.id, 
      options
    );
    
    if (!error) {
      setNotifications(notifications);
    }
    
    setLoading(false);
  }, [user]);
  
  /**
   * Fetch unread notification count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    const { count } = await notificationService.getUnreadCount(user.id);
    setUnreadCount(count);
  }, [user]);
  
  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   */
  const markAsRead = useCallback(async (notificationId) => {
    const { success } = await notificationService.markAsRead(notificationId);
    
    if (success) {
      // Update local state
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      ));
      
      // Decrement unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, []);
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    const { success } = await notificationService.markAllAsRead(user.id);
    
    if (success) {
      // Update local state
      setNotifications(prev => prev.map(notification => ({ ...notification, is_read: true })));
      setUnreadCount(0);
    }
  }, [user]);
  
  /**
   * Handle new notification
   * @param {Object} notification - New notification
   */
  const handleNewNotification = useCallback((notification) => {
    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);
    
    // Increment unread count
    setUnreadCount(prev => prev + 1);
    
    // Play notification sound if available
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.play();
    } catch (error) {
      // Silently fail if audio cannot be played
    }
  }, []);
  
  // Initialize notifications and set up subscription
  useEffect(() => {
    if (!user) return;
    
    // Fetch initial notifications and unread count
    fetchNotifications();
    fetchUnreadCount();
    
    // Set up real-time subscription
    const newSubscription = notificationService.subscribeToNotifications(
      user.id, 
      handleNewNotification
    );
    
    setSubscription(newSubscription);
    
    // Clean up subscription on unmount
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user, fetchNotifications, fetchUnreadCount, handleNewNotification]);
  
  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead
  };
};

export default useNotifications;
