import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Filter, 
  ChevronDown, 
  X, 
  Calendar, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import RequestCard from '../../components/requests/RequestCard';
import useRoleCheck from '../../hooks/useRoleCheck';
import { getRequests } from '../../services/requestService';

const RequestList = () => {
  const { user } = useAuth();
  const { canProcessRequests, isRestrictedToOrganization } = useRoleCheck();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    organization: 'all',
    dateRange: {
      start: null,
      end: null
    },
    priority: 'all'
  });

  // Initial data fetch
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        
        // Use the requestService function instead of direct Supabase calls
        const filters = {};
        
        // Add organization filters if user is restricted
        if (isRestrictedToOrganization() && userOrganizations.length > 0) {
          filters.organizationId = userOrganizations.map(org => org.id);
        }
        
        // Get requests using the service
        const data = await getRequests(filters);
        
        if (isMounted) {
          setRequests(data || []);
          setFilteredRequests(data || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
        if (isMounted) {
          setFetchError('Failed to load requests. Please try again.');
          setLoading(false);
        }
      }
    };
    
    if (isRestrictedToOrganization()) {
      // Wait for user organizations to be loaded first
      if (userOrganizations.length > 0) {
        loadInitialData();
      }
    } else {
      loadInitialData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [isRestrictedToOrganization, userOrganizations]);
  
  // Fetch user's organizations if they're an organization user
  useEffect(() => {
    const fetchUserOrganizations = async () => {
      if (!isRestrictedToOrganization() || !user) return;
      
      try {
        // We're keeping this direct Supabase call since it's a one-time operation
        const { supabase } = await import('../../config/supabase');
        const { data, error } = await supabase
          .from('v4_user_organizations')
          .select(`
            organization_id,
            v4_organizations (id, name)
          `)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setUserOrganizations(data.map(item => ({
            id: item.organization_id,
            name: item.v4_organizations.name
          })));
        }
      } catch (error) {
        console.error('Error fetching user organizations:', error);
      }
    };
    
    fetchUserOrganizations();
  }, [user, isRestrictedToOrganization]);
  
  // Fetch organizations for filters
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { supabase } = await import('../../config/supabase');
        const { data, error } = await supabase
          .from('v4_organizations')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };
    
    fetchOrganizations();
  }, []);

  // Manual refresh function
  const refreshData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      // Use the requestService function instead of direct Supabase calls
      const filterParams = {};
      
      // Add organization filters if user is restricted
      if (isRestrictedToOrganization() && userOrganizations.length > 0) {
        filterParams.organizationId = userOrganizations.map(org => org.id);
      }
      
      // Get requests using the service
      const data = await getRequests(filterParams);
      
      setRequests(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing requests:', error);
      setFetchError('Failed to refresh requests. Please try again.');
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...requests];
    
    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(request => request.status === filters.status);
    }
    
    // Apply organization filter
    if (filters.organization !== 'all') {
      result = result.filter(request => request.sender === filters.organization);
    }
    
    // Apply date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      end.setHours(23, 59, 59, 999); // End of day
      
      result = result.filter(request => {
        const date = new Date(request.date_received);
        return date >= start && date <= end;
      });
    }
    
    // Apply priority filter
    if (filters.priority !== 'all') {
      result = result.filter(request => request.priority === filters.priority);
    }
    
    // Apply search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(request => 
        request.reference_number.toLowerCase().includes(lowerSearchTerm) ||
        request.subject.toLowerCase().includes(lowerSearchTerm) ||
        request.sender_name.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    setFilteredRequests(result);
  }, [requests, filters, searchTerm]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      organization: 'all',
      dateRange: {
        start: null,
        end: null
      },
      priority: 'all'
    });
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Document Requests
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage and track document requests
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* Refresh button */}
            <button
              onClick={refreshData}
              disabled={loading}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              Refresh
            </button>
            
            {/* Only show "New Request" button for admin and user roles */}
            {canProcessRequests() && (
              <button
                onClick={() => navigate('/requests/new')}
                className="flex items-center px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                         hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </button>
            )}
          </div>
        </div>
        
        {/* Error message */}
        {fetchError && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 p-4 rounded-lg mb-6">
            <p className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {fetchError}
            </p>
          </div>
        )}
        
        {/* Search and filter bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search input */}
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference, subject, or sender..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
            
            {/* Filter button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700
                       rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700
                       transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          {/* Expanded filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                {/* Organization filter - if not restricted to specific orgs */}
                {!isRestrictedToOrganization() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organization
                    </label>
                    <select
                      value={filters.organization}
                      onChange={(e) => setFilters({ ...filters, organization: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      <option value="all">All Organizations</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Organization filter - if restricted to specific orgs */}
                {isRestrictedToOrganization() && userOrganizations.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Organizations
                    </label>
                    <select
                      value={filters.organization}
                      onChange={(e) => setFilters({ ...filters, organization: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    >
                      <option value="all">All Your Organizations</option>
                      {userOrganizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Date range filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Range (Start)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={filters.dateRange.start || ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        dateRange: { ...filters.dateRange, start: e.target.value }
                      })}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Range (End)
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      value={filters.dateRange.end || ''}
                      onChange={(e) => setFilters({
                        ...filters,
                        dateRange: { ...filters.dateRange, end: e.target.value }
                      })}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
                
                {/* Priority filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              {/* Clear filters button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700
                           text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200
                           dark:hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filters
                </button>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Requests grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <div className="flex flex-col items-center">
              <Filter className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No requests found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {searchTerm || filters.status !== 'all' || filters.organization !== 'all' || 
                 filters.dateRange.start || filters.dateRange.end || filters.priority !== 'all' ? (
                  'No requests match your current filters. Try adjusting your search criteria.'
                 ) : (
                  'No document requests have been recorded yet.'
                 )}
              </p>
              {(searchTerm || filters.status !== 'all' || filters.organization !== 'all' || 
                filters.dateRange.start || filters.dateRange.end || filters.priority !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                           rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onClick={() => navigate(`/requests/${request.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestList;
