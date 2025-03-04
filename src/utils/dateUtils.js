import { 
  format, 
  formatDistanceToNow, 
  formatDistance, 
  isValid, 
  parseISO, 
  differenceInDays,
  addDays,
  addMonths,
  isAfter,
  isBefore,
  endOfDay,
  startOfDay,
  isEqual,
  startOfMonth,
  endOfMonth
} from 'date-fns';

import { DATE_FORMATS } from '../config/constants';

/**
 * Format a date for display
 * @param {Date|string} date - Date to format
 * @param {string} formatString - Format string to use (from date-fns)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatString = DATE_FORMATS.DISPLAY) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return 'Invalid Date';
  
  return format(dateObj, formatString);
};

/**
 * Format a date as relative time (e.g., "2 days ago")
 * @param {Date|string} date - Date to format
 * @param {boolean} addSuffix - Whether to add suffix (ago/from now)
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date, addSuffix = true) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return 'Invalid Date';
  
  return formatDistanceToNow(dateObj, { addSuffix });
};

/**
 * Calculate duration between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {string} Duration string
 */
export const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  if (!isValid(start) || !isValid(end)) return 'Invalid Date';
  
  return formatDistance(start, end);
};

/**
 * Calculate days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} Number of days
 */
export const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  if (!isValid(start) || !isValid(end)) return 0;
  
  return Math.abs(differenceInDays(end, start));
};

/**
 * Calculate deletion date (3 months from completion date)
 * @param {Date|string} completionDate - Completion date
 * @returns {Date} Deletion date
 */
export const calculateDeletionDate = (completionDate) => {
  if (!completionDate) return null;
  
  const date = typeof completionDate === 'string' ? parseISO(completionDate) : completionDate;
  
  if (!isValid(date)) return null;
  
  return addMonths(date, 3);
};

/**
 * Check if a date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return false;
  
  return isBefore(dateObj, new Date());
};

/**
 * Check if a date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (date) => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return false;
  
  return isAfter(dateObj, new Date());
};

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  
  if (!isValid(dateObj)) return false;
  
  const today = new Date();
  
  return isAfter(dateObj, startOfDay(today)) && isBefore(dateObj, endOfDay(today));
};

/**
 * Format a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {string} formatString - Format string for individual dates
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate, formatString = DATE_FORMATS.COMPACT) => {
  if (!startDate || !endDate) return '';
  
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  if (!isValid(start) || !isValid(end)) return 'Invalid Date Range';
  
  return `${format(start, formatString)} - ${format(end, formatString)}`;
};

/**
 * Get the start and end dates for the current month
 * @returns {Object} Object with start and end dates
 */
export const getCurrentMonthDateRange = () => {
  const now = new Date();
  return {
    start: startOfMonth(now),
    end: endOfMonth(now)
  };
};

/**
 * Format a date string from API format to display format
 * @param {string} dateString - Date string in API format (ISO)
 * @returns {string} Formatted date string
 */
export const formatApiDate = (dateString) => {
  if (!dateString) return '';
  
  return formatDate(dateString, DATE_FORMATS.DISPLAY);
};

export default {
  formatDate,
  formatRelativeTime,
  calculateDuration,
  calculateDays,
  calculateDeletionDate,
  isPastDate,
  isFutureDate,
  isToday,
  formatDateRange,
  getCurrentMonthDateRange,
  formatApiDate
};
