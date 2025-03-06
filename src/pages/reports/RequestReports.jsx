import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon,
  Calendar, 
  Download, 
  Filter,
  Loader2,
  ArrowDown,
  ArrowUp,
  CheckSquare, 
  TrendingUp,
  Clock,
  RefreshCw,
  X,
  AlertCircle
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
  Line,
  Area,
  AreaChart
} from 'recharts';
import * as XLSX from 'xlsx';
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import ReportFilters from '../../components/reports/ReportFilters';

// Chart colors - Enhanced color palette
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
const STATUS_COLORS = {
  pending: '#F59E0B',     // Amber
  in_progress: '#3B82F6', // Blue
  completed: '#10B981'    // Green
};

const RequestReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [error, setError] = useState(null);
  
  // Report data
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [organizationDistribution, setOrganizationDistribution] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [avgResponseTime, setAvgResponseTime] = useState(null);
  const [totalRequests, setTotalRequests] = useState(0);
  const [completedRequests, setCompletedRequests] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [inProgressRequests, setInProgressRequests] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState({
    dateRange: {
      start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    organization: 'all'
  });

  // Calculate date range text for display
  const dateRangeText = useMemo(() => {
    return {
      start: format(parseISO(filters.dateRange.start), 'MMM d, yyyy'),
      end: format(parseISO(filters.dateRange.end), 'MMM d, yyyy')
    };
  }, [filters.dateRange]);

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
        setError('Failed to load organizations. Please try again.');
      }
    };
    
    fetchOrganizations();
  }, []);

  // Format status for display
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Fetch report data based on filters
  const fetchReportData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      // Base query for all requests within date range
      let baseQuery = supabase
        .from('v4_requests')
        .select('*') // Select all fields
        .gte('date_received', filters.dateRange.start)
        .lte('date_received', filters.dateRange.end);
        
      // Apply organization filter if not 'all'
      if (filters.organization !== 'all') {
        baseQuery = baseQuery.eq('sender', filters.organization);
      }
      
      // Fetch all filtered requests
      const { data: allRequests, error: requestsError } = await baseQuery;
      
      if (requestsError) throw requestsError;
      
      // Process status distribution
      const statusCounts = {};
      allRequests.forEach(request => {
        const status = request.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      const formattedStatusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: formatStatus(status),
        value: count,
        color: STATUS_COLORS[status] || '#8884D8'
      }));
      
      setStatusDistribution(formattedStatusData);
      
      // Calculate totals
      const totalCount = allRequests.length;
      setTotalRequests(totalCount);
      
      const completedCount = allRequests.filter(r => r.status === 'completed').length;
      setCompletedRequests(completedCount);
      
      const pendingCount = allRequests.filter(r => r.status === 'pending').length;
      setPendingRequests(pendingCount);
      
      const inProgressCount = allRequests.filter(r => r.status === 'in_progress').length;
      setInProgressRequests(inProgressCount);
      
      // Fetch organizations data separately for organization names
      const { data: orgsData, error: orgsError } = await supabase
        .from('v4_organizations')
        .select('id, name');
        
      if (orgsError) throw orgsError;
      
      // Create a map of org IDs to names
      const orgMap = {};
      orgsData.forEach(org => {
        orgMap[org.id] = org.name;
      });
      
      // Process organization distribution
      const orgCounts = {};
      allRequests.forEach(request => {
        const orgName = orgMap[request.sender] || 'Unknown';
        orgCounts[orgName] = (orgCounts[orgName] || 0) + 1;
      });
      
      const formattedOrgData = Object.entries(orgCounts).map(([name, value], index) => ({
        name,
        value,
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
      
      // Process monthly trends
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
      
      // Process monthly data
      const monthlyData = initialMonthlyData.map(monthData => {
        const monthRequests = allRequests.filter(request => {
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
      
      // Calculate average response time
      const completedRequests = allRequests.filter(r => 
        r.status === 'completed' && r.completed_at
      );
      
      if (completedRequests.length > 0) {
        const totalDays = completedRequests.reduce((sum, request) => {
          if (!request.date_received || !request.completed_at) return sum;
          
          const receivedDate = parseISO(request.date_received);
          const completedDate = parseISO(request.completed_at);
          const daysDiff = Math.round((completedDate - receivedDate) / (1000 * 60 * 60 * 24));
          return sum + daysDiff;
        }, 0);
        
        setAvgResponseTime(Math.round(totalDays / completedRequests.length));
      } else {
        setAvgResponseTime(null);
      }
      
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Failed to load report data. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchReportData();
  }, [filters, sortConfig]);

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

  // Calculate completion rate
  const completionRate = useMemo(() => {
    if (totalRequests === 0) return 0;
    return ((completedRequests / totalRequests) * 100).toFixed(1);
  }, [completedRequests, totalRequests]);

  // Calculate pending rate
  const pendingRate = useMemo(() => {
    if (totalRequests === 0) return 0;
    return ((pendingRequests / totalRequests) * 100).toFixed(1);
  }, [pendingRequests, totalRequests]);

  // Calculate in progress rate
  const inProgressRate = useMemo(() => {
    if (totalRequests === 0) return 0;
    return ((inProgressRequests / totalRequests) * 100).toFixed(1);
  }, [inProgressRequests, totalRequests]);

  // Export to Excel
  const handleExport = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // 1. All Request Data Sheet (NEW)
      const allDataHeaders = [
        'Request ID', 
        'Status', 
        'Organization', 
        'Date Received', 
        'Completed Date', 
        'Days to Complete'
      ];
      
      // Fetch organization data for mapping
      const orgNames = {};
      organizations.forEach(org => {
        orgNames[org.id] = org.name;
      });
      
      // Format all request data for export
      const allRequestData = [];
      
      // Add headers row
      allRequestData.push(allDataHeaders);
      
      // Get all filtered requests
      let requestsToExport = [];
      
      // We need to fetch the data with organization names
      const fetchAllRequestData = async () => {
        let baseQuery = supabase
          .from('v4_requests')
          .select('*')
          .gte('date_received', filters.dateRange.start)
          .lte('date_received', filters.dateRange.end);
          
        if (filters.organization !== 'all') {
          baseQuery = baseQuery.eq('sender', filters.organization);
        }
        
        const { data, error } = await baseQuery;
        
        if (error) throw error;
        
        // Process and add data rows
        data.forEach(request => {
          const receivedDate = request.date_received ? parseISO(request.date_received) : null;
          const completedDate = request.completed_at ? parseISO(request.completed_at) : null;
          
          let daysToComplete = '';
          if (receivedDate && completedDate) {
            daysToComplete = Math.round((completedDate - receivedDate) / (1000 * 60 * 60 * 24));
          }
          
          allRequestData.push([
            request.id || '',
            formatStatus(request.status || ''),
            orgNames[request.sender] || 'Unknown',
            request.date_received ? format(receivedDate, 'MMM d, yyyy') : '',
            request.completed_at ? format(completedDate, 'MMM d, yyyy') : '',
            daysToComplete
          ]);
        });
        
        // Create and add All Data Sheet
        const allDataSheet = XLSX.utils.aoa_to_sheet(allRequestData);
        XLSX.utils.book_append_sheet(wb, allDataSheet, 'All Requests');
      
        // 2. Status distribution sheet
        const statusSheet = XLSX.utils.json_to_sheet(statusDistribution.map(item => ({
          Status: item.name,
          Count: item.value,
          Percentage: `${((item.value / totalRequests) * 100).toFixed(1)}%`
        })));
        XLSX.utils.book_append_sheet(wb, statusSheet, 'Status Distribution');
        
        // 3. Organization distribution sheet
        const orgSheet = XLSX.utils.json_to_sheet(organizationDistribution.map(item => ({
          Organization: item.name,
          Count: item.value,
          Percentage: `${((item.value / totalRequests) * 100).toFixed(1)}%`
        })));
        XLSX.utils.book_append_sheet(wb, orgSheet, 'Organization Distribution');
        
        // 4. Monthly trends sheet
        const trendsSheet = XLSX.utils.json_to_sheet(monthlyTrends.map(item => ({
          Month: item.month,
          'Total Requests': item.total,
          Pending: item.pending,
          'In Progress': item.in_progress,
          Completed: item.completed
        })));
        XLSX.utils.book_append_sheet(wb, trendsSheet, 'Monthly Trends');
        
        // 5. Summary sheet
        const summaryData = [
          { Metric: 'Total Requests', Value: totalRequests },
          { Metric: 'Completed Requests', Value: completedRequests },
          { Metric: 'Completion Rate', Value: `${completionRate}%` },
          { Metric: 'Pending Requests', Value: pendingRequests },
          { Metric: 'In Progress Requests', Value: inProgressRequests },
          { Metric: 'Average Response Time (Days)', Value: avgResponseTime || 'N/A' },
          { Metric: 'Date Range', Value: `${dateRangeText.start} to ${dateRangeText.end}` },
          { Metric: 'Organization Filter', Value: filters.organization === 'all' ? 'All Organizations' : 
            organizations.find(org => org.id === filters.organization)?.name || filters.organization },
          { Metric: 'Report Generated On', Value: format(new Date(), 'PPP') },
          { Metric: 'Generated By', Value: user?.full_name || user?.email || 'Unknown' }
        ];
        
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
        
        // Write file and download
        XLSX.writeFile(wb, `request_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      };
      
      // Execute the async function
      fetchAllRequestData().catch(error => {
        console.error('Error exporting to Excel:', error);
        alert('Failed to export data. Please try again.');
      });
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  // Manual refresh
  const handleRefresh = () => {
    fetchReportData(true);
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Request Reports
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Insights and statistics about document requests
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 
                       text-gray-700 dark:text-gray-300 rounded-lg
                       hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={handleExport}
              disabled={loading || refreshing || totalRequests === 0}
              className="flex items-center px-3 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                       hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>
        
{/* Date range indicator and filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {dateRangeText.start} to {dateRangeText.end}
              </span>
              {filters.organization !== 'all' && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded-full">
                  {organizations.find(org => org.id === filters.organization)?.name || 'Organization Filter Active'}
                </span>
              )}
            </div>
            
            {/* ReportFilters Component - Make sure this component is styled properly */}
            <div className="w-full md:w-auto">
              <ReportFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                organizations={organizations}
              />
            </div>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 flex items-center text-sm text-red-600 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100"
              >
                <X className="h-4 w-4 mr-1" />
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {loading && !refreshing ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading report data...</p>
          </div>
        ) : totalRequests === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
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
            {/* Status distribution chart */}
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
            </div>

            {/* Organization distribution chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
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
                    className="text-xs flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Name
                    {sortConfig.key === 'name' && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUp className="w-3 h-3 ml-1" /> : 
                        <ArrowDown className="w-3 h-3 ml-1" />
                    )}
                  </button>
                  <button
                    onClick={() => handleSort('count')}
                    className="text-xs flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Count
                    {sortConfig.key === 'count' && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUp className="w-3 h-3 ml-1" /> : 
                        <ArrowDown className="w-3 h-3 ml-1" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={organizationDistribution}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 100,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Requests">
                      {organizationDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly trends chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Monthly Request Trends
                </h2>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyTrends}
                    margin={{
                      top: 10,
                      right: 30,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" dataKey="total" name="Total" fill="#8884d8" stroke="#8884d8" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="completed" name="Completed" fill={STATUS_COLORS.completed} stroke={STATUS_COLORS.completed} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="in_progress" name="In Progress" fill={STATUS_COLORS.in_progress} stroke={STATUS_COLORS.in_progress} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="pending" name="Pending" fill={STATUS_COLORS.pending} stroke={STATUS_COLORS.pending} fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Requests */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Total Requests
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {formatNumber(totalRequests)}
                    </h3>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Filter className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              {/* Completion Rate */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Completion Rate
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {completionRate}%
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(completedRequests)} completed
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckSquare className="h-5 w-5 text-green-500 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              {/* Average Response Time */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Avg. Response Time
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {avgResponseTime !== null ? `${avgResponseTime} days` : 'N/A'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      For completed requests
                    </p>
                  </div>
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  </div>
                </div>
              </div>
              
              {/* Pending Rate */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Pending Rate
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {pendingRate}%
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {formatNumber(pendingRequests)} pending
                    </p>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestReports;
