import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { format, subMonths, subWeeks, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

const DateRangePicker = ({ startDate, endDate, onChange }) => {
  const [localStartDate, setLocalStartDate] = useState(startDate || format(new Date(), 'yyyy-MM-dd'));
  const [localEndDate, setLocalEndDate] = useState(endDate || format(new Date(), 'yyyy-MM-dd'));
  const [preset, setPreset] = useState('custom');

  // Update local state when props change
  useEffect(() => {
    if (startDate) setLocalStartDate(startDate);
    if (endDate) setLocalEndDate(endDate);
  }, [startDate, endDate]);

  // Handle date changes from inputs
  const handleStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setLocalStartDate(newStartDate);
    setPreset('custom');
    
    // Only update parent component if both dates are valid
    if (newStartDate && localEndDate) {
      onChange({ start: newStartDate, end: localEndDate });
    }
  };

  const handleEndDateChange = (e) => {
    const newEndDate = e.target.value;
    setLocalEndDate(newEndDate);
    setPreset('custom');
    
    // Only update parent component if both dates are valid
    if (localStartDate && newEndDate) {
      onChange({ start: localStartDate, end: newEndDate });
    }
  };

  // Apply preset date ranges
  const applyPreset = (presetName) => {
    const now = new Date();
    let newStart, newEnd;

    switch (presetName) {
      case 'today':
        newStart = format(now, 'yyyy-MM-dd');
        newEnd = format(now, 'yyyy-MM-dd');
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        newStart = format(yesterday, 'yyyy-MM-dd');
        newEnd = format(yesterday, 'yyyy-MM-dd');
        break;
      case 'last7days':
        newStart = format(subWeeks(now, 1), 'yyyy-MM-dd');
        newEnd = format(now, 'yyyy-MM-dd');
        break;
      case 'last30days':
        newStart = format(subMonths(now, 1), 'yyyy-MM-dd');
        newEnd = format(now, 'yyyy-MM-dd');
        break;
      case 'thisMonth':
        newStart = format(startOfMonth(now), 'yyyy-MM-dd');
        newEnd = format(endOfMonth(now), 'yyyy-MM-dd');
        break;
      case 'lastMonth': {
        const lastMonth = subMonths(now, 1);
        newStart = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        newEnd = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        break;
      }
      case 'thisWeek':
        newStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        newEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'last3months':
        newStart = format(subMonths(now, 3), 'yyyy-MM-dd');
        newEnd = format(now, 'yyyy-MM-dd');
        break;
      case 'last6months':
        newStart = format(subMonths(now, 6), 'yyyy-MM-dd');
        newEnd = format(now, 'yyyy-MM-dd');
        break;
      default:
        return;
    }

    setLocalStartDate(newStart);
    setLocalEndDate(newEnd);
    setPreset(presetName);
    onChange({ start: newStart, end: newEnd });
  };

  // Format date for display in preset buttons
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={localStartDate}
              onChange={handleStartDateChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={localEndDate}
              onChange={handleEndDateChange}
              min={localStartDate}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => applyPreset('today')}
          className={`px-2 py-1 text-xs rounded-md ${
            preset === 'today'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => applyPreset('yesterday')}
          className={`px-2 py-1 text-xs rounded-md ${
            preset === 'yesterday'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Yesterday
        </button>
        <button
          type="button"
          onClick={() => applyPreset('last7days')}
          className={`px-2 py-1 text-xs rounded-md ${
            preset === 'last7days'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Last 7 Days
        </button>
        <button
          type="button"
          onClick={() => applyPreset('last30days')}
          className={`px-2 py-1 text-xs rounded-md ${
            preset === 'last30days'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Last 30 Days
        </button>
        <button
          type="button"
          onClick={() => applyPreset('thisMonth')}
          className={`px-2 py-1 text-xs rounded-md ${
            preset === 'thisMonth'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          This Month
        </button>
        <button
          type="button"
          onClick={() => applyPreset('lastMonth')}
          className={`px-2 py-1 text-xs rounded-md ${
            preset === 'lastMonth'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Last Month
        </button>
        <button
          type="button"
          onClick={() => applyPreset('last3months')}
          className={`px-2 py-1 text-xs rounded-md ${
            preset === 'last3months'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Last 3 Months
        </button>
        <button
          type="button"
          onClick={() => applyPreset('last6months')}
          className={`px-2 py-1 text-xs rounded-md ${
            preset === 'last6months'
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          Last 6 Months
        </button>
      </div>
      
      {preset !== 'custom' && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {formatDisplayDate(localStartDate)} - {formatDisplayDate(localEndDate)}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
