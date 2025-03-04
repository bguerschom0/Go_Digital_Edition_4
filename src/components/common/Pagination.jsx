import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  pageSize = 10,
  totalItems = 0,
  siblingCount = 1,
  onChange,
  className = '',
}) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null;

  // Generate page numbers array
  const getPageNumbers = () => {
    const totalPageNumbers = siblingCount * 2 + 3; // siblings + current + first + last
    
    // If we have enough space to show all pages
    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Calculate left and right sibling indexes
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
    
    // Show dots only when there's more than 1 page number hidden
    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;
    
    // Case 1: No left dots, but right dots
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 1 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }
    
    // Case 2: No right dots, but left dots
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 1 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, '...', ...rightRange];
    }
    
    // Case 3: Both left and right dots
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [1, '...', ...middleRange, '...', totalPages];
    }
  };

  // Page numbers array
  const pageNumbers = getPageNumbers();
  
  // Calculate the range of items being displayed
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(startItem + pageSize - 1, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between ${className}`}>
      {/* Page info */}
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-4 sm:mb-0">
        Showing <span className="font-medium">{totalItems > 0 ? startItem : 0}</span> to{' '}
        <span className="font-medium">{endItem}</span> of{' '}
        <span className="font-medium">{totalItems}</span> results
      </div>
      
      {/* Page navigation */}
      <nav className="flex items-center space-x-1">
        {/* Previous page button */}
        <button
          onClick={() => onChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        {/* Page numbers */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500 dark:text-gray-400">
                ...
              </span>
            );
          }
          
          return (
            <button
              key={page}
              onClick={() => onChange(page)}
              aria-current={currentPage === page ? 'page' : undefined}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                currentPage === page
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {page}
            </button>
          );
        })}
        
        {/* Next page button */}
        <button
          onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
