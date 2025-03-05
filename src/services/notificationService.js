import { supabase } from '../config/supabase';

/**
 * Service for handling notification-related operations
 */
const notificationService = {
  /**
   * Get notifications for a specific user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of notifications to return
   * @param {boolean} options.unreadOnly - If true, only return unread notifications
   * @returns {Promise<Object>} - Notifications and error if any
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const { limit = 10, unreadOnly = false } = options;
      
      let query = supabase
        .from('v4_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (unreadOnly) {
        query = query.eq('is_read', false);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { notifications: data || [], error: null };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], error: error.message };
    }
  },
  
  /**
   * Get the count of unread notifications for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Count and error if any
   */
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('v4_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) throw error;
      
      return { count: count || 0, error: null };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { count: 0, error: error.message };
    }
  },
  
  /**
   * Mark a notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Success status and error if any
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('v4_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Mark all notifications for a user as read
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Success status and error if any
   */
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('v4_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Create a new notification
   * @param {Object} notification - Notification object
   * @param {string} notification.user_id - User ID
   * @param {string} notification.title - Notification title
   * @param {string} notification.message - Notification message
   * @param {string} [notification.related_request_id] - Related request ID (optional)
   * @returns {Promise<Object>} - Created notification and error if any
   */
  async createNotification(notification) {
    try {
      const { data, error } = await supabase
        .from('v4_notifications')
        .insert([notification])
        .select()
        .single();
      
      if (error) throw error;
      
      return { notification: data, error: null };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { notification: null, error: error.message };
    }
  },
  
  /**
   * Delete a notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<Object>} - Success status and error if any
   */
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('v4_notifications')
        .delete()
        .eq('id', notificationId);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Delete all read notifications for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Success status and error if any
   */
  async clearReadNotifications(userId) {
    try {
      const { error } = await supabase
        .from('v4_notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);
      
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Subscribe to notifications for a specific user
   * @param {string} userId - User ID
   * @param {Function} callback - Callback function to run when new notifications arrive
   * @returns {Object} - Subscription that can be used to unsubscribe
   */
  subscribeToNotifications(userId, callback) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'v4_notifications',
        filter: `user_id=eq.${userId}`
      }, payload => {
        if (callback && typeof callback === 'function') {
          callback(payload.new);
        }
      })
      .subscribe();
    
    return subscription;
  }
};

export default notificationService;
