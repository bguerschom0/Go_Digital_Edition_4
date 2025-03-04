import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './useAuth';
import { REQUEST_STATUS } from '../config/constants';

/**
 * Custom hook to manage requests data and operations
 * @param {Object} options - Hook options
 * @param {boolean} options.subscribeToChanges - Whether to subscribe to real-time changes
 * @param {Array<string>} options.statuses - Filter requests by these statuses
 * @param {string} options.organizationId - Filter requests by organization ID
 * @param {boolean} options.onlyAssigned - Filter to only show requests assigned to current user
 * @returns {Object} Request operations and state
 */
const useRequests = ({
  subscribeToChanges = true,
  statuses = [],
  organizationId = null,
  onlyAssigned = false,
  limit = null
} = {}) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch requests data
  const fetchRequests = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Start building the query
      let query = supabase
        .from('requests')
        .select(`
          *,
          organizations:sender (name),
          created_by_user:created_by (full_name, username),
          assigned_to_user:assigned_to (full_name, username),
          files:request_files (id),
          comments (id)
        `, { count: 'exact' });
      
      // Apply status filter
      if (statuses && statuses.length > 0) {
        query = query.in('status', statuses);
      }
      
      // Apply organization filter
      if (organizationId) {
        query = query.eq('sender', organizationId);
      }
      
      // Apply assigned to filter
      if (onlyAssigned && user) {
        query = query.eq('assigned_to', user.id);
      }
      
      // Apply role-based filters
      if (user.role === 'organization') {
        // Organization users can only see their organization's requests
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', user.organization)
          .single();
          
        if (orgError) throw orgError;
        
        query = query.eq('sender', orgData.id);
      }
      
      // Apply limit if provided
      if (limit) {
        query = query.limit(limit);
      }
      
      // Sort by date received descending
      query = query.order('date_received', { ascending: false });
      
      // Execute the query
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Process request data
      const processedRequests = data.map(request => ({
        ...request,
        sender_name: request.organizations?.name,
        files_count: request.files?.length || 0,
        comments_count: request.comments?.length || 0
      }));
      
      setRequests(processedRequests);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to fetch requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, statuses, organizationId, onlyAssigned, limit]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!user || !subscribeToChanges) return;
    
    fetchRequests();
    
    // Set up real-time subscription
    const requestSubscription = supabase
      .channel('public:requests')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'requests'
      }, () => {
        // Refetch requests when changes occur
        fetchRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestSubscription);
    };
  }, [user, fetchRequests, subscribeToChanges]);

  // Get a single request by ID
  const getRequestById = async (requestId) => {
    if (!requestId) return null;
    
    try {
      setLoading(true);
      setError(null);
      
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
    } catch (err) {
      console.error(`Error fetching request ${requestId}:`, err);
      setError(`Failed to fetch request details. ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new request
  const createRequest = async (requestData) => {
    if (!user) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('requests')
        .insert([{
          ...requestData,
          created_by: user.id,
          status: REQUEST_STATUS.PENDING
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Refresh the requests list
      fetchRequests();
      
      return data;
    } catch (err) {
      console.error('Error creating request:', err);
      setError('Failed to create request. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing request
  const updateRequest = async (requestId, updateData) => {
    if (!user || !requestId) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('requests')
        .update({
          ...updateData,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Refresh the requests list
      fetchRequests();
      
      return true;
    } catch (err) {
      console.error(`Error updating request ${requestId}:`, err);
      setError('Failed to update request. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Mark a request as completed
  const completeRequest = async (requestId) => {
    if (!user || !requestId) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase
        .from('requests')
        .update({
          status: REQUEST_STATUS.COMPLETED,
          completed_at: new Date().toISOString(),
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      if (error) throw error;
      
      // Refresh the requests list
      fetchRequests();
      
      return true;
    } catch (err) {
      console.error(`Error completing request ${requestId}:`, err);
      setError('Failed to mark request as completed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get request status counts
  const getStatusCounts = async () => {
    if (!user) return {};
    
    try {
      // Need to run separate queries for each status to get accurate counts
      const counts = {};
      
      // Build base query depending on user role
      let baseQuery = supabase.from('requests').select('id', { count: 'exact' });
      
      if (user.role === 'organization') {
        // Organization users can only see their organization's requests
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', user.organization)
          .single();
          
        if (orgError) throw orgError;
        
        baseQuery = baseQuery.eq('sender', orgData.id);
      }
      
      // If onlyAssigned is true, filter to only assigned requests
      if (onlyAssigned) {
        baseQuery = baseQuery.eq('assigned_to', user.id);
      }
      
      // Get total count
      const { count: totalCount, error: totalError } = await baseQuery;
      
      if (totalError) throw totalError;
      
      counts.total = totalCount || 0;
      
      // Get count for each status
      for (const status of Object.values(REQUEST_STATUS)) {
        const { count, error } = await baseQuery.eq('status', status);
        
        if (error) throw error;
        
        counts[status] = count || 0;
      }
      
      return counts;
    } catch (err) {
      console.error('Error getting status counts:', err);
      return {
        total: 0,
        [REQUEST_STATUS.PENDING]: 0,
        [REQUEST_STATUS.IN_PROGRESS]: 0,
        [REQUEST_STATUS.COMPLETED]: 0
      };
    }
  };

  return {
    requests,
    loading,
    error,
    totalCount,
    fetchRequests,
    getRequestById,
    createRequest,
    updateRequest,
    completeRequest,
    getStatusCounts
  };
};

export default useRequests;
