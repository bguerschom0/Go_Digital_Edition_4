import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  Calendar, 
  Download, 
  Filter,
  Loader2,
  ArrowDown,
  ArrowUp
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
import ReportFilters from '../../components/reports/ReportFilters';

// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
const STATUS_COLORS = {
  pending: '#FFBB28',
  in_progress: '#0088FE',
  completed: '#00C49F'
};

const RequestReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  
  // Report data
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [organizationDistribution, setOrganizationDistribution] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [avgResponseTime, setAvgResponseTime] = useState(null);
  const [totalRequests, setTotalRequests] = useState(0);
  const [completedRequests, setCompletedRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState({
    dateRange: {
      start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    organization: 'all'
  });

  // For sorting 
  const [sortConfig, setSortConfig] = useState({
    key: 'count',
    direction: 'desc'
  });

  // Fetch organizations for filter dropdown
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
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

  // Fetch report data based on filters
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        
        // 1. Status Distribution Query
        let statusQuery = supabase
          .from('v4_requests')
          .select('status, count(*)', { count: 'exact' })
          .gte('date_received', filters.dateRange.start)
          .lte('date_received', filters.dateRange.end)
          .groupBy('status');
          
        // Apply organization filter if not 'all'
        if (filters.organization !== 'all') {
          statusQuery = statusQuery.eq('sender', filters.organization);
        }
        
        const { data: statusResults, error: statusError } = await statusQuery;
        if (statusError) throw statusError;
        
        // Format status data for chart
        const formattedStatusData = statusResults.map(item => ({
          name: formatStatus(item.status),
          value: parseInt(item.count),
          color: STATUS_COLORS[item.status] || '#8884D8'
        }));
        
        setStatusDistribution(formattedStatusData);
        
        // Calculate totals
        const totalCount = formattedStatusData.reduce((sum, item) => sum + item.value, 0);
        setTotalRequests(totalCount);
        
        const completedCount = formattedStatusData.find(item => item.name === 'Completed')?.value || 0;
        setCompletedRequests(completedCount);
        
        const pendingCount = formattedStatusData.find(item => item.name === 'Pending')?.value || 0;
        setPendingRequests(pendingCount);
        
        // 2. Organization Distribution Query
        let orgQuery = supabase
          .from('v4_requests')
          .select(`
            sender,
            organizations:sender (name),
            count(*)
          `)
          .gte('date_received', filters.dateRange.start)
          .lte('date_received', filters.dateRange.end)
          .groupBy('sender, organizations(name)');
          
        const { data: orgResults, error: orgError } = await orgQuery;
        if (orgError) throw orgError;
        
        // Format organization data
        const formattedOrgData = orgResults.map((item, index) => ({
          name: item.organizations.name,
          value: parseInt(item.count),
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => {
          if (sortConfig.key === 'name') {
            return sortConfig.direction === 'asc' 
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          } else {
            return sortConfig.direction === 'asc' 
              ? a.value - b.value
              : b.value - a.value;
          }
        });
        
        setOrganizationDistribution(formattedOrgData);
        
        // 3. Monthly Trends
        const dateStart = parseISO(filters.dateRange.start);
        const dateEnd = parseISO(filters.dateRange.end);
        
        // Generate array of all months in range
        const months = eachMonthOfInterval({
          start: startOfMonth(dateStart),
          end: endOfMonth(dateEnd)
        });
        
        // Initialize monthly data with all months
        const initialMonthlyData = months.map(month => {
          const monthStr = format(month, 'yyyy-MM');
          return {
            month: format(month, 'MMM yyyy'),
            monthKey: monthStr,
            pending: 0,
            in_progress: 0,
            completed: 0,
            total: 0
          };
        });
        
        // Get monthly request data
        let monthlyQuery = supabase
          .from('v4_requests')
          .select('date_received, status')
          .gte('date_received', filters.dateRange.start)
          .lte('date_received', filters.dateRange.end);
          
        if (filters.organization !== 'all') {
          monthlyQuery = monthlyQuery.eq('sender', filters.organization);
        }
        
        const { data: monthlyResults, error: monthlyError } = await monthlyQuery;
        if (monthlyError) throw monthlyError;
        
        // Process monthly data
        const monthlyData = initialMonthlyData.map(monthData => {
          const monthRequests = monthlyResults.filter(request => {
            const requestMonth = format(parseISO(request.date_received), 'yyyy-MM');
            return requestMonth === monthData.monthKey;
          });
          
          return {
            ...monthData,
            pending: monthRequests.filter(r => r.status === 'pending').length,
            in_progress: monthRequests.filter(r => r.status === 'in_progress').length,
            completed: monthRequests.filter(r => r.status === 'completed').length,
            total: monthRequests.length
          };
        });
        
        setMonthlyTrends(monthlyData);
        
        // 4. Average Response Time
        let responseTimeQuery = supabase
          .from('v4_requests')
          .select('date_received, completed_at')
          .eq('status', 'completed')
          .not('completed_at', 'is', null)
          .gte('date_received', filters.dateRange.start)
          .lte('date_received', filters.dateRange.end);
          
        if (filters.organization !== 'all') {
          responseTimeQuery = responseTimeQuery.eq('sender', filters.organization);
        }
        
        const { data: responseTimeResults, error: responseTimeError } = await responseTimeQuery;
        if (responseTimeError) throw responseTimeError;
        
        if (responseTimeResults.length > 0) {
          const totalDays = responseTimeResults.reduce((sum, request) => {
            const receivedDate = parseISO(request.date_received);
            const completedDate = parseISO(request.completed_at);
            const daysDiff = Math.round((completedDate - receivedDate) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }, 0);
          
          setAvgResponseTime(Math.round(totalDays / responseTimeResults.length));
        } else {
          setAvgResponseTime(null);
        }
        
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [filters, sortConfig]);

  // Format status for display
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle sort toggle
  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Export to Excel
  const handleExport = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Status distribution sheet
      const statusSheet = XLSX.utils.json_to_sheet(statusDistribution.map(item => ({
        Status: item.name,
        Count: item.value,
        Percentage: `${((item.value / totalRequests) * 100).toFixed(1)}%`
      })));
      XLSX.utils.book_append_sheet(wb, statusSheet, 'Status Distribution');
      
      // Organization distribution sheet
      const orgSheet = XLSX.utils.json_to_sheet(organizationDistribution.map(item => ({
        Organization: item.name,
        Count: item.value,
        Percentage: `${((item.value / totalRequests) * 100).toFixed(1)}%`
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
      
      // Write file and download
      XLSX.writeFile(wb, `request_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
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
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Format number with comma separators
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Request Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Insights and statistics about document requests
            </p>
          </div>
          
          <button
            onClick={handleExport}
            disabled={loading || totalRequests === 0}
            className="flex items-center px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                     hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
        
        {/* Filters */}
        <ReportFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          organizations={organizations}
        />
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
          </div>
        ) : totalRequests === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8 text-center">
            <BarChartIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No data available
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              There are no requests matching your filter criteria. Try adjusting your filters or selecting a different date range.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total requests */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Requests
                  </h3>
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <BarChartIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(totalRequests)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  From {format(parseISO(filters.dateRange.start), 'MMM d, yyyy')} to {format(parseISO(filters.dateRange.end), 'MMM d, yyyy')}
                </p>
              </div>
              
              {/* Completed requests */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Completed Requests
                  </h3>
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(completedRequests)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {completedRequests > 0 
                    ? `${((completedRequests / totalRequests) * 100).toFixed(1)}% completion rate` 
                    : 'No completed requests'}
                </p>
              </div>
              
              {/* Pending requests */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Pending Requests
                  </h3>
                  <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {formatNumber(pendingRequests)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {pendingRequests > 0 
                    ? `${((pendingRequests / totalRequests) * 100).toFixed(1)}% of total requests` 
                    : 'No pending requests'}
                </p>
              </div>
              
              {/* Average response time */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Average Response Time
                  </h3>
                  <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {avgResponseTime !== null ? `${avgResponseTime} days` : 'N/A'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {completedRequests > 0 
                    ? `Based on ${completedRequests} completed requests` 
                    : 'No completed requests'}
                </p>
              </div>
            </div>
            
            {/* Status distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
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
                
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {statusDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center">
                      <div 
                        className="h-3 w-3 rounded-full mr-1" 
                        style={{ backgroundColor: entry.color }} 
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {entry.name}: {entry.value} ({((entry.value / totalRequests) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Organization distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChartIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Requests by Organization
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleSort('name')}
                      className="text-xs text-gray-500 dark:text-gray-400 flex items-center"
                    >
                      Name
                      {sortConfig.key === 'name' && (
                        sortConfig.direction === 'asc' 
                          ? <ArrowUp className="h-3 w-3 ml-1" /> 
                          : <ArrowDown className="h-3 w-3 ml-1" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleSort('count')}
                      className="text-xs text-gray-500 dark:text-gray-400 flex items-center ml-2"
                    >
                      Count
                      {sortConfig.key === 'count' && (
                        sortConfig.direction === 'asc' 
                          ? <ArrowUp className="h-3 w-3 ml-1" /> 
                          : <ArrowDown className="h-3 w-3 ml-1" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={organizationDistribution}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={90}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="value" 
                        name="Requests" 
                        background={{ fill: '#eee' }}
                      >
                        {organizationDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Monthly trends */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 lg:col-span-2"
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
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
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Missing imports
import { CheckSquare, TrendingUp } from 'lucide-react';

export default RequestReports;
