import { supabase } from '../config/supabase';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

/**
 * Service for handling report data from the database
 */
class ReportService {
  /**
   * Get status distribution of requests within a date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {string} organizationId - Optional organization ID to filter by
   * @returns {Promise<Array>} - Array of status counts
   */
  async getStatusDistribution(startDate, endDate, organizationId = null) {
    try {
      let query = supabase
        .from('v4_requests')
        .select('status, count(*)', { count: 'exact' })
        .gte('date_received', startDate)
        .lte('date_received', endDate)
        .groupBy('status');

      if (organizationId && organizationId !== 'all') {
        query = query.eq('sender', organizationId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Format data for charts
      return data.map(item => ({
        name: this.formatStatus(item.status),
        value: parseInt(item.count),
        color: this.getStatusColor(item.status)
      }));
    } catch (error) {
      console.error('Error fetching status distribution:', error);
      return [];
    }
  }

  /**
   * Get request count by organization
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Array>} - Array of organization counts
   */
  async getRequestsByOrganization(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .rpc('get_requests_by_organization', {
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        // If RPC doesn't exist, fall back to regular query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('v4_requests')
          .select(`
            sender,
            organizations!inner(name),
            count(*)
          `)
          .gte('date_received', startDate)
          .lte('date_received', endDate)
          .groupBy('sender, organizations.name');

        if (fallbackError) throw fallbackError;

        return fallbackData.map((item, index) => ({
          name: item.organizations.name,
          value: parseInt(item.count),
          color: COLORS[index % COLORS.length]
        }));
      }

      return data.map((item, index) => ({
        name: item.organization_name,
        value: parseInt(item.request_count),
        color: COLORS[index % COLORS.length]
      }));
    } catch (error) {
      console.error('Error fetching organization distribution:', error);
      return [];
    }
  }

  /**
   * Get monthly request trends
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {string} organizationId - Optional organization ID to filter by
   * @returns {Promise<Array>} - Array of monthly data
   */
  async getMonthlyTrends(startDate, endDate, organizationId = null) {
    try {
      // This could be a stored procedure in the database
      const { data, error } = await supabase
        .rpc('get_monthly_request_trends', {
          start_date: startDate,
          end_date: endDate,
          org_id: organizationId === 'all' ? null : organizationId
        });

      if (error) {
        // If RPC doesn't exist, fall back to aggregating data in JS
        // This is less efficient but works as a fallback
        const { data: requestData, error: requestError } = await supabase
          .from('v4_requests')
          .select('id, date_received, status')
          .gte('date_received', startDate)
          .lte('date_received', endDate);

        if (requestError) throw requestError;

        // Process data by month and status
        const monthlyData = {};
        
        requestData.forEach(request => {
          const monthKey = format(new Date(request.date_received), 'yyyy-MM');
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
              month: format(new Date(request.date_received), 'MMM yyyy'),
              pending: 0,
              in_progress: 0,
              completed: 0,
              total: 0
            };
          }
          
          monthlyData[monthKey][request.status]++;
          monthlyData[monthKey].total++;
        });
        
        return Object.values(monthlyData).sort((a, b) => {
          const monthA = new Date(a.month);
          const monthB = new Date(b.month);
          return monthA - monthB;
        });
      }

      return data;
    } catch (error) {
      console.error('Error fetching monthly trends:', error);
      return [];
    }
  }

