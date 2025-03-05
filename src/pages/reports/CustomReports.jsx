import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings,
  Save,
  PlayCircle,
  Filter,
  Download,
  Trash2,
  Edit,
  Plus,
  Loader2
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import  useReports  from '../../hooks/useReports';
import ReportFilters from '../../components/reports/ReportFilters';
import ReportTable from '../../components/reports/ReportTable';
import ReportChart from '../../components/reports/ReportChart';
import ReportExport from '../../components/reports/ReportExport';
import { format, subMonths } from 'date-fns';

const CustomReports = () => {
  const { user } = useAuth();
  const { 
    runCustomReport, 
    saveCustomReport, 
    deleteCustomReport,
    getUserSavedReports 
  } = useReports();
  
  // Default to last 6 months
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [organizations, setOrganizations] = useState([]);
  const [savedReports, setSavedReports] = useState([]);
  const [reportName, setReportName] = useState('');
  const [reportConfig, setReportConfig] = useState({
    organizationId: 'all',
    status: 'all',
    priority: 'all',
    groupBy: 'status',
    chartType: 'pie'
  });
  
  const [reportResults, setReportResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch organizations for filter
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
      }
    };
    
    // Fetch user's saved reports
    const fetchSavedReports = async () => {
      try {
        const reports = await getUserSavedReports(user.id);
        setSavedReports(reports);
      } catch (err) {
        console.error('Error fetching saved reports:', err);
      }
    };
    
    fetchOrganizations();
    fetchSavedReports();
  }, [user.id, getUserSavedReports]);
  
  const handleConfigChange = (key, value) => {
    setReportConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleRunReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await runCustomReport({
        ...reportConfig,
        dateRange
      });
      
      setReportResults(results);
    } catch (err) {
      console.error('Error running report:', err);
      setError('Failed to run report. Please check your configuration and try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveReport = async () => {
    if (!reportName.trim()) {
      setError('Please enter a report name');
      return;
    }
    
    setSaveLoading(true);
    
    try {
      await saveCustomReport({
        name: reportName,
        config: {
          ...reportConfig,
          dateRange
        },
        userId: user.id
      });
      
      // Refresh saved reports list
      const reports = await getUserSavedReports(user.id);
      setSavedReports(reports);
      
      setReportName('');
    } catch (err) {
      console.error('Error saving report:', err);
      setError('Failed to save report. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };
  
  const handleLoadReport = (report) => {
    setReportConfig(report.config);
    if (report.config.dateRange) {
      setDateRange(report.config.dateRange);
    }
    handleRunReport();
  };
  
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this saved report?')) {
      return;
    }
    
    try {
      await deleteCustomReport(reportId);
      
      // Refresh saved reports list
      const reports = await getUserSavedReports(user.id);
      setSavedReports(reports);
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report. Please try again.');
    }
  };
  
  const handleExport = (format) => {
    if (!reportResults) return;
    
    const filename = `custom_report_${format(new Date(), 'yyyy-MM-dd')}`;
    
    // Export using the ReportExport component function
    ReportExport.exportData({
      data: reportResults,
      filename,
      format
    });
  };
  
  // Get appropriate chart based on groupBy
  const getChartData = () => {
    if (!reportResults || !reportResults.data) return [];
    
    return reportResults.data.map(item => ({
      name: item.label,
      value: item.value,
      color: item.color
    }));
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Custom Reports
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and run custom reports on your request data
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Saved Reports */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Save className="h-5 w-5 mr-2" />
                Saved Reports
              </h2>
              
              {savedReports.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  You don't have any saved reports yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {savedReports.map(report => (
                    <li key={report.id} className="border dark:border-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {report.name}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleLoadReport(report)}
                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            title="Run report"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReport(report.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400"
                            title="Delete report"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Created: {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
            
            {/* Report Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Report Configuration
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization
                  </label>
                  <select
                    value={reportConfig.organizationId}
                    onChange={(e) => handleConfigChange('organizationId', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Organizations</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={reportConfig.status}
                    onChange={(e) => handleConfigChange('status', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={reportConfig.priority}
                    onChange={(e) => handleConfigChange('priority', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group By
                  </label>
                  <select
                    value={reportConfig.groupBy}
                    onChange={(e) => handleConfigChange('groupBy', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="organization">Organization</option>
                    <option value="month">Month</option>
                    <option value="assigned_to">Assigned User</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Chart Type
                  </label>
                  <select
                    value={reportConfig.chartType}
                    onChange={(e) => handleConfigChange('chartType', e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="pie">Pie Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart (time-based only)</option>
                  </select>
                </div>
                
                <button
                  onClick={handleRunReport}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg
                           hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Run Report
                    </>
                  )}
                </button>
              </div>
            </motion.div>
            
            {/* Save Report */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Save className="h-5 w-5 mr-2" />
                Save Report
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter a name for this report"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <button
                  onClick={handleSaveReport}
                  disabled={saveLoading || !reportResults}
                  className="w-full py-2 px-4 bg-black dark:bg-white text-white dark:text-black rounded-lg
                           hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center
                           disabled:opacity-50"
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Report
                    </>
                  )}
                </button>
                
                {error && (
                  <p className="text-red-500 text-sm mt-2">
                    {error}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
          
          {/* Results Panel */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 h-full"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Report Results
                </h2>
                
                {reportResults && (
                  <button
                    onClick={() => handleExport('excel')}
                    className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg
                             hover:bg-green-700 transition-colors text-sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </button>
                )}
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : !reportResults ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                  <Filter className="h-12 w-12 mb-4" />
                  <p className="text-lg">Configure and run a report to see results</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Chart visualization */}
                  <div className="h-64 mb-6">
                    <ReportChart 
                      type={reportConfig.chartType}
                      data={getChartData()}
                      dataKey="value"
                      nameKey="name"
                      layout={reportConfig.chartType === 'bar' ? 'vertical' : undefined}
                    />
                  </div>
                  
                  {/* Data table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            {reportConfig.groupBy === 'month' ? 'Month' : 'Category'}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {reportResults.data.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {item.label}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {item.value}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {((item.value / reportResults.total) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                            Total
                          </td>
                          <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                            {reportResults.total}
                          </td>
                          <td className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300">
                            100%
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomReports;
