import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import ReportFilters from '../../components/reports/ReportFilters';
import ReportTable from '../../components/reports/ReportTable';
import ReportChart from '../../components/reports/ReportChart';
import ReportExport from '../../components/reports/ReportExport';
import { subMonths, format } from 'date-fns';

const RequestReports = () => {
  // Default to last 6 months
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [organizations, setOrganizations] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [orgData, setOrgData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Fetch organizations for filter
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
  
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      
      try {
        // Status distribution query
        let statusQuery = supabase
          .from('v4_requests')
          .select('status, count(*)', { count: 'exact' })
          .gte('date_received', dateRange.start)
          .lte('date_received', dateRange.end)
          .groupBy('status');
          
        // Apply org filter if not 'all'
        if (organizationFilter !== 'all') {
          statusQuery = statusQuery.eq('sender', organizationFilter);
        }
        
        const { data: statusResults, error: statusError } = await statusQuery;
        
        if (statusError) throw statusError;
        
        // Format status data for chart
        const formattedStatusData = statusResults.map(item => ({
          name: formatStatus(item.status),
          value: parseInt(item.count),
          color: getStatusColor(item.status)
        }));
        
        setStatusData(formattedStatusData);
        
        // Similar queries for organization data and monthly data
        // ...
        
      } catch (error) {
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [dateRange, organizationFilter]);
  
  // Helper function to format status
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Helper function to get status color
  const getStatusColor = (status) => {
    const colors = {
      'pending': '#FFBB28',
      'in_progress': '#0088FE',
      'completed': '#00C49F'
    };
    return colors[status] || '#8884d8';
  };
  
  // Export report data
  const handleExport = (format) => {
    // Implementation using ReportExport component
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Request Reports</h1>
      
      <ReportFilters 
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        organizationFilter={organizationFilter}
        onOrganizationFilterChange={setOrganizationFilter}
        organizations={organizations}
      />
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          {/* Status Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Request Status Distribution</h2>
            <div className="h-64">
              <ReportChart 
                type="pie" 
                data={statusData} 
                dataKey="value" 
                nameKey="name" 
              />
            </div>
          </div>
          
          {/* Organization Distribution Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Requests by Organization</h2>
            <div className="h-64">
              <ReportChart 
                type="bar" 
                data={orgData} 
                dataKey="value" 
                nameKey="name"
                layout="vertical" 
              />
            </div>
          </div>
          
          {/* Monthly Trends Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Monthly Request Trends</h2>
            <div className="h-64">
              <ReportChart 
                type="line" 
                data={monthlyData} 
                dataKey="pending,in_progress,completed,total" 
                xAxisKey="month" 
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <ReportExport 
              onExport={handleExport} 
              data={{
                statusData,
                orgData,
                monthlyData
              }}
              filename={`request_report_${format(new Date(), 'yyyy-MM-dd')}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestReports;
