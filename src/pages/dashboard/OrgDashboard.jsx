import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckSquare, 
  ArrowRight,
  FileSearch,
  Download,
  MessageSquare,
  Building
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { format } from 'date-fns';

const OrgDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [orgDetails, setOrgDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgDashboardData();
  }, [user.id]);

  const fetchOrgDashboardData = async () => {
    try {
      setLoading(true);

      // Get user's organization
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('organization')
        .eq('id', user.id)
        .single();
        
      if (userError) throw userError;
      
      // Get organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('name', userData.organization)
        .single();
        
      if (orgError) throw orgError;
      
      setOrgDetails(orgData);
      
      // Fetch organization's requests count
      const { count: totalRequests } = await supabase
        .from('requests')
        .select('*', { count: 'exact' })
        .eq('sender', orgData.id);

      // Fetch pending requests count
      const { count: pendingRequests } = await supabase
        .from('requests')
        .select('*', { count: 'exact' })
        .eq('sender', orgData.id)
        .in('status', ['pending', 'in_progress']);

      // Fetch completed requests count
      const { count: completedRequests } = await supabase
        .from('requests')
        .select('*', { count: 'exact' })
        .eq('sender', orgData.id)
        .eq('status', 'completed');

      // Fetch recent requests
      const { data: recentRequestsData } = await supabase
        .from('requests')
        .select(`
          id,
          reference_number,
          date_received,
          subject,
          status,
          priority,
          created_at,
          completed_at
        `)
        .eq('sender', orgData.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalRequests: totalRequests || 0,
        pendingRequests: pendingRequests || 0,
        completedRequests: completedRequests || 0
      });
      
      setRecentRequests(recentRequestsData || []);
    } catch (error) {
      console.error('Error fetching organization dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {getGreeting()}, {user?.full_name}
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Welcome to Document Request Management System
                  </p>
                </div>
                {orgDetails && (
                  <div className="flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Building className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {orgDetails.name}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mr-4">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalRequests}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mr-4">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Pending Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.pendingRequests}
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 mr-4">
                    <CheckSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Completed Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.completedRequests}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Recent Requests */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Your Recent Requests
                </h2>
                <Link 
                  to="/requests"
                  className="text-sm text-blue-600 dark:text-blue-400 flex items-center hover:underline"
                >
                  View all <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </div>

              {recentRequests.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    No requests found
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your organization doesn't have any requests recorded in the system.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Reference
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Subject
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Priority
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {recentRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link to={`/requests/${request.id}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                              {request.reference_number}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {format(new Date(request.date_received), 'dd MMM yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/requests"
                  className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <FileSearch className="h-6 w-6 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">View All Requests</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">See all your document requests</p>
                  </div>
                </Link>
                <Link
                  to={`/requests?status=completed`}
                  className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Download className="h-6 w-6 text-green-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Download Responses</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Get completed request files</p>
                  </div>
                </Link>
                <Link
                  to="/contact"
                  className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <MessageSquare className="h-6 w-6 text-purple-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Contact Support</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Get help with requests</p>
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Organization Details */}
            {orgDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Organization Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Organization Name
                    </p>
                    <p className="text-base text-gray-900 dark:text-white">
                      {orgDetails.name}
                    </p>
                  </div>
                  {orgDetails.contact_person && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Contact Person
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {orgDetails.contact_person}
                      </p>
                    </div>
                  )}
                  {orgDetails.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Email
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {orgDetails.email}
                      </p>
                    </div>
                  )}
                  {orgDetails.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Phone
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {orgDetails.phone}
                      </p>
                    </div>
                  )}
                  {orgDetails.address && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Address
                      </p>
                      <p className="text-base text-gray-900 dark:text-white">
                        {orgDetails.address}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgDashboard;
