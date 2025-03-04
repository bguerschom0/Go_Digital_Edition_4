import React, { useState } from 'react';
import { Download, FileSpreadsheet, FilePdf, FileText, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const ReportExport = ({
  data,
  filename = 'export',
  formats = ['xlsx', 'csv', 'pdf'],
  buttonType = 'primary', // primary, secondary, outline
  showIcon = true,
  buttonText = 'Export',
  transformData = null, // Optional function to transform data before export
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Format current date for filename
  const currentDate = format(new Date(), 'yyyy-MM-dd');
  
  // Generate actual filename with date
  const getFullFilename = (extension) => `${filename}_${currentDate}.${extension}`;

  // Transform data if needed
  const processData = () => {
    if (typeof transformData === 'function') {
      return transformData(data);
    }
    return data;
  };

  // Export to Excel (XLSX)
  const exportToXLSX = async () => {
    try {
      setLoading(true);
      
      const processedData = processData();
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(processedData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      
      // Write file and trigger download
      XLSX.writeFile(wb, getFullFilename('xlsx'));
    } catch (error) {
      console.error('Error exporting to XLSX:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
      setShowDropdown(false);
      setSelectedFormat(null);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      setLoading(true);
      
      const processedData = processData();
      
      // Create worksheet directly to CSV
      const ws = XLSX.utils.json_to_sheet(processedData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', getFullFilename('csv'));
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
      setShowDropdown(false);
      setSelectedFormat(null);
    }
  };

  // Export to PDF (placeholder - would need PDF library like jsPDF)
  const exportToPDF = async () => {
    try {
      setLoading(true);
      alert('PDF export not implemented yet. Please use XLSX or CSV format.');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
      setShowDropdown(false);
      setSelectedFormat(null);
    }
  };

  // Handle export format selection
  const handleExport = (format) => {
    setSelectedFormat(format);
    
    switch (format) {
      case 'xlsx':
        exportToXLSX();
        break;
      case 'csv':
        exportToCSV();
        break;
      case 'pdf':
        exportToPDF();
        break;
      default:
        break;
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Format display names
  const formatLabels = {
    xlsx: 'Excel (XLSX)',
    csv: 'CSV',
    pdf: 'PDF'
  };

  // Format icons
  const formatIcons = {
    xlsx: <FileSpreadsheet className="h-4 w-4" />,
    csv: <FileText className="h-4 w-4" />,
    pdf: <FilePdf className="h-4 w-4" />
  };

  // Button style variants
  const buttonVariants = {
    primary: 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-100',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    outline: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700'
  };

  // If only one format, don't show dropdown
  if (formats.length === 1) {
    return (
      <button
        onClick={() => handleExport(formats[0])}
        disabled={loading || !data?.length}
        className={`px-4 py-2 rounded-lg ${buttonVariants[buttonType]} transition-colors flex items-center space-x-2 disabled:opacity-50`}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {showIcon && !loading && <Download className="h-4 w-4" />}
        <span>{buttonText}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        disabled={loading || !data?.length}
        className={`px-4 py-2 rounded-lg ${buttonVariants[buttonType]} transition-colors flex items-center space-x-2 disabled:opacity-50`}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {showIcon && !loading && <Download className="h-4 w-4" />}
        <span>{buttonText}</span>
      </button>
      
      {showDropdown && (
        <div className="absolute z-10 mt-2 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="py-1">
            {formats.map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                disabled={loading}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                {formatIcons[format]}
                <span>{formatLabels[format]}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportExport;
