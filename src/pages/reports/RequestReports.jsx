import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Building, 
  Download, 
  Filter, 
  Clock,
  Loader2,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';

const RequestReports = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [sortColumn, setSortColumn] = useState('date_received');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Filters state
  const [filters, setFilters] = useState({
    status: 'all',
    organization: 'all',
    dateRange: {
      start: '', // Format: YYYY-MM-DD
      end: ''
    },
    priority: 'all'
  });

  // Fetch request data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all organizations
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name');
          
        if (orgError) throw orgError;
        setOrganizations(orgData || []);
        
        // Fetch all requests
        const { data: requestData, error: requestError } = await supabase
          .from('requests')
          .select(`
            *,
            organizations:sender (name)
          `)
          .order('date_received', { ascending: false });
          
        if (requestError) throw requestError;
        
        // Process request data
        const processedRequests = requestData.map(request => ({
          ...request,
          sender_name: request.organizations.name
        }));
        
        setRequests(processedRequests);
        setFilteredRequests(processedRequests);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...requests];
    
    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(request => request.status === filters.status);
    }
    
    // Apply organization filter
    if (filters.organization !== 'all') {
      filtered = filtered.filter(request => request.sender === filters.organization);
    }
    
    // Apply priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(request => request.priority === filters.priority);
    }
    
    // Apply date range filter
    if (filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      
      filtered = filtered.filter(request => {
        const requestDate = new Date(request.date_received);
        return requestDate >= startDate && requestDate <= endDate;
      });
    } else if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      
      filtered = filtered.filter(request => {
        const requestDate = new Date(request.date_received);
        return requestDate >= startDate;
      });
    } else if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      
      filtered = filtered.filter(request => {
        const requestDate = new Date(request.date_received);
        return requestDate <= endDate;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let valA, valB;
      
      // Get values based on column
      switch (sortColumn) {
        case 'reference_number':
          valA = a.reference_number;
          valB = b.reference_number;
          break;
        case 'date_received':
          valA = new Date(a.date_received);
          valB = new Date(b.date_received);
          break;
        case 'sender_name':
          valA = a.sender_name;
          valB = b.sender_name;
          break;
        case 'subject':
          valA = a.subject;
          valB = b.subject;
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'priority':
          valA = a.priority;
          valB = b.priority;
          break;
        default:
          valA = a.date_received;
          valB = b.date_received;
      }
      
      // Compare values
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredRequests(filtered);
  }, [requests, filters, sortColumn, sortDirection]);

  // Handle sort toggle
  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    return status?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      // Create worksheet from filtered requests
      const worksheet = XLSX.utils.json_to_sheet(
        filteredRequests.map(request => ({
          'Reference Number': request.reference_number,
          'Date Received': format(parseISO(request.date_received), 'yyyy-MM-dd'),
          'Organization': request.sender_name,
          'Subject': request.subject,
          'Status': formatStatus(request.status),
          'Priority': request.priority.charAt(0).toUpperCase() + request.priority.slice(1),
          'Date Created': format(parseISO(request.created_at), 'yyyy-MM-dd'),
          'Date Completed': request.completed_at ? format(parseISO(request.completed_at), 'yyyy-MM-dd') : '',
          'Turnaround Time (days)': request.completed_at 
            ? Math.round((new Date(request.completed_at) - new Date(request.date_received)) / (1000 * 60 * 60 * 24))
            : '',
          'Is Duplicate': request.is_duplicate ? 'Yes' : 'No'
        }))
      );
      
      // Set column widths
      const wscols = [
        { wch: 15 }, // Reference Number
        { wch: 12 }, // Date Received
        { wch: 25 }, // Organization
        { wch: 40 }, // Subject
        { wch: 12 }, // Status
        { wch: 10 }, // Priority
        { wch: 12 }, // Date Created
        { wch: 12 }, // Date Completed
        { wch: 20 }, // Turnaround Time
        { wch: 10 }  // Is Duplicate
      ];
      worksheet['!cols'] = wscols;
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
      
      // Generate file name with current date
      const fileName = `request_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      // Export to file
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'all',
      organization: 'all',
      dateRange: {
        start: '',
        end: ''
      },
      priority: 'all'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Request Reports
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Generate and export request reports
              </p>
            </div>
            
            <button
              onClick={exportToExcel}
              disabled={loading || filteredRequests.length === 0}
              className="flex items-center px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                       hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </button>
          </div>
          
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Report Filters
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Status filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              {/* Organization filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Organization
                </label>
                <select
                  value={filters.organization}
                  onChange={(e) => setFilters(prev => ({ ...prev, organization: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
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
              
              {/* Priority filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
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
              
              {/* Date Range Start */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range (Start)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>
              
              {/* Reset Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg
                           hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </motion.div>
          
          {/* Request Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
          >
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500 dark:text-gray-400">Loading requests...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  No requests found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  No requests match your current filter criteria. Try changing your filters or reset them.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg
                           hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('reference_number')}
                        >
                          <div className="flex items-center">
                            Reference
                            {sortColumn === 'reference_number' && (
                              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('date_received')}
                        >
                          <div className="flex items-center">
                            Date
                            {sortColumn === 'date_received' && (
                              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('sender_name')}
                        >
                          <div className="flex items-center">
                            Organization
                            {sortColumn === 'sender_name' && (
                              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('subject')}
                        >
                          <div className="flex items-center">
                            Subject
                            {sortColumn === 'subject' && (
                              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center">
                            Status
                            {sortColumn === 'status' && (
                              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('priority')}
                        >
                          <div className="flex items-center">
                            Priority
                            {sortColumn === 'priority' && (
                              sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Completion Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredRequests.map((request) => {
                        // Calculate turnaround time (in days) for completed requests
                        const turnaroundDays = request.completed_at ? 
                          Math.round((new Date(request.completed_at) - new Date(request.date_received)) / (1000 * 60 * 60 * 24)) : 
                          null;
                          
                        return (
                          <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {request.reference_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(request.date_received), 'yyyy-MM-dd')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {request.sender_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="truncate max-w-xs">
                                {request.subject}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                                {formatStatus(request.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                                {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {turnaroundDays !== null ? (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{turnaroundDays} {turnaroundDays === 1 ? 'day' : 'days'}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">Pending</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{filteredRequests.length}</span> requests
                    </p>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Click on column headers to sort
                    </p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
          
          {/* Report Summary */}
          {!loading && filteredRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Report Summary
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Requests */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total Requests
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {filteredRequests.length}
                  </p>
                </div>
                
                {/* Completion Rate */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Completion Rate
                    </h3>
                  </div>
                  
                  {(() => {
                    const completedCount = filteredRequests.filter(req => req.status === 'completed').length;
                    const completionRate = (completedCount / filteredRequests.length) * 100;
                    
                    return (
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {completionRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {completedCount} of {filteredRequests.length} requests
                        </p>
                      </div>
                    );
                  })()}
                </div>
                
                {/* Average Completion Time */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Average Completion Time
                    </h3>
                  </div>
                  
                  {(() => {
                    const completedRequests = filteredRequests.filter(req => req.status === 'completed' && req.completed_at);
                    
                    if (completedRequests.length === 0) {
                      return (
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          N/A
                        </p>
                      );
                    }
                    
                    const totalDays = completedRequests.reduce((sum, req) => {
                      const days = Math.round((new Date(req.completed_at) - new Date(req.date_received)) / (1000 * 60 * 60 * 24));
                      return sum + days;
                    }, 0);
                    
                    const avgDays = totalDays / completedRequests.length;
                    
                    return (
                      <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {avgDays.toFixed(1)} days
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Based on {completedRequests.length} completed requests
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestReports;