  /**
   * Get average response time data
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {string} groupBy - Field to group by (priority, organization)
   * @returns {Promise<Array>} - Array of response time data
   */
  async getResponseTimeData(startDate, endDate, groupBy = 'priority') {
    try {
      if (groupBy === 'priority') {
        const { data, error } = await supabase
          .from('v4_requests')
          .select('priority, completed_at, created_at')
          .eq('status', 'completed')
          .not('completed_at', 'is', null)
          .gte('date_received', startDate)
          .lte('date_received', endDate);

        if (error) throw error;

        // Group by priority
        const priorityGroups = {};
        
        data.forEach(request => {
          if (!priorityGroups[request.priority]) {
            priorityGroups[request.priority] = [];
          }
          
          const createdDate = new Date(request.created_at);
          const completedDate = new Date(request.completed_at);
          const responseDays = (completedDate - createdDate) / (1000 * 60 * 60 * 24);
          
          priorityGroups[request.priority].push(responseDays);
        });
        
        return Object.entries(priorityGroups).map(([priority, days], index) => {
          const avgDays = days.reduce((sum, day) => sum + day, 0) / days.length;
          
          return {
            name: priority.charAt(0).toUpperCase() + priority.slice(1),
            value: parseFloat(avgDays.toFixed(1)),
            color: PRIORITY_COLORS[priority] || COLORS[index % COLORS.length]
          };
        });
      } else if (groupBy === 'organization') {
        // Implementation for organization grouping
        const { data, error } = await supabase
          .rpc('get_avg_response_time_by_org', {
            start_date: startDate,
            end_date: endDate
          });

        if (error) {
          console.error('RPC error:', error);
          return [];
        }

        return data.map((item, index) => ({
          name: item.organization_name,
          value: parseFloat(item.avg_days.toFixed(1)),
          color: COLORS[index % COLORS.length]
        }));
      }

      return [];
    } catch (error) {
      console.error('Error fetching response time data:', error);
      return [];
    }
  }

  /**
   * Get user activity report data
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Array>} - Array of user activity data
   */
  async getUserActivityData(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .rpc('get_user_activity', {
          start_date: startDate,
          end_date: endDate
        });

      if (error) {
        console.error('RPC error:', error);
        return [];
      }

      return data;
    } catch (error) {
      console.error('Error fetching user activity data:', error);
      return [];
    }
  }

  /**
   * Export report data to Excel
   * @param {Object} reportData - Object containing all report data
   * @param {string} filename - Name for the exported file
   */
  exportToExcel(reportData, filename) {
    try {
      const wb = XLSX.utils.book_new();
      
      // Status distribution sheet
      if (reportData.statusData && reportData.statusData.length > 0) {
        const statusSheet = XLSX.utils.json_to_sheet(
          reportData.statusData.map(item => ({
            Status: item.name,
            Count: item.value
          }))
        );
        XLSX.utils.book_append_sheet(wb, statusSheet, 'Status Distribution');
      }
      
      // Organization distribution sheet
      if (reportData.orgData && reportData.orgData.length > 0) {
        const orgSheet = XLSX.utils.json_to_sheet(
          reportData.orgData.map(item => ({
            Organization: item.name,
            'Request Count': item.value
          }))
        );
        XLSX.utils.book_append_sheet(wb, orgSheet, 'Organizations');
      }
      
      // Monthly trends sheet
      if (reportData.monthlyData && reportData.monthlyData.length > 0) {
        const monthlySheet = XLSX.utils.json_to_sheet(reportData.monthlyData);
        XLSX.utils.book_append_sheet(wb, monthlySheet, 'Monthly Trends');
      }
      
      // Response time sheet
      if (reportData.responseTimeData && reportData.responseTimeData.length > 0) {
        const responseTimeSheet = XLSX.utils.json_to_sheet(
          reportData.responseTimeData.map(item => ({
            Category: item.name,
            'Average Days': item.value
          }))
        );
        XLSX.utils.book_append_sheet(wb, responseTimeSheet, 'Response Times');
      }
      
      // Write file and download
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export data');
    }
  }

  // Helper functions
  formatStatus(status) {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getStatusColor(status) {
    const STATUS_COLORS = {
      'pending': '#FFBB28',
      'in_progress': '#0088FE',
      'completed': '#00C49F'
    };
    return STATUS_COLORS[status] || '#8884d8';
  }
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
const PRIORITY_COLORS = {
  'low': '#82ca9d',
  'normal': '#8884D8',
  'high': '#FF8042',
  'urgent': '#FF0000'
};

export default new ReportService();
