import { useState } from 'react';
import { 
  createRequest, 
  getRequestById, 
  updateRequest,
  completeRequest,
  getRequests,
  deleteRequest,
  assignRequest
} from '../services/requestService';
import { useAuth } from './useAuth';

const useRequest = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create a new request
  const createNewRequest = async (requestData) => {
    setLoading(true);
    setError(null);
    try {
      const completeData = {
        ...requestData,
        created_by: user.id,
        status: 'pending'
      };
      const result = await createRequest(completeData);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to create request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get request by ID
  const fetchRequest = async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRequestById(requestId);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to fetch request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update request
  const updateRequestDetails = async (requestId, updateData) => {
    setLoading(true);
    setError(null);
    try {
      const fullUpdateData = {
        ...updateData,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      };
      const result = await updateRequest(requestId, fullUpdateData);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to update request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Mark request as complete
  const markRequestComplete = async (requestId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await completeRequest(requestId, user.id);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to complete request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch requests with filters
  const fetchRequests = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      // For organization users, add their organization to filters
      if (user.role === 'organization') {
        // We need to fetch the user's organization first
        const { data: userData } = await supabase
          .from('v4_user_organizations')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .single();
        
        if (userData) {
          filters.organizationId = userData.organization_id;
        }
      }
      
      const result = await getRequests(filters);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to fetch requests');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Assign request to user
  const assignRequestToUser = async (requestId, assignToUserId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await assignRequest(requestId, assignToUserId, user.id);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to assign request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createNewRequest,
    fetchRequest,
    updateRequestDetails,
    markRequestComplete,
    fetchRequests,
    assignRequestToUser
  };
};

export default useRequest;
