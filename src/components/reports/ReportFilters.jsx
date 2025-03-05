import { useState } from 'react';
import DateRangePicker from './DateRangePicker';

const ReportFilters = ({ 
  dateRange, 
  onDateRangeChange, 
  organizationFilter, 
  onOrganizationFilterChange,
  organizations,
  showAdditionalFilters = false
}) => {
  const [showFilters, setShowFilters] = useState(true);
  
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Report Filters</h2>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="text-blue-500 text-sm"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
      
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <DateRangePicker
              startDate={dateRange.start}
              endDate={dateRange.end}
              onChange={onDateRangeChange}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization
            </label>
            <select
              value={organizationFilter}
              onChange={(e) => onOrganizationFilterChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
          
          {/* Additional filters can be shown conditionally */}
          {showAdditionalFilters && (
            <>
              {/* Status filter, priority filter, etc. */}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportFilters;
