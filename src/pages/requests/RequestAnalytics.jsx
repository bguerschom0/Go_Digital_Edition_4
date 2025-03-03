import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  Calendar, 
  Download, 
  Filter,
  Loader2
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import * as XLSX from 'xlsx';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
const STATUS_COLORS = {
  pending: '#FFBB28',
  in_progress: '#0088FE',
  completed: '#00C49F'
};

const RequestAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  
  // Analytics data
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [organizationDistribution, setOrganizationDistribution] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [avgResponseTime, setAvgResponseTime] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    dateRange: {
      start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    organization: 'all'
  });

  // Fetch request data
  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        setLoading(true);
        
        // Fetch requests
        let query = supabase
          .from('requests')
          .select(`
            *,
            organizations:sender (name)
          `);
        
        // Apply date filter
        if (filters.dateRange.start && filters.dateRange.end) {
          query = query
            .gte('date_received', filters.dateRange.start)
            .lte('date_received', filters.dateRange.end);
        }
        
        // Apply organization filter
        if (filters.organization !== 'all') {
          query = query.eq('sender', filters.organization);
        }
        
        // Execute query
        const { data, error } = await query;
        
        if (error) throw error;
        
        // Process request data
        const processedRequests = data.map(request => ({
          ...request,
          sender_name: request.organizations.name
        }));
        
        setRequests(processedRequests);
        
        // Process analytics data
        processAnalyticsData(processedRequests);
      } catch (error) {
        console.error('Error fetching request data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch organizations for filters
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };
    
    fetchRequestData();
    fetchOrganizations();
  }, [filters]);

  // Process data for analytics charts
  const processAnalyticsData = (requestData) => {
    // Status distribution
    const statusCounts = requestData.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {});
    
    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: formatStatus(status),
      value: count,
      color: STATUS_COLORS[status] || '#8884D8'
    }));
    
    setStatusDistribution(statusData);
    
    // Organization distribution
    const orgCounts = requestData.reduce((acc, request) => {
      const orgName = request.sender_name;
      acc[orgName] = (acc[orgName] || 0) + 1;
      return acc;
    }, {});
    
    // Get top 5 organizations by count
    const sortedOrgs = Object.entries(orgCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
      
    // Add "Others" category if there are more than 5 organizations
    if (Object.keys(orgCounts).length > 5) {
      const othersCount = Object.entries(orgCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(5)
        .reduce((sum, [_, count]) => sum + count, 0);
        
      sortedOrgs.push(['Others', othersCount]);
    }
    
    const orgData = sortedOrgs.map(([name, count], index) => ({
      name,
      value: count,
      color: COLORS[index % COLORS.length]
    }));
    
    setOrganizationDistribution(orgData);
    
    // Monthly trends
    const dateStart = filters.dateRange.start 
      ? parseISO(filters.dateRange.start)
      : subMonths(new Date(), 6);
      
    const dateEnd = filters.dateRange.end
      ? parseISO(filters.dateRange.end)
      : new Date();
    
    // Generate array of all months in range
    const months = eachMonthOfInterval({
      start: startOfMonth(dateStart),
      end: endOfMonth(dateEnd)
    });
    
    // Count requests by month and status
    const monthlyData = months.map(month => {
      const monthStr = format(month, 'yyyy-MM');
      
      // Filter requests for this month
      const monthRequests = requestData.filter(request => {
        const requestDate = parseISO(request.date_received);
        return format(requestDate, 'yyyy-MM') === monthStr;
      });
      
      // Count by status
      const pending = monthRequests.filter(r => r.status === 'pending').length;
      const inProgress = monthRequests.filter(r => r.status === 'in_progress').length;
      const completed = monthRequests.filter(r => r.status === 'completed').length;
      
      return {
        month: format(month, 'MMM yyyy'),
        pending,
        in_progress: inProgress,
        completed,
        total: monthRequests.length
      };
    });
    
    setMonthlyTrends(monthlyData);
    
    // Calculate average response time for completed requests
    const completedRequests = requestData.filter(
      r => r.status === 'completed' && r.completed_at
    );
    
    if (completedRequests.length > 0) {
      const totalDays = completedRequests.reduce((sum, request) => {
        const receivedDate = parseISO(request.date_received);
        const completedDate = parseISO(request.completed_at);
        const daysDiff = Math.round((completedDate - receivedDate) / (1000 * 60 * 60 * 24));
        return sum + daysDiff;
      }, 0);
      
      setAvgResponseTime(Math.round(totalDays / completedRequests.length));
    } else {
      setAvgResponseTime(null);
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Export analytics data to Excel
  const exportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Status distribution sheet
      const statusSheet = XLSX.utils.json_to_sheet(statusDistribution.map(item => ({
        Status: item.name,
        Count: item.value,
        Percentage: `${((item.value / requests.length) * 100).toFixed(1)}%`
      })));
      XLSX.utils.book_append_sheet(wb, statusSheet, 'Status Distribution');
      
      // Organization distribution sheet
      const orgSheet = XLSX.utils.json_to_sheet(organizationDistribution.map(item => ({
        Organization: item.name,
        Count: item.value,
        Percentage: `${((item.value / requests.length) * 100).toFixed(1)}%`
      })));
      XLSX.utils.book_append_sheet(wb, orgSheet, 'Organization Distribution');
      
      // Monthly trends sheet
      const trendsSheet = XLSX.utils.json_to_sheet(monthlyTrends.map(item => ({
        Month: item.month,
        'Total Requests': item.total,
        Pending: item.pending,
        'In Progress': item.in_progress,
        Completed: item.completed
      })));
      XLSX.utils.book_append_sheet(wb, trendsSheet, 'Monthly Trends');
      
      // Request list sheet
      const requestListSheet = XLSX.utils.json_to_sheet(requests.map(request => ({
        'Reference Number': request.reference_number,
        'Date Received': format(parseISO(request.date_received), 'yyyy-MM-dd'),
        'Organization': request.sender_name,
        'Subject': request.subject,
        'Status': formatStatus(request.status),
        'Priority': request.priority.charAt(0).toUpperCase() + request.priority.slice(1),
        'Completed Date': request.completed_at ? format(parseISO(request.completed_at), 'yyyy-MM-dd') : 'N/A',
        'Is Duplicate': request.is_duplicate ? 'Yes' : 'No'
      })));
      XLSX.utils.book_append_sheet(wb, requestListSheet, 'Request List');
      
      // Write file and download
      XLSX.writeFile(wb, `request_analytics_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Format number with comma separators
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Request Analytics
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Insights and statistics about document requests
            </p>
          </div>
          
          <button
            onClick={exportToExcel}
            disabled={loading || requests.length === 0}
            className="flex items-center px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                     hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
        
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date range start */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Range (Start)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', { 
                    ...filters.dateRange, 
                    start: e.target.value 
                  })}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>
            
            {/* Date range end */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Range (End)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', { 
                    ...filters.dateRange, 
                    end: e.target.value 
                  })}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>
            
            {/* Organization filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization
              </label>
              <select
                value={filters.organization}
                onChange={(e) => handleFilterChange('organization', e.target.value)}
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
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <BarChartIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No data available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              There are no requests matching your current filters. Try adjusting your date range or organization filters.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total requests */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatNumber(requests.length)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    For period {format(parseISO(filters.dateRange.start), 'MMM d, yyyy')} - {format(parseISO(filters.dateRange.end), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              
              {/* Completed requests */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Completed Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatNumber(requests.filter(r => r.status === 'completed').length)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {((requests.filter(r => r.status === 'completed').length / requests.length) * 100).toFixed(1)}% completion rate
                  </span>
                </div>
              </div>
              
              {/* Pending requests */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Pending Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {formatNumber(requests.filter(r => r.status === 'pending').length)}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {((requests.filter(r => r.status === 'pending').length / requests.length) * 100).toFixed(1)}% of total requests
                  </span>
                </div>
              </div>
              
              {/* Average response time */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Average Response Time
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {avgResponseTime !== null ? `${avgResponseTime} days` : 'N/A'}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Timer className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Based on {requests.filter(r => r.status === 'completed' && r.completed_at).length} completed requests
                  </span>
                </div>
              </div>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Request Status Distribution
                  </h2>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 flex justify-center gap-4">
                  {statusDistribution.map((entry, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="h-3 w-3 rounded-full mr-1" 
                        style={{ backgroundColor: entry.color }} 
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {entry.name}: {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Organization distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChartIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Requests by Organization
                  </h2>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={organizationDistribution}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="value" 
                        name="Requests" 
                        background={{ fill: '#eee' }}
                      >
                        {organizationDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Monthly trends */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Monthly Request Trends
                  </h2>
                </div>
                
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyTrends}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        name="Total"
                        stroke="#8884d8" 
                        strokeWidth={2}
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pending" 
                        name="Pending"
                        stroke={STATUS_COLORS.pending} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="in_progress" 
                        name="In Progress"
                        stroke={STATUS_COLORS.in_progress} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        name="Completed"
                        stroke={STATUS_COLORS.completed} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Missing imports from the auto-completion
import { ClipboardList, CheckSquare, Activity, Timer } from 'lucide-react';

export default RequestAnalytics;
