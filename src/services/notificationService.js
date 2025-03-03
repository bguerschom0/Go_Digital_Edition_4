import { supabase } from '../config/supabase';

/**
 * Create a new notification for a user
 * 
 * @param {string} userId - The ID of the user to notify
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string|null} relatedRequestId - Optional related request ID
 * @returns {Promise<{success: boolean, error: Error|null}>} - Success status
 */
export const createNotification = async (userId, title, message, relatedRequestId = null) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([
        {
          user_id: userId,
          title,
          message,
          related_request_id: relatedRequestId,
          is_read: false,
          created_at: new Date().toISOString()
        },
      ]);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};

/**
 * Create notifications for multiple users
 * 
 * @param {Array<string>} userIds - Array of user IDs to notify
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string|null} relatedRequestId - Optional related request ID
 * @returns {Promise<{success: boolean, error: Error|null}>} - Success status
 */
export const createMultipleNotifications = async (userIds, title, message, relatedRequestId = null) => {
  try {
    // Create notification objects for each user
    const notifications = userIds.map(userId => ({
      user_id: userId,
      title,
      message,
      related_request_id: relatedRequestId,
      is_read: false,
      created_at: new Date().toISOString()
    }));
    
    const { error } = await supabase
      .from('notifications')
      .insert(notifications);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error creating multiple notifications:', error);
    return { success: false, error };
  }
};

/**
 * Create a notification for all users with a specific role
 * 
 * @param {string|Array<string>} roles - Role or array of roles to notify
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string|null} relatedRequestId - Optional related request ID
 * @returns {Promise<{success: boolean, error: Error|null}>} - Success status
 */
export const notifyUsersByRole = async (roles, title, message, relatedRequestId = null) => {
  try {
    // Ensure roles is an array
    const roleArray = Array.isArray(roles) ? roles : [roles];
    
    // Get all users with specified roles
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .in('role', roleArray)
      .eq('is_active', true);
      
    if (userError) throw userError;
    
    if (!users || users.length === 0) {
      return { success: true, error: null }; // No users to notify
    }
    
    // Extract user IDs
    const userIds = users.map(user => user.id);
    
    // Create notifications for all users
    return await createMultipleNotifications(userIds, title, message, relatedRequestId);
  } catch (error) {
    console.error('Error notifying users by role:', error);
    return { success: false, error };
  }
};

/**
 * Create a notification for users by organization
 * 
 * @param {string} organizationId - The organization ID
 * @param {string} title - The notification title
 * @param {string} message - The notification message
 * @param {string|null} relatedRequestId - Optional related request ID
 * @returns {Promise<{success: boolean, error: Error|null}>} - Success status
 */
export const notifyOrganizationUsers = async (organizationId, title, message, relatedRequestId = null) => {
  try {
    // Get organization name
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .single();
      
    if (orgError) throw orgError;
    
    // Get all users from this organization
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('organization', org.name)
      .eq('role', 'organization')
      .eq('is_active', true);
      
    if (userError) throw userError;
    
    if (!users || users.length === 0) {
      return { success: true, error: null }; // No users to notify
    }
    
    // Extract user IDs
    const userIds = users.map(user => user.id);
    
    // Create notifications for all users
    return await createMultipleNotifications(userIds, title, message, relatedRequestId);
  } catch (error) {
    console.error('Error notifying organization users:', error);
    return { success: false, error };
  }
};

/**
 * Mark a notification as read
 * 
 * @param {string} notificationId - The notification ID
 * @returns {Promise<{success: boolean, error: Error|null}>} - Success status
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
};

/**
 * Mark all notifications as read for a user
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<{success: boolean, error: Error|null}>} - Success status
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error };
  }
};

/**
 * Get all notifications for a user
 * 
 * @param {string} userId - The user ID
 * @param {number} limit - Maximum number of notifications to return
 * @param {boolean} unreadOnly - Whether to only return unread notifications
 * @returns {Promise<{notifications: Array, error: Error|null}>} - The notifications
 */
export const getUserNotifications = async (userId, limit = 10, unreadOnly = false) => {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return { notifications: data || [], error: null };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return { notifications: [], error };
  }
};

/**
 * Get unread notification count for a user
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<{count: number, error: Error|null}>} - The count of unread notifications
 */
export const getUnreadCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_read', false);
      
    if (error) throw error;
    
    return { count: count || 0, error: null };
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return { count: 0, error };
  }
};

/**
 * Delete a notification
 * 
 * @param {string} notificationId - The notification ID
 * @returns {Promise<{success: boolean, error: Error|null}>} - Success status
 */
export const deleteNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
      
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error };
  }
};
