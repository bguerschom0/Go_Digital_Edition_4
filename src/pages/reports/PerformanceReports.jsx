import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import ReportFilters from '../../components/reports/ReportFilters';
import ReportChart from '../../components/reports/ReportChart';
import ReportTable from '../../components/reports/ReportTable';
import ReportExport from '../../components/reports/ReportExport';
import { subMonths, format, parseISO } from 'date-fns';
import { Loader2, Clock, UserCheck, FileUp, BarChart } from 'lucide-react';

const PerformanceReports = () => {
  // Default to last 3 months
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  
  // Report type filter
  const [reportType, setReportType] = useState('response_time');
  
  // Report data
  const [userPerformance, setUserPerformance] = useState([]);
  const [responseTimeData, setResponseTimeData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch organizations for filters
  const [organizations, setOrganizations] = useState([]);
  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data, error } = await supabase
        .from('v4_organizations')
        .select('id, name')
        .order('name');
        
      if (!error && data) {
        setOrganizations(data);
      }
    };
    
    fetchOrganizations();
  }, []);
  
  // Fetch report data based on filters
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      
      try {
        // Fetch data based on report type
        switch (reportType) {
          case 'response_time':
            await fetchResponseTimeData();
            break;
          case 'user_performance':
            await fetchUserPerformanceData();
            break;
          case 'volume_trends':
            await fetchVolumeData();
            break;
          default:
            await fetchResponseTimeData();
        }
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [dateRange, reportType]);
  
  // Fetch response time data - MODIFIED TO USE DIRECT QUERIES
  const fetchResponseTimeData = async () => {
    try {
      // Fetch requests with date_received and completed_at
      const { data: requestsData, error: requestsError } = await supabase
        .from('v4_requests')
        .select(`
          priority,
          date_received,
          completed_at,
          organization_id,
          v4_organizations(id, name)
        `)
        .gte('date_received', dateRange.start)
        .lte('date_received', dateRange.end)
        .not('completed_at', 'is', null);
      
      if (requestsError) {
        console.error('Error fetching requests data:', requestsError);
        setResponseTimeData({ priorityData: [], orgData: [] });
        return;
      }
      
      // Calculate average response time by priority
      const priorityGroups = {};
      requestsData.forEach(request => {
        const priority = request.priority || 'unknown';
        if (!priorityGroups[priority]) {
          priorityGroups[priority] = { total: 0, count: 0 };
        }
        
        const days = (new Date(request.completed_at) - new Date(request.date_received)) / (1000 * 60 * 60 * 24);
        priorityGroups[priority].total += days;
        priorityGroups[priority].count += 1;
      });
      
      const priorityData = Object.entries(priorityGroups).map(([priority, data]) => ({
        priority,
        avg_days: data.count > 0 ? parseFloat((data.total / data.count).toFixed(2)) : 0
      }));
      
      // Calculate average response time by organization
      const orgGroups = {};
      requestsData.forEach(request => {
        if (!request.v4_organizations) return;
        
        const orgName = request.v4_organizations.name;
        const orgId = request.v4_organizations.id;
        if (!orgGroups[orgId]) {
          orgGroups[orgId] = { name: orgName, total: 0, count: 0 };
        }
        
        const days = (new Date(request.completed_at) - new Date(request.date_received)) / (1000 * 60 * 60 * 24);
        orgGroups[orgId].total += days;
        orgGroups[orgId].count += 1;
      });
      
      const orgData = Object.values(orgGroups).map(org => ({
        name: org.name,
        avg_days: org.count > 0 ? parseFloat((org.total / org.count).toFixed(2)) : 0
      }));
      
      // Sort by average days
      orgData.sort((a, b) => b.avg_days - a.avg_days);
      
      setResponseTimeData({
        priorityData,
        orgData
      });
    } catch (error) {
      console.error('Error processing response time data:', error);
      setResponseTimeData({ priorityData: [], orgData: [] });
    }
  };
  
  // Fetch user performance data - THIS STAYS THE SAME
  const fetchUserPerformanceData = async () => {
    // Requests processed by user
    const { data: userData, error: userError } = await supabase
      .from('v4_requests')
      .select(`
        assigned_to,
        users!assigned_to(full_name),
        status
      `)
      .gte('date_received', dateRange.start)
      .lte('date_received', dateRange.end)
      .not('assigned_to', 'is', null);
      
    if (userError) {
      console.error('Error fetching user performance:', userError);
      return;
    }
    
    // Group and aggregate data
    const userStats = {};
    userData?.forEach(item => {
      const userId = item.assigned_to;
      const userName = item.users?.full_name || 'Unknown';
      
      if (!userStats[userId]) {
        userStats[userId] = {
          user_id: userId,
          name: userName,
          total: 0,
          completed: 0,
          pending: 0,
          in_progress: 0
        };
      }
      
      userStats[userId].total += 1;
      
      // Increment status counter (defaulting to 0 if status doesn't exist yet)
      const status = item.status || 'pending';
      userStats[userId][status] = (userStats[userId][status] || 0) + 1;
    });
    
    // Convert to array and add completion rate
    const userPerformanceArray = Object.values(userStats).map(user => ({
      ...user,
      completion_rate: user.total > 0 
        ? Math.round((user.completed / user.total) * 100) 
        : 0
    }));
    
    // Sort by total requests
    userPerformanceArray.sort((a, b) => b.total - a.total);
    
    setUserPerformance(userPerformanceArray);
  };
  
  // Fetch volume trend data - MODIFIED TO USE DIRECT QUERY
  const fetchVolumeData = async () => {
    try {
      // Fetch requests grouped by date_received
      const { data: requestsData, error: requestsError } = await supabase
        .from('v4_requests')
        .select('date_received')
        .gte('date_received', dateRange.start)
        .lte('date_received', dateRange.end);
      
      if (requestsError) {
        console.error('Error fetching volume data:', requestsError);
        setVolumeData([]);
        return;
      }
      
      // Group by month
      const monthlyGroups = {};
      requestsData.forEach(request => {
        const monthKey = format(parseISO(request.date_received), 'yyyy-MM');
        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = { count: 0 };
        }
        monthlyGroups[monthKey].count += 1;
      });
      
      // Convert to array for chart
      const formattedData = Object.entries(monthlyGroups)
        .map(([month, data]) => ({
          month: format(parseISO(`${month}-01`), 'MMM yyyy'),
          count: data.count
        }))
        .sort((a, b) => {
          // Sort chronologically
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA - dateB;
        });
      
      setVolumeData(formattedData);
    } catch (error) {
      console.error('Error processing volume data:', error);
      setVolumeData([]);
    }
  };
  
  // Export report data
  const handleExport = (format) => {
    // Implementation...
  };
  
  // Report title based on type
  const getReportTitle = () => {
    switch (reportType) {
      case 'response_time':
        return 'Response Time Analysis';
      case 'user_performance':
        return 'User Performance Analysis';
      case 'volume_trends':
        return 'Request Volume Trends';
      default:
        return 'Performance Report';
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
        {getReportTitle()}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Analyze performance metrics and identify trends
      </p>
      
      {/* Report Type Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Report Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setReportType('response_time')}
            className={`p-4 rounded-lg border flex items-center gap-3 transition-colors ${
              reportType === 'response_time' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Clock className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Response Time</div>
              <div className="text-xs">Average resolution time analysis</div>
            </div>
          </button>
          
          <button
            onClick={() => setReportType('user_performance')}
            className={`p-4 rounded-lg border flex items-center gap-3 transition-colors ${
              reportType === 'user_performance' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
            }`}
          >
            <UserCheck className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">User Performance</div>
              <div className="text-xs">Request processing by user</div>
            </div>
          </button>
          
          <button
            onClick={() => setReportType('volume_trends')}
            className={`p-4 rounded-lg border flex items-center gap-3 transition-colors ${
              reportType === 'volume_trends' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
            }`}
          >
            <BarChart className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Volume Trends</div>
              <div className="text-xs">Request volume over time</div>
            </div>
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <ReportFilters 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        organizations={organizations}
      />
      
      {/* Report Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          {reportType === 'response_time' && responseTimeData && (
            <>
              {/* Response Time by Priority */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Average Response Time by Priority
                </h2>
                <div className="h-64">
                  <ReportChart 
                    type="bar" 
                    data={responseTimeData.priorityData} 
                    dataKey="avg_days" 
                    nameKey="priority"
                    xAxisLabel="Priority"
                    yAxisLabel="Average Days"
                    colors={['#0088FE', '#00C49F', '#FFBB28', '#FF8042']}
                  />
                </div>
              </div>
              
              {/* Response Time by Organization */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Average Response Time by Organization
                </h2>
                <div className="h-80">
                  <ReportChart 
                    type="bar" 
                    data={responseTimeData.orgData} 
                    dataKey="avg_days" 
                    nameKey="name"
                    layout="vertical"
                    xAxisLabel="Average Days"
                    yAxisLabel="Organization"
                    colors={['#8884d8']}
                  />
                </div>
              </div>
            </>
          )}
          
          {reportType === 'user_performance' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                User Performance Metrics
              </h2>
              <ReportTable
                data={userPerformance}
                columns={[
                  { Header: 'User', accessor: 'name' },
                  { Header: 'Total Requests', accessor: 'total' },
                  { Header: 'Completed', accessor: 'completed' },
                  { 
                    Header: 'Completion Rate', 
                    accessor: 'completion_rate',
                    Cell: ({ value }) => `${value}%` 
                  },
                  { Header: 'Pending', accessor: 'pending' },
                  { Header: 'In Progress', accessor: 'in_progress' }
                ]}
              />
            </div>
          )}
          
          {reportType === 'volume_trends' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Request Volume by Month
              </h2>
              <div className="h-64">
                <ReportChart 
                  type="line" 
                  data={volumeData} 
                  dataKey="count" 
                  nameKey="month"
                  xAxisLabel="Month"
                  yAxisLabel="Number of Requests"
                  colors={['#0088FE']}
                />
              </div>
            </div>
          )}
          
          {/* Export Button */}
          <div className="flex justify-end mt-6">
            <ReportExport 
              onExport={handleExport} 
              data={{
                reportType,
                responseTimeData,
                userPerformance,
                volumeData
              }}
              filename={`performance_report_${format(new Date(), 'yyyy-MM-dd')}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceReports;
