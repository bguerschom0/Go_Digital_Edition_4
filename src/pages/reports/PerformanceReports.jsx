import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  Filter, 
  Loader2,
  Users,
  Calendar,
  Clock,
  BarChart as BarChartIcon
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';
import { format, parseISO, subMonths } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

const PerformanceReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState([]);
  const [processorData, setProcessorData] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  
  // Filters state
  const [filters, setFilters] = useState({
    dateRange: {
      start: format(subMonths(new Date(), 3), 'yyyy-MM-dd'), // Default to 3 months
      end: format(new Date(), 'yyyy-MM-dd')
    },
    processor: 'all'
  });
  
  useEffect(() => {
    fetchPerformanceData();
  }, [filters]);
  
  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Get all processors
      const { data: processors, error: processorError } = await supabase
        .from('users')
        .select('id, full_name, username')
        .in('role', ['admin', 'processor']);
        
      if (processorError) throw processorError;
      
      // Get requests within date range
      let requestQuery = supabase
        .from('requests')
        .select(`
          *,
          assigned_to_user:assigned_to (id, full_name, username)
        `);
        
      if (filters.dateRange.start && filters.dateRange.end) {
        requestQuery = requestQuery
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }
      
      if (filters.processor !== 'all') {
        requestQuery = requestQuery.eq('assigned_to', filters.processor);
      }
      
      const { data: requests, error: requestError } = await requestQuery;
      
      if (requestError) throw requestError;
      
      // Process processor performance metrics
      const userPerformance = {};
      
      processors.forEach(processor => {
        userPerformance[processor.id] = {
          id: processor.id,
          name: processor.full_name,
          username: processor.username,
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          avgResponseTime: 0,
          totalResponseTime: 0
        };
      });
      
      // Process request data
      requests.forEach(request => {
        if (!request.assigned_to) return;
        
        const processorId = request.assigned_to;
        
        if (!userPerformance[processorId]) return;
        
        // Increment total count
        userPerformance[processorId].total += 1;
        
        // Increment status counters
        if (request.status === 'completed') {
          userPerformance[processorId].completed += 1;
          
          // Calculate response time for completed requests
          if (request.completed_at) {
            const createdDate = new Date(request.created_at);
            const completedDate = new Date(request.completed_at);
            const responseTime = Math.round((completedDate - createdDate) / (1000 * 60 * 60 * 24)); // in days
            
            userPerformance[processorId].totalResponseTime += responseTime;
          }
        } else if (request.status === 'in_progress') {
          userPerformance[processorId].inProgress += 1;
        } else if (request.status === 'pending') {
          userPerformance[processorId].pending += 1;
        }
      });
      
      // Calculate average response time
      Object.values(userPerformance).forEach(user => {
        if (user.completed > 0) {
          user.avgResponseTime = Math.round(user.totalResponseTime / user.completed * 10) / 10; // Round to 1 decimal
        }
      });
      
      // Convert to array and sort by total
      const userDataArray = Object.values(userPerformance)
        .filter(user => user.total > 0) // Only include users with requests
        .sort((a, b) => b.total - a.total);
      
      setUserData(userDataArray);
      
      // Create processor chart data
      const topProcessors = userDataArray
        .slice(0, 5) // Get top 5 by total
        .map(user => ({
          name: user.name,
          total: user.total,
          completed: user.completed,
          completion_rate: user.completed > 0 ? Math.round((user.completed / user.total) * 100) : 0
        }));
        
      setProcessorData(topProcessors);
      
      // Create timeline data - Completed requests per week
      // Group requests by week
      const weeklyData = {};
      
      requests.forEach(request => {
        if (request.status !== 'completed' || !request.completed_at) return;
        
        const weekEnd = new Date(request.completed_at);
        const weekKey = format(weekEnd, 'yyyy-MM-dd'); // Use date as key
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = {
            week: format(weekEnd, 'MMM dd'),
            count: 0,
            avgTime: 0,
            totalTime: 0
          };
        }
        
        weeklyData[weekKey].count += 1;
        
        // Calculate response time
        const createdDate = new Date(request.created_at);
        const completedDate = new Date(request.completed_at);
        const responseTime = Math.round((completedDate - createdDate) / (1000 * 60 * 60 * 24)); // in days
        
        weeklyData[weekKey].totalTime += responseTime;
      });
      
      // Calculate average response time per week
      Object.values(weeklyData).forEach(week => {
        if (week.count > 0) {
          week.avgTime = Math.round(week.totalTime / week.count * 10) / 10; // Round to 1 decimal
        }
      });
      
      // Convert to array, sort by date, and get last 8 weeks
      const timelineDataArray = Object.entries(weeklyData)
        .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
        .map(([_, data]) => data)
        .slice(-8); // Get last 8 weeks
        
      setTimelineData(timelineDataArray);
      
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Export to Excel
  const exportToExcel = () => {
    try {
      // Create worksheet for user performance
      const userWorksheet = XLSX.utils.json_to_sheet(
        userData.map(user => ({
          'Processor': user.name,
          'Username': user.username,
          'Total Requests': user.total,
          'Completed': user.completed,
          'In Progress': user.inProgress,
          'Pending': user.pending,
          'Completion Rate (%)': user.total > 0 ? Math.round((user.completed / user.total) * 100) : 0,
          'Avg. Response Time (days)': user.avgResponseTime || 'N/A'
        }))
      );
      
      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, userWorksheet, 'Processor Performance');
      
      // Generate file name with current date
      const fileName = `performance_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      // Export to file
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
              {entry.name}: {entry.value}
              {entry.name === 'Completion Rate' ? '%' : ''}
              {entry.name === 'Avg. Response Time' ? ' days' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Performance Reports
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Analyze processor performance and response times
              </p>
            </div>
            
            <button
              onClick={exportToExcel}
              disabled={loading || userData.length === 0}
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              
              {/* Date Range End */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Range (End)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>
              
              {/* Processor filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Processor
                </label>
                <select
                  value={filters.processor}
                  onChange={(e) => setFilters(prev => ({ ...prev, processor: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="all">All Processors</option>
                  {userData.map((processor) => (
                    <option key={processor.id} value={processor.id}>
                      {processor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500 dark:text-gray-400">Loading performance data...</span>
            </div>
          ) : (
            <>
              {/* Performance Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Processors */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Active Processors
                    </h3>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                    {userData.length}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Processors who handled requests
                  </p>
                </motion.div>
                
                {/* Average Completion Rate */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Avg. Completion Rate
                    </h3>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <BarChartIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                    {(() => {
                      const totalRequests = userData.reduce((sum, user) => sum + user.total, 0);
                      const totalCompleted = userData.reduce((sum, user) => sum + user.completed, 0);
                      return totalRequests > 0 ? `${Math.round((totalCompleted / totalRequests) * 100)}%` : 'N/A';
                    })()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Average across all processors
                  </p>
                </motion.div>
                
                {/* Average Response Time */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Avg. Response Time
                    </h3>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                    {(() => {
                      const totalTime = userData.reduce((sum, user) => sum + (user.avgResponseTime * user.completed || 0), 0);
                      const totalCompleted = userData.reduce((sum, user) => sum + user.completed, 0);
                      return totalCompleted > 0 ? `${(totalTime / totalCompleted).toFixed(1)} days` : 'N/A';
                    })()}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Average time to complete requests
                  </p>
                </motion.div>
              </div>
              
              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Processor Performance Chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Top Processor Performance
                  </h3>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={processorData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="total" name="Total Requests" fill="#8884d8" />
                        <Bar dataKey="completed" name="Completed" fill="#82ca9d" />
                        <Bar dataKey="completion_rate" name="Completion Rate" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
                
                {/* Response Time Trend */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Response Time Trend
                  </h3>
                  
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={timelineData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="count"
                          name="Completed Requests"
                          stroke="#8884d8"
                          activeDot={{ r: 8 }}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="avgTime"
                          name="Avg. Response Time"
                          stroke="#82ca9d"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
              
              {/* Processor Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Processor Performance Details
                  </h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Processor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Total Requests
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Completed
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          In Progress
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Pending
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Completion Rate
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Avg. Response Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {userData.map((processor) => (
                        <tr key={processor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {processor.name}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {processor.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {processor.total}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {processor.completed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {processor.inProgress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {processor.pending}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div 
                                  className="bg-green-600 h-2.5 rounded-full" 
                                  style={{ width: `${processor.total > 0 ? (processor.completed / processor.total) * 100 : 0}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                {processor.total > 0 ? Math.round((processor.completed / processor.total) * 100) : 0}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {processor.avgResponseTime > 0 ? `${processor.avgResponseTime} days` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceReports;
