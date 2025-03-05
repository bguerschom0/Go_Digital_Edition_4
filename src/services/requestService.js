import { supabase } from '../config/supabase';

/**
 * Create a new request
 * 
 * @param {Object} requestData - The request data
 * @returns {Promise<Object>} - The created request
 */
export const createRequest = async (requestData) => {
  try {
    const { data, error } = await supabase
      .from('v4_requests')
      .insert([requestData])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating request:', error);
    throw error;
  }
};

/**
 * Get a request by ID
 * 
 * @param {string} requestId - The request ID
 * @returns {Promise<Object>} - The request data
 */
export const getRequestById = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('v4_requests')
      .select(`
        *,
        organizations:sender (id, name, contact_person, email, phone),
        created_by_user:created_by (full_name, username),
        assigned_to_user:assigned_to (full_name, username),
        updated_by_user:updated_by (full_name, username)
      `)
      .eq('id', requestId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching request:', error);
    throw error;
  }
};

/**
 * Update a request
 * 
 * @param {string} requestId - The request ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} - The updated request
 */
export const updateRequest = async (requestId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('v4_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating request:', error);
    throw error;
  }
};

/**
 * Mark a request as completed
 * 
 * @param {string} requestId - The request ID
 * @param {string} userId - The ID of the user completing the request
 * @returns {Promise<Object>} - The updated request
 */
export const completeRequest = async (requestId, userId) => {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('v4_requests')
      .update({ 
        status: 'completed',
        completed_at: now,
        updated_by: userId,
        updated_at: now
      })
      .eq('id', requestId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error completing request:', error);
    throw error;
  }
};

/**
 * Get all requests with filtering options
 * 
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} - Array of requests
 */
export const getRequests = async (filters = {}) => {
  try {
    let query = supabase
      .from('v4_requests')
      .select(`
        *,
        organizations:sender (name),
        files:v4_request_files (id),
        comments:v4_comments (id)
      `)
      .order('date_received', { ascending: false });
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    // Apply organization filter
    if (filters.organization && filters.organization !== 'all') {
      query = query.eq('sender', filters.organization);
    }
    
    // Apply priority filter
    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    
    // Apply date range filter
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        query = query.gte('date_received', filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        query = query.lte('date_received', filters.dateRange.end);
      }
    }
    
    // Apply search term
    if (filters.searchTerm) {
      query = query.or(
        `reference_number.ilike.%${filters.searchTerm}%,subject.ilike.%${filters.searchTerm}%`
      );
    }
    
    // Apply assigned to filter
    if (filters.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }
    
    // For organization users, filter by their organization
    if (filters.organizationId) {
      query = query.eq('sender', filters.organizationId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Process request data
    const processedRequests = data.map(request => ({
      ...request,
      sender_name: request.organizations.name,
      files_count: request.files ? request.files.length : 0,
      comments_count: request.comments ? request.comments.length : 0
    }));
    
    return processedRequests;
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
};

/**
 * Delete a request
 * 
 * @param {string} requestId - The request ID
 * @returns {Promise<void>}
 */
export const deleteRequest = async (requestId) => {
  try {
    const { error } = await supabase
      .from('v4_requests')
      .delete()
      .eq('id', requestId);
      
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting request:', error);
    throw error;
  }
};

/**
 * Assign a request to a user
 * 
 * @param {string} requestId - The request ID
 * @param {string} userId - The user ID to assign to
 * @param {string} updatedBy - The ID of the user making the change
 * @returns {Promise<Object>} - The updated request
 */
export const assignRequest = async (requestId, userId, updatedBy) => {
  try {
    const { data, error } = await supabase
      .from('v4_requests')
      .update({ 
        assigned_to: userId,
        status: 'in_progress',
        updated_by: updatedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error assigning request:', error);
    throw error;
  }
};
