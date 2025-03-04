import { supabase } from '../config/supabase';
import { REQUEST_STATUS } from '../config/constants';
import { calculateDeletionDate } from '../utils/dateUtils';

/**
 * Get all requests with pagination and filtering options
 * @param {Object} options - Options for filtering and pagination
 * @returns {Promise<Object>} - Requests data and count
 */
export const getRequests = async (options = {}) => {
  const {
    page = 1,
    pageSize = 10,
    status = [],
    organization = null,
    searchTerm = '',
    dateFrom = null,
    dateTo = null,
    userId = null,
    onlyAssigned = false,
    orderBy = 'date_received',
    orderDirection = 'desc'
  } = options;

  try {
    // Calculate pagination values
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Start building the query
    let query = supabase
      .from('requests')
      .select(`
        *,
        organizations:sender (name),
        created_by_user:created_by (full_name, username),
        assigned_to_user:assigned_to (full_name, username),
        updated_by_user:updated_by (full_name, username),
        files:request_files (id),
        comments (id)
      `, { count: 'exact' });

    // Apply status filter if specified
    if (status && status.length > 0) {
      query = query.in('status', status);
    }

    // Apply organization filter if specified
    if (organization) {
      query = query.eq('sender', organization);
    }

    // Apply date range filter if specified
    if (dateFrom) {
      query = query.gte('date_received', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date_received', dateTo);
    }

    // Apply user-specific filters
    if (userId) {
      if (onlyAssigned) {
        // Only requests assigned to the user
        query = query.eq('assigned_to', userId);
      } else {
        // Requests created by or assigned to the user
        query = query.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
      }
    }

    // Apply search term if specified
    if (searchTerm) {
      query = query.or(
        `reference_number.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%`
      );
    }

    // Apply ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply pagination
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) throw error;

    // Process request data
    const processedRequests = data.map(request => ({
      ...request,
      sender_name: request.organizations?.name,
      files_count: request.files?.length || 0,
      comments_count: request.comments?.length || 0
    }));

    return {
      data: processedRequests,
      count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize)
    };
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw error;
  }
};

/**
 * Get a single request by ID
 * @param {string} requestId - The request ID
 * @returns {Promise<Object>} - Request data
 */
export const getRequestById = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('requests')
      .select(`
        *,
        organizations:sender (id, name, contact_person, email, phone),
        created_by_user:created_by (full_name, username),
        assigned_to_user:assigned_to (full_name, username),
        updated_by_user:updated_by (full_name, username),
        files:request_files (id),
        comments (id)
      `)
      .eq('id', requestId)
      .single();

    if (error) throw error;

    // Process request data
    const processedRequest = {
      ...data,
      sender_name: data.organizations?.name,
      sender_org: data.organizations,
      files_count: data.files?.length || 0,
      comments_count: data.comments?.length || 0
    };

    return processedRequest;
  } catch (error) {
    console.error(`Error fetching request ${requestId}:`, error);
    throw error;
  }
};

/**
 * Create a new request
 * @param {Object} requestData - Request data
 * @param {string} userId - ID of the user creating the request
 * @returns {Promise<Object>} - Created request data
 */
export const createRequest = async (requestData, userId) => {
  try {
    const { data, error } = await supabase
      .from('requests')
      .insert([
        {
          ...requestData,
          created_by: userId,
          status: REQUEST_STATUS.PENDING
        }
      ])
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
 * Update an existing request
 * @param {string} requestId - ID of the request to update
 * @param {Object} updateData - Data to update
 * @param {string} userId - ID of the user updating the request
 * @returns {Promise<Object>} - Updated request data
 */
export const updateRequest = async (requestId, updateData, userId) => {
  try {
    // Check if status is being updated to completed
    let updatedData = {
      ...updateData,
      updated_by: userId,
      updated_at: new Date().toISOString()
    };

    if (updateData.status === REQUEST_STATUS.COMPLETED && !updateData.completed_at) {
      // Set completion date and calculate deletion date
      const completionDate = new Date().toISOString();
      updatedData.completed_at = completionDate;
      updatedData.deletion_date = calculateDeletionDate(completionDate).toISOString();
    }

    const { data, error } = await supabase
      .from('requests')
      .update(updatedData)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(`Error updating request ${requestId}:`, error);
    throw error;
  }
};

/**
 * Delete a request
 * @param {string} requestId - ID of the request to delete
 * @returns {Promise<boolean>} - True if successful
 */
export const deleteRequest = async (requestId) => {
  try {
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error(`Error deleting request ${requestId}:`, error);
    throw error;
  }
};

/**
 * Get request files
 * @param {string} requestId - ID of the request
 * @returns {Promise<Array>} - Array of files
 */
export const getRequestFiles = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('request_files')
      .select(`
        *,
        uploaded_by_user:uploaded_by (full_name, username)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(`Error fetching files for request ${requestId}:`, error);
    throw error;
  }
};

/**
 * Get request comments
 * @param {string} requestId - ID of the request
 * @returns {Promise<Array>} - Array of comments
 */
export const getRequestComments = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        users:user_id (id, full_name, username, role)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error(`Error fetching comments for request ${requestId}:`, error);
    throw error;
  }
};

/**
 * Add a comment to a request
 * @param {string} requestId - ID of the request
 * @param {string} userId - ID of the user adding the comment
 * @param {string} content - Comment content
 * @param {boolean} isInternal - Whether the comment is internal
 * @returns {Promise<Object>} - Created comment data
 */
export const addComment = async (requestId, userId, content, isInternal = false) => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          request_id: requestId,
          user_id: userId,
          content,
          is_internal: isInternal
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error(`Error adding comment to request ${requestId}:`, error);
    throw error;
  }
};

/**
 * Get request statistics
 * @param {Object} options - Options for filtering statistics
 * @returns {Promise<Object>} - Statistics data
 */
export const getRequestStatistics = async (options = {}) => {
  const {
    dateFrom = null,
    dateTo = null,
    organizationId = null,
    userId = null
  } = options;

  try {
    // Start building base query
    let baseQuery = supabase.from('requests').select('*', { count: 'exact' });

    // Apply filters
    if (dateFrom) {
      baseQuery = baseQuery.gte('date_received', dateFrom);
    }

    if (dateTo) {
      baseQuery = baseQuery.lte('date_received', dateTo);
    }

    if (organizationId) {
      baseQuery = baseQuery.eq('sender', organizationId);
    }

    if (userId) {
      baseQuery = baseQuery.or(`created_by.eq.${userId},assigned_to.eq.${userId}`);
    }

    // Get total count
    const { count: totalCount, error: totalError } = await baseQuery;

    if (totalError) throw totalError;

    // Get status counts
    const stats = {
      total: totalCount || 0,
    };

    // Get count for each status
    for (const status of Object.values(REQUEST_STATUS)) {
      const { count, error } = await baseQuery.eq('status', status);

      if (error) throw error;

      stats[status] = count || 0;
    }

    // Calculate completion rate
    stats.completionRate = totalCount > 0
      ? ((stats[REQUEST_STATUS.COMPLETED] / totalCount) * 100).toFixed(1)
      : 0;

    return stats;
  } catch (error) {
    console.error('Error getting request statistics:', error);
    throw error;
  }
};

export default {
  getRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
  getRequestFiles,
  getRequestComments,
  addComment,
  getRequestStatistics
};
