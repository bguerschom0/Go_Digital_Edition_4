import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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

  // Fetch report data based on filters
  const fetchReportData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
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
      
      const inProgressCount = formattedStatusData.find(item => item.name === 'In Progress')?.value || 0;
      setInProgressRequests(inProgressCount);
      
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
        name: item.organizations?.name || 'Unknown',
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
      
      // Summary sheet
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
        
        {/* Date range indicator */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
            
            <ReportFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              organizations={organizations}
            />
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
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestReports;
