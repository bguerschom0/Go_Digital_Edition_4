import React, { useState, useEffect } from 'react';
import { Loader2, X, ChevronLeft, ChevronRight, Download, Lock } from 'lucide-react';
import { supabase } from '../../config/supabase';

const DocumentViewer = ({ filePath, fileName, fileType, isSecured, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true);
        
        // Get file from Supabase storage
        const { data, error } = await supabase.storage
          .from('request-files')
          .download(filePath);
          
        if (error) throw error;
        
        // Create a URL for the file
        const url = URL.createObjectURL(data);
        setFileUrl(url);
        
        // Clean up URL when component unmounts
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('Error loading file:', err);
        setError('Failed to load file. Please try downloading instead.');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [filePath]);

  // Handle PDF page navigation
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Handle iframe load event for PDFs to get total pages
  const handleIframeLoad = () => {
    if (fileType === 'application/pdf') {
      // Try to get total pages through iframe messaging (if possible)
      const iframe = document.querySelector('#pdf-viewer');
      if (iframe && iframe.contentWindow) {
        // This is a simplified approach - actual page count detection would require PDF.js integration
        // or similar, which is beyond this example's scope
        setTotalPages(1);
      }
    }
  };

  // Download file
  const handleDownload = async () => {
    try {
      // Create a link and click it
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Failed to download the file. Please try again.');
    }
  };

  // Render content based on file type
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading document...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 p-4 rounded-lg max-w-md text-center">
            <p>{error}</p>
            <button
              onClick={handleDownload}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Downloading Instead
            </button>
          </div>
        </div>
      );
    }

    if (fileType === 'application/pdf') {
      return (
        <div className="flex flex-col h-full">
          <div className="bg-gray-100 dark:bg-gray-700 p-2 flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="mx-2 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center">
              {isSecured && (
                <div className="flex items-center mr-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Secured
                </div>
              )}
              <button
                onClick={handleDownload}
                className="flex items-center p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-800 overflow-auto">
            <iframe
              id="pdf-viewer"
              src={`${fileUrl}#page=${currentPage}`}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              title="PDF Viewer"
            />
          </div>
        </div>
      );
    } else if (fileType.startsWith('image/')) {
      return (
        <div className="flex flex-col h-full">
          <div className="bg-gray-100 dark:bg-gray-700 p-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {fileName}
            </span>
            <button
              onClick={handleDownload}
              className="flex items-center p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-auto">
            <img
              src={fileUrl}
              alt={fileName}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      );
    } else {
      // For other file types, just show download option
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-center p-6 max-w-md">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This file type cannot be previewed directly. Please download the file to view it.
            </p>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                       hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center mx-auto"
            >
              <Download className="h-5 w-5 mr-2" />
              Download {fileName}
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {fileName}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
