import { useState } from 'react';
import DateRangePicker from './DateRangePicker';

const ReportFilters = ({ 
  filters = { dateRange: { start: null, end: null }, organization: 'all' },
  onFilterChange,
  organizations = []
}) => {
  const [showFilters, setShowFilters] = useState(true);
  
  // Handle date range changes
  const handleDateRangeChange = (startDate, endDate) => {
    onFilterChange({
      ...filters,
      dateRange: {
        start: startDate,
        end: endDate
      }
    });
  };
  
  // Handle organization filter changes
  const handleOrganizationChange = (value) => {
    onFilterChange({
      ...filters,
      organization: value
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-medium text-gray-900 dark:text-white">Report Filters</h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="text-blue-500 dark:text-blue-400 text-xs"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <DateRangePicker
              startDate={filters.dateRange.start}
              endDate={filters.dateRange.end}
              onChange={handleDateRangeChange}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization
            </label>
            <select
              value={filters.organization}
              onChange={(e) => handleOrganizationChange(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportFilters;
