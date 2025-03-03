import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Download,
  Save,
  Plus,
  X,
  Loader2
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Import components
import ReportFilters from '../../components/reports/ReportFilters';
import ChartDisplay from '../../components/reports/ChartDisplay';
import ReportTable from '../../components/reports/ReportTable';
import SavedReportsList from '../../components/reports/SavedReportsList';

const CustomReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [reportType, setReportType] = useState('table');
  const [chartField, setChartField] = useState('status');
  const [reportName, setReportName] = useState('');
  const [savedReports, setSavedReports] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  
  // State for filters and fields
  const [filters, setFilters] = useState({
    dateRange: {
      start: '',
      end: ''
    },
    organization: 'all',
    status: 'all',
    priority: 'all'
  });
  
  const [fields, setFields] = useState([
    { name: 'reference_number', label: 'Reference Number', selected: true },
    { name: 'date_received', label: 'Date Received', selected: true },
    { name: 'sender_name', label: 'Organization', selected: true },
    { name: 'subject', label: 'Subject', selected: true },
    { name: 'status', label: 'Status', selected: true },
    { name: 'priority', label: 'Priority', selected: true },
    { name: 'created_at', label: 'Created Date', selected: false },
    { name: 'completed_at', label: 'Completed Date', selected: false },
    { name: 'turnaround_days', label: 'Turnaround Time (days)', selected: false }
  ]);
  
  // Get selected fields
  const selectedFields = fields.filter(field => field.selected).map(field => field.name);
  
  // Fetch initial data
  useEffect(() => {
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
    
    const fetchSavedReports = async () => {
      try {
        // In a real app, you'd fetch saved reports from the database
        // For now, we'll check local storage
        const savedReportsString = localStorage.getItem('savedCustomReports');
        if (savedReportsString) {
          setSavedReports(JSON.parse(savedReportsString));
        }
      } catch (error) {
        console.error('Error fetching saved reports:', error);
      }
    };
    
    fetchOrganizations();
    fetchSavedReports();
  }, []);
  
  // Generate report based on filters
  const generateReport = async () => {
    try {
      setLoading(true);
      
      // Build query
      let query = supabase
        .from('requests')
        .select(`
          *,
          organizations:sender (name)
        `);
      
      // Apply filters
      if (filters.dateRange.start && filters.dateRange.end) {
        query = query
          .gte('date_received', filters.dateRange.start)
          .lte('date_received', filters.dateRange.end);
      } else if (filters.dateRange.start) {
        query = query.gte('date_received', filters.dateRange.start);
      } else if (filters.dateRange.end) {
        query = query.lte('date_received', filters.dateRange.end);
      }
      
      if (filters.organization !== 'all') {
        query = query.eq('sender', filters.organization);
      }
      
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      
      if (filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process data
      const processedData = data.map(request => {
        // Calculate turnaround time
        let turnaroundDays = null;
        if (request.completed_at && request.created_at) {
          turnaroundDays = Math.round(
            (new Date(request.completed_at) - new Date(request.created_at)) / 
            (1000 * 60 * 60 * 24)
          );
        }
        
        return {
          ...request,
          sender_name: request.organizations?.name || 'Unknown',
          turnaround_days: turnaroundDays
        };
      });
      
      setReportData(processedData);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Save report configuration
  const saveReport = () => {
    if (!reportName.trim()) {
      alert('Please enter a report name');
      return;
    }
    
    const report = {
      id: Date.now().toString(),
      name: reportName,
      filters,
      fields: fields.map(f => ({ ...f })),
      reportType,
      chartField,
      createdAt: new Date().toISOString()
    };
    
    const updatedReports = [...savedReports, report];
    setSavedReports(updatedReports);
    
    // Save to local storage (in a real app, you'd save to database)
    localStorage.setItem('savedCustomReports', JSON.stringify(updatedReports));
    
    setShowSaveModal(false);
    setReportName('');
  };
  
  // Load saved report
  const loadReport = (report) => {
    setFilters(report.filters);
    setFields(report.fields);
    setReportType(report.reportType);
    setChartField(report.chartField);
    
    // Generate report with loaded settings
    generateReport();
  };
  
  // Delete saved report
  const deleteReport = (id) => {
    const updatedReports = savedReports.filter(report => report.id !== id);
    setSavedReports(updatedReports);
    
    // Update local storage
    localStorage.setItem('savedCustomReports', JSON.stringify(updatedReports));
  };
  
  // Export to Excel
  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const exportData = reportData.map(item => {
        const row = {};
        
        // Only include selected fields
        selectedFields.forEach(field => {
          if (field === 'date_received' || field === 'created_at' || field === 'completed_at') {
            row[fields.find(f => f.name === field).label] = item[field] ? 
              format(new Date(item[field]), 'yyyy-MM-dd') : '';
          } else {
            row[fields.find(f => f.name === field).label] = item[field];
          }
        });
        
        return row;
      });
      
      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Custom Report');
      
      // Generate file name
      const fileName = `custom_report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      // Export to file
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export data. Please try again.');
    }
  };
  
  // Toggle field selection
  const toggleField = (fieldName) => {
    setFields(prev => 
      prev.map(field => 
        field.name === fieldName ? 
          { ...field, selected: !field.selected } : 
          field
      )
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Custom Reports
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Build and save custom reports with your own parameters
              </p>
            </div>
            
            <div className="flex gap-2">
              {reportData.length > 0 && (
                <button
                  onClick={exportToExcel}
                  className="flex items-center px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                         hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              )}
              
              {reportData.length > 0 && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg
                         hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Report
                </button>
              )}
            </div>
          </div>
          
          {/* Main content area */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar: Filters and Fields */}
            <div className="lg:col-span-1 space-y-6">
              {/* Saved Reports */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <SavedReportsList
                  savedReports={savedReports}
                  onLoadReport={loadReport}
                  onDeleteReport={deleteReport}
                />
              </motion.div>
              
              {/* Filters */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <ReportFilters
                  filters={filters}
                  organizations={organizations}
                  onFilterChange={setFilters}
                />
              </motion.div>
              
              {/* Fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Report Fields
                </h2>
                
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div key={field.name} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`field-${field.name}`}
                        checked={field.selected}
                        onChange={() => toggleField(field.name)}
                        className="h-4 w-4 text-black dark:text-white border-gray-300 dark:border-gray-700 
                                 rounded focus:ring-black dark:focus:ring-white"
                      />
                      <label
                        htmlFor={`field-${field.name}`}
                        className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        {field.label}
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* Chart Options */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Visualization
                </h2>
                
                <div>
                  <ChartDisplay 
                    reportType={reportType}
                    setReportType={setReportType}
                    chartField={chartField}
                    setChartField={setChartField}
                  />
                </div>
              </motion.div>
              
              {/* Generate Report Button */}
              <div className="flex justify-center">
                <button
                  onClick={generateReport}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                           hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center 
                           justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Main Content Area: Report Results */}
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {reportType === 'table' ? 'Report Results' : 'Report Visualization'}
                </h2>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Generating report...</span>
                  </div>
                ) : reportData.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      No data available. Adjust your filters or generate a report.
                    </p>
                    <button
                      onClick={generateReport}
                      className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                                hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                      Generate Report
                    </button>
                  </div>
                ) : reportType === 'table' ? (
                  <ReportTable 
                    reportData={reportData}
                    fields={fields.filter(f => f.selected)}
                  />
                ) : (
                  <ChartDisplay 
                    reportType={reportType}
                    chartField={chartField}
                    reportData={reportData}
                    isPreview={false}
                  />
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Save Report
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Save this report configuration to access it later.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report Name
              </label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter a name for this report"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveReport}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                         hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
              >
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomReports;
