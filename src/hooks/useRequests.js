import { useState, useEffect } from 'react';
import reportService from '../services/reportService';
import { subMonths, format } from 'date-fns';

/**
 * Custom hook for fetching and manipulating report data
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} - Report data and functions
 */
const useReports = (initialFilters = {}) => {
  // Default filters - last 6 months, all organizations
  const defaultFilters = {
    dateRange: {
      start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd')
    },
    organization: 'all',
    groupBy: 'status',
    reportType: 'requests'
  };

  // Merge default filters with provided initial filters
  const mergedFilters = { ...defaultFilters, ...initialFilters };
  
  const [filters, setFilters] = useState(mergedFilters);
  const [statusData, setStatusData] = useState([]);
  const [orgData, setOrgData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [responseTimeData, setResponseTimeData] = useState([]);
  const [userActivityData, setUserActivityData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch report data based on current filters
   */
  const fetchReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { dateRange, organization, groupBy, reportType } = filters;
      
      // Status distribution
      const statusDistribution = await reportService.getStatusDistribution(
        dateRange.start,
        dateRange.end,
        organization
      );
      setStatusData(statusDistribution);
      
      // Organization distribution
      const orgDistribution = await reportService.getRequestsByOrganization(
        dateRange.start,
        dateRange.end
      );
      setOrgData(orgDistribution);
      
      // Monthly trends
      const trends = await reportService.getMonthlyTrends(
        dateRange.start,
        dateRange.end,
        organization
      );
      setMonthlyData(trends);
      
      // Only fetch response time data for performance reports
      if (reportType === 'performance') {
        const responseTime = await reportService.getResponseTimeData(
          dateRange.start,
          dateRange.end,
          groupBy
        );
        setResponseTimeData(responseTime);
        
        const userActivity = await reportService.getUserActivityData(
          dateRange.start,
          dateRange.end
        );
        setUserActivityData(userActivity);
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to fetch report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update a single filter value
   * @param {string} key - Filter key to update
   * @param {any} value - New filter value
   */
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  /**
   * Update date range filter
   * @param {Object} dateRange - Object with start and end dates
   */
  const updateDateRange = (dateRange) => {
    setFilters(prev => ({
      ...prev,
      dateRange
    }));
  };

  /**
   * Reset filters to default values
   */
  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  /**
   * Export report data to Excel
   * @param {string} filename - Base filename without extension
   */
  const exportToExcel = (filename = 'report') => {
    try {
      const reportData = {
        statusData,
        orgData,
        monthlyData,
        responseTimeData,
        userActivityData
      };
      
      reportService.exportToExcel(reportData, filename);
    } catch (err) {
      setError('Failed to export data. Please try again.');
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchReportData();
  }, [filters]);

  return {
    // Data
    statusData,
    orgData,
    monthlyData,
    responseTimeData,
    userActivityData,
    
    // State
    loading,
    error,
    filters,
    
    // Actions
    updateFilter,
    updateDateRange,
    resetFilters,
    refreshData: fetchReportData,
    exportToExcel
  };
};

export default useReports;
