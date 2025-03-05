import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ReportExport = ({ 
  data, 
  filename = 'report', 
  title = 'Export Report',
  exportableSheets = null,
  includeCharts = true
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Check the export target container
  const checkTargetContainer = () => {
    if (includeCharts) {
      const container = document.getElementById('report-export-container');
      if (!container) {
        console.warn('Report export container not found. Add id="report-export-container" to your report container div.');
      }
      return container;
    }
    return null;
  };
  
  // Export to Excel
  const exportToExcel = () => {
    if (!data) return;
    
    setExporting(true);
    
    try {
      const wb = XLSX.utils.book_new();
      
      // If exportableSheets is provided, use that structure
      if (exportableSheets && Array.isArray(exportableSheets)) {
        exportableSheets.forEach(sheet => {
          if (!sheet.data || !sheet.name) return;
          
          const ws = XLSX.utils.json_to_sheet(sheet.data);
          XLSX.utils.book_append_sheet(wb, ws, sheet.name);
        });
      } else {
        // Otherwise, create sheets from the data object
        Object.entries(data).forEach(([key, value]) => {
          if (!value || !Array.isArray(value)) return;
          
          const ws = XLSX.utils.json_to_sheet(value);
          XLSX.utils.book_append_sheet(wb, ws, key);
        });
      }
      
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    } finally {
      setExporting(false);
      setShowDropdown(false);
    }
  };
  
  // Export to CSV
  const exportToCSV = () => {
    if (!data) return;
    
    setExporting(true);
    
    try {
      // If data is an array, export that directly
      if (Array.isArray(data)) {
        const ws = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws);
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } 
      // If data is an object with multiple datasets, export the first one
      else if (typeof data === 'object') {
        let firstArray = null;
        
        // Find the first array in the data object
        for (const key in data) {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            firstArray = data[key];
            break;
          }
        }
        
        if (firstArray) {
          const ws = XLSX.utils.json_to_sheet(firstArray);
          const csv = XLSX.utils.sheet_to_csv(ws);
          
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          
          link.setAttribute('href', url);
          link.setAttribute('download', `${filename}.csv`);
          link.style.visibility = 'hidden';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          console.error('No valid data array found for CSV export');
        }
      }
    } catch (error) {
      console.error('Error exporting to CSV:', error);
    } finally {
      setExporting(false);
      setShowDropdown(false);
    }
  };
  
  // Export to PDF
  const exportToPDF = async () => {
    const container = checkTargetContainer();
    if (!container && includeCharts) {
      console.error('No valid container found for PDF export');
      return;
    }
    
    setExporting(true);
    
    try {
      if (includeCharts && container) {
        // Capture the charts as an image
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        
        // Calculate PDF dimensions
        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        pdf.text(title, 105, 15, { align: 'center' });
        pdf.addImage(imgData, 'PNG', 10, 25, pdfWidth - 20, pdfHeight - 20);
        pdf.save(`${filename}.pdf`);
      } else {
        // Create a simple text-based PDF if no charts
        const pdf = new jsPDF();
        pdf.text(title, 105, 15, { align: 'center' });
        
        let yPosition = 30;
        
        // Add tables for each data set
        if (typeof data === 'object' && !Array.isArray(data)) {
          for (const [key, value] of Object.entries(data)) {
            if (Array.isArray(value) && value.length > 0) {
              pdf.text(key, 20, yPosition);
              yPosition += 10;
              
              // Convert array to table data
              const headers = Object.keys(value[0]);
              const tableData = value.map(item => Object.values(item));
              
              // Add the table
              pdf.autoTable({
                head: [headers],
                body: tableData,
                startY: yPosition,
                margin: { top: 15 },
                styles: { overflow: 'linebreak' },
                headStyles: { fillColor: [66, 139, 202] }
              });
              
              // Update Y position after table
              yPosition = pdf.previousAutoTable.finalY + 15;
              
              // Add new page if needed
              if (yPosition > 250) {
                pdf.addPage();
                yPosition = 20;
              }
            }
          }
        } else if (Array.isArray(data)) {
          // Handle case where data is directly an array
          if (data.length > 0) {
            const headers = Object.keys(data[0]);
            const tableData = data.map(item => Object.values(item));
            
            pdf.autoTable({
              head: [headers],
              body: tableData,
              startY: yPosition,
              margin: { top: 15 },
              styles: { overflow: 'linebreak' },
              headStyles: { fillColor: [66, 139, 202] }
            });
          }
        }
        
        pdf.save(`${filename}.pdf`);
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
    } finally {
      setExporting(false);
      setShowDropdown(false);
    }
  };
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={exporting}
        className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        <span>Export</span>
        <ChevronDown className={`h-4 w-4 transform transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-100 dark:border-gray-700 py-1">
          <button
            onClick={exportToExcel}
            disabled={exporting}
            className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export to Excel
          </button>
          <button
            onClick={exportToCSV}
            disabled={exporting}
            className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export to CSV
          </button>
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export to PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportExport;
