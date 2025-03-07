import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart as BarChartIcon, 
  Calendar, 
  Download, 
  Building,
  Loader2,
  Filter,
  X
} from 'lucide-react';
import { supabase } from '../../config/supabase';
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
import { format, parseISO, subMonths } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, PieChart as PieChartIcon } from 'lucide-react';


// Chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
const STATUS_COLORS = {
  pending: '#FFBB28',
  in_progress: '#0088FE',
  completed: '#00C49F'
};

const OrganizationReports = () => {
  // Default date range (last 6 months)
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Organizations data
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  
  // Report data
  const [orgRequestVolume, setOrgRequestVolume] = useState([]);
  const [orgResponseTimes, setOrgResponseTimes] = useState([]);
  const [orgMonthlyActivity, setOrgMonthlyActivity] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);

  
  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalRequests: 0,
    avgResponseTime: 0,
    completionRate: 0,
    pendingRequests: 0
  });

  const [orgSummary, setOrgSummary] = useState({
    name: '',
    totalRequests: 0,
    completedRequests: 0,
    pendingRequests: 0,
    completionRate: 0,
    avgResponseDays: null,
    contactPerson: null,
    email: null,
    phone: null
  });

  useEffect(() => {
    if (selectedOrganization && organizations.length > 0) {
      const org = organizations.find(o => o.id === selectedOrganization);
      const completed = statusDistribution.find(s => s.name === 'Completed')?.value || 0;
      
      setOrgSummary({
        name: org?.name || 'All Organizations',
        totalRequests: summaryMetrics.totalRequests,
        completedRequests: completed,
        pendingRequests: summaryMetrics.pendingRequests,
        completionRate: summaryMetrics.completionRate,
        avgResponseDays: summaryMetrics.avgResponseTime
      });
    } else {
      setOrgSummary({
        name: 'All Organizations',
        totalRequests: summaryMetrics.totalRequests,
        completedRequests: statusDistribution.find(s => s.name === 'Completed')?.value || 0,
        pendingRequests: summaryMetrics.pendingRequests,
        completionRate: summaryMetrics.completionRate,
        avgResponseDays: summaryMetrics.avgResponseTime
      });
    }
  }, [selectedOrganization, organizations, statusDistribution, summaryMetrics]);
  

  const fetchRecentRequests = async () => {
    try {
      // Only fetch if we have a specific organization (not empty)
      if (!selectedOrganization) {
        setRecentRequests([]);
        return;
      }

      const { data, error } = await supabase
        .from('v4_requests')
        .select('id, reference_number, date_received, subject, status, completed_at')
        .eq('sender', selectedOrganization)
        .order('date_received', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setRecentRequests(data || []);
    } catch (err) {
      console.error('Error fetching recent requests:', err);
      setRecentRequests([]);
    }
  };

  // Fetch organizations list
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('v4_organizations')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        
        setOrganizations(data || []);
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Failed to load organizations');
      }
    };
    
    fetchOrganizations();
  }, []);

  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      if (organizations.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch organization request volume
        const fetchOrgVolume = async () => {
          try {
            let query = supabase
              .from('v4_requests')
              .select(`
                sender,
                v4_organizations!v4_requests_sender_fkey(name)
              `)
              .gte('date_received', dateRange.start)
              .lte('date_received', dateRange.end);
              
            if (selectedOrganization) {
              query = query.eq('sender', selectedOrganization);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Process data for chart - manual grouping since groupBy isn't working
            const orgCounts = {};
            data.forEach(item => {
              const orgId = item.sender;
              const orgName = item.v4_organizations?.name || 'Unknown';
              
              if (!orgCounts[orgId]) {
                orgCounts[orgId] = { name: orgName, count: 0 };
              }
              
              orgCounts[orgId].count += 1;
            });
            
            // Convert to array for chart
            const processedData = Object.values(orgCounts).map((org, index) => ({
              name: org.name,
              value: org.count,
              color: COLORS[index % COLORS.length]
            }));
            
            setOrgRequestVolume(processedData);
          } catch (err) {
            console.error('Error in fetchOrgVolume:', err);
            setOrgRequestVolume([]);
          }
        };

        // Fetch organization response times - with fallback
        const fetchResponseTimes = async () => {
          try {
            // Try RPC first
            const options = {
              start_date: dateRange.start,
              end_date: dateRange.end
            };
            
            let responsePromise;
            
            if (selectedOrganization) {
              // If organization is selected, use eq filter
              responsePromise = supabase
                .rpc('v4_get_avg_response_times_by_org', options)
                .eq('org_id', selectedOrganization);
            } else {
              // If no organization selected, get all
              responsePromise = supabase
                .rpc('v4_get_avg_response_times_by_org', options);
            }
            
            const { data, error } = await responsePromise;
            
            // If RPC fails, use direct query
            if (error) {
              console.log('RPC failed, using direct query instead');
              
              // Direct query as fallback
              let fallbackQuery = supabase
                .from('v4_requests')
                .select(`
                  sender,
                  v4_organizations!v4_requests_sender_fkey(id, name),
                  date_received,
                  completed_at
                `)
                .gte('date_received', dateRange.start)
                .lte('date_received', dateRange.end)
                .not('completed_at', 'is', null);
                
              if (selectedOrganization) {
                fallbackQuery = fallbackQuery.eq('sender', selectedOrganization);
              }
                
              const { data: requestsData, error: requestsError } = await fallbackQuery;
                
              if (requestsError) throw requestsError;
              
              // Group and calculate average
              const orgGroups = {};
              requestsData.forEach(request => {
                if (!request.v4_organizations) return;
                
                const orgId = request.sender;
                const orgName = request.v4_organizations.name;
                if (!orgGroups[orgId]) {
                  orgGroups[orgId] = { org_id: orgId, org_name: orgName, total: 0, count: 0 };
                }
                
                const days = (new Date(request.completed_at) - new Date(request.date_received)) / (1000 * 60 * 60 * 24);
                orgGroups[orgId].total += days;
                orgGroups[orgId].count += 1;
              });
              
              const processedData = Object.values(orgGroups).map((org, index) => ({
                name: org.org_name,
                value: parseFloat((org.total / org.count).toFixed(1)),
                color: COLORS[index % COLORS.length]
              }));
              
              setOrgResponseTimes(processedData);
              return;
            }
            
            // Process data from RPC
            const processedData = (data || []).map((item, index) => ({
              name: item.org_name,
              value: parseFloat(item.avg_days.toFixed(1)),
              color: COLORS[index % COLORS.length]
            }));
            
            setOrgResponseTimes(processedData);
          } catch (err) {
            console.error('Error in fetchResponseTimes:', err);
            setOrgResponseTimes([]);
          }
        };

        // Fetch monthly activity by organization - with fallback
        const fetchMonthlyActivity = async () => {
          try {
            // Try RPC first
            const options = {
              start_date: dateRange.start,
              end_date: dateRange.end,
              org_id: selectedOrganization || null
            };
            
            const { data, error } = await supabase.rpc('v4_get_monthly_requests_by_org', options);
            
            // If RPC fails, use direct query
            if (error) {
              console.log('RPC failed, using direct query for monthly data');
              
              // Direct query as fallback
              let query = supabase
                .from('v4_requests')
                .select('date_received, status')
                .gte('date_received', dateRange.start)
                .lte('date_received', dateRange.end);
                
              if (selectedOrganization) {
                query = query.eq('sender', selectedOrganization);
              }
                
              const { data: requestsData, error: requestsError } = await query;
                
              if (requestsError) throw requestsError;
              
              // Group by month and status
              const monthlyGroups = {};
              requestsData.forEach(request => {
                // Format to YYYY-MM
                const monthKey = request.date_received.substring(0, 7);
                if (!monthlyGroups[monthKey]) {
                  monthlyGroups[monthKey] = {
                    total: 0,
                    completed: 0,
                    pending: 0,
                    in_progress: 0
                  };
                }
                
                monthlyGroups[monthKey].total += 1;
                
                // Increment status counter
                const status = request.status || 'pending';
                monthlyGroups[monthKey][status] = (monthlyGroups[monthKey][status] || 0) + 1;
              });
              
              // Convert to array for chart
              const processedData = Object.entries(monthlyGroups)
                .map(([month, data]) => ({
                  month: format(new Date(`${month}-01`), 'MMM yyyy'),
                  total: data.total,
                  completed: data.completed || 0,
                  pending: data.pending || 0,
                  in_progress: data.in_progress || 0
                }))
                .sort((a, b) => {
                  // Sort chronologically
                  const dateA = new Date(a.month);
                  const dateB = new Date(b.month);
                  return dateA - dateB;
                });
              
              setOrgMonthlyActivity(processedData);
              return;
            }
            
            // Process data from RPC
            const processedData = (data || []).map(item => ({
              month: format(parseISO(item.month), 'MMM yyyy'),
              total: parseInt(item.total_count),
              completed: parseInt(item.completed_count),
              pending: parseInt(item.pending_count),
              in_progress: parseInt(item.in_progress_count)
            }));
            
            setOrgMonthlyActivity(processedData);
          } catch (err) {
            console.error('Error in fetchMonthlyActivity:', err);
            setOrgMonthlyActivity([]);
          }
        };

        // Fetch status distribution
        const fetchStatusDistribution = async () => {
          try {
            let query = supabase
              .from('v4_requests')
              .select('status')
              .gte('date_received', dateRange.start)
              .lte('date_received', dateRange.end);
              
            if (selectedOrganization) {
              query = query.eq('sender', selectedOrganization);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            
            // Process data for chart - manual grouping
            const statusCounts = {};
            data.forEach(item => {
              const status = item.status || 'pending';
              
              if (!statusCounts[status]) {
                statusCounts[status] = 0;
              }
              
              statusCounts[status] += 1;
            });
            
            // Convert to array for chart
            const processedData = Object.entries(statusCounts).map(([status, count]) => ({
              name: formatStatus(status),
              value: count,
              color: STATUS_COLORS[status] || '#8884D8'
            }));
            
            setStatusDistribution(processedData);
            
            // Update summary metrics
            const totalRequests = processedData.reduce((sum, item) => sum + item.value, 0);
            const completedCount = processedData.find(item => item.name === 'Completed')?.value || 0;
            const pendingCount = processedData.find(item => item.name === 'Pending')?.value || 0;
            
            setSummaryMetrics(prev => ({
              ...prev,
              totalRequests,
              completionRate: totalRequests > 0 ? (completedCount / totalRequests * 100).toFixed(1) : 0,
              pendingRequests: pendingCount
            }));
          } catch (err) {
            console.error('Error in fetchStatusDistribution:', err);
            setStatusDistribution([]);
          }
        };

        // Fetch average response time - with fallback
        const fetchAvgResponseTime = async () => {
          try {
            // Try RPC first
            const options = {
              start_date: dateRange.start,
              end_date: dateRange.end,
              org_id: selectedOrganization || null
            };
            
            const { data, error } = await supabase.rpc('v4_get_avg_response_time', options);
            
            // If RPC fails, use direct query
            if (error) {
              console.log('RPC failed, using direct query for avg response time');
              
              // Direct query as fallback
              let directQuery = supabase
                .from('v4_requests')
                .select('date_received, completed_at')
                .gte('date_received', dateRange.start)
                .lte('date_received', dateRange.end)
                .not('completed_at', 'is', null);
                
              if (selectedOrganization) {
                directQuery = directQuery.eq('sender', selectedOrganization);
              }
              
              const { data: requestsData, error: requestsError } = await directQuery;
              
              if (requestsError) throw requestsError;
              
              // Calculate average
              if (requestsData && requestsData.length > 0) {
                let totalDays = 0;
                requestsData.forEach(request => {
                  const days = (new Date(request.completed_at) - new Date(request.date_received)) / (1000 * 60 * 60 * 24);
                  totalDays += days;
                });
                
                const avgDays = parseFloat((totalDays / requestsData.length).toFixed(1));
                
                setSummaryMetrics(prev => ({
                  ...prev,
                  avgResponseTime: avgDays
                }));
              }
              return;
            }
            
            // Process data from RPC
            if (data && data[0] && data[0].avg_days !== null) {
              setSummaryMetrics(prev => ({
                ...prev,
                avgResponseTime: parseFloat(data[0].avg_days.toFixed(1))
              }));
            }
          } catch (err) {
            console.error('Error in fetchAvgResponseTime:', err);
          }
        };

        // Run all queries in parallel
        await Promise.all([
          fetchOrgVolume(),
          fetchResponseTimes(),
          fetchMonthlyActivity(),
          fetchStatusDistribution(),
          fetchAvgResponseTime()
        ]);
        
        // Fetch recent requests separately since it depends on organization
        if (selectedOrganization) {
          await fetchRecentRequests();
        } else {
          setRecentRequests([]);
        }
        
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [organizations, selectedOrganization, dateRange]);

  // Helper function to format status
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-500 dark:text-gray-400">
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };
  

  // Export data to Excel
  const exportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Create organization volume sheet
      const orgVolumeSheet = XLSX.utils.json_to_sheet(
        orgRequestVolume.map(org => ({
          'Organization': org.name,
          'Request Count': org.value,
          'Percentage': `${((org.value / summaryMetrics.totalRequests) * 100).toFixed(1)}%`
        }))
      );
      XLSX.utils.book_append_sheet(wb, orgVolumeSheet, 'Organization Volume');
      
      // Create response times sheet
      const responseTimesSheet = XLSX.utils.json_to_sheet(
        orgResponseTimes.map(org => ({
          'Organization': org.name,
          'Average Response Time (Days)': org.value
        }))
      );
      XLSX.utils.book_append_sheet(wb, responseTimesSheet, 'Response Times');
      
      // Create monthly activity sheet
      const monthlySheet = XLSX.utils.json_to_sheet(
        orgMonthlyActivity.map(item => ({
          'Month': item.month,
          'Total Requests': item.total,
          'Completed': item.completed,
          'In Progress': item.in_progress,
          'Pending': item.pending
        }))
      );
      XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Activity');
      
      // Create status distribution sheet
      const statusSheet = XLSX.utils.json_to_sheet(
        statusDistribution.map(status => ({
          'Status': status.name,
          'Count': status.value,
          'Percentage': `${((status.value / summaryMetrics.totalRequests) * 100).toFixed(1)}%`
        }))
      );
      XLSX.utils.book_append_sheet(wb, statusSheet, 'Status Distribution');
      
      // Generate filename with date and selected organization
      const orgName = selectedOrganization
        ? organizations.find(org => org.id === selectedOrganization)?.name || 'Selected'
        : 'All';
      const filename = `organization_report_${orgName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      // Write file
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert('Failed to export data. Please try again.');
    }
  };

return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Organization Reports
          </h1>

        </div>
        
        <button
          onClick={exportToExcel}
          disabled={loading || !selectedOrganization}
          className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to Excel
        </button>
      </div>
      
      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Report Filters
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Organization select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization
            </label>
            <select
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="">Select an Organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
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
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
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
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
          </div>
        </div>
      </motion.div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500 dark:text-gray-400">Loading data...</span>
        </div>
      ) : !selectedOrganization ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <Building className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select an Organization
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Please select an organization from the dropdown above to view detailed reports.
          </p>
        </div>
      ) : orgRequestVolume.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Data Available
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            There are no requests for this organization within the selected date range.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Organization Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {orgSummary.name} - Summary
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Requests
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {orgSummary.totalRequests}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Completed
                </h3>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {orgSummary.completedRequests}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {orgSummary.completionRate}% completion rate
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Pending
                </h3>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {orgSummary.pendingRequests}
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Avg. Response Time
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {orgSummary.avgResponseDays !== null ? `${orgSummary.avgResponseDays} days` : 'N/A'}
                </p>
              </div>
            </div>
            
            {orgSummary.contactPerson && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Organization Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Contact Person
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {orgSummary.contactPerson}
                    </p>
                  </div>
                  
                  {orgSummary.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {orgSummary.email}
                      </p>
                    </div>
                  )}
                  
                  {orgSummary.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Phone
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {orgSummary.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Status Distribution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
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
          </motion.div>
          
          {/* Monthly Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChartIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Monthly Request Trends
              </h2>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={orgMonthlyActivity}
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
                    stroke="#FFBB28" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="in_progress" 
                    name="In Progress"
                    stroke="#0088FE" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    name="Completed"
                    stroke="#00C49F" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          
          {/* Recent Requests Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Requests
              </h2>
            </div>
            
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
                      Response Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentRequests.map((request) => {
                    // Calculate response time for completed requests
                    const responseTime = request.completed_at && request.date_received
                      ? Math.round((new Date(request.completed_at) - new Date(request.date_received)) / (1000 * 60 * 60 * 24))
                      : null;
                      
                    return (
                      <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                          <Link to={`/requests/${request.id}`}>
                            {request.reference_number}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(request.date_received), 'dd MMM yyyy')}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {responseTime !== null ? (
                            `${responseTime} days`
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {recentRequests.length > 0 && (
              <div className="mt-4 text-right">
                <Link 
                  to={`/requests?organization=${selectedOrganization}`} 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-end"
                >
                  View all organization requests
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  </div>
);
};

export default OrganizationReports;
