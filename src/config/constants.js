// File Storage Buckets
export const STORAGE_BUCKETS = {
  REQUEST_FILES: 'request-files',
  USER_PROFILES: 'user-profiles',
};

// Request Status Options
export const REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

// Request Status Labels (for display)
export const REQUEST_STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

// Request Priority Options
export const REQUEST_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

// Request Priority Labels (for display)
export const REQUEST_PRIORITY_LABELS = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  PROCESSOR: 'processor',
  ORGANIZATION: 'organization',
  USER: 'user',
};

// User Role Labels (for display)
export const USER_ROLE_LABELS = {
  admin: 'Administrator',
  supervisor: 'Supervisor',
  processor: 'Processor',
  organization: 'Organization',
  user: 'Regular User',
};

// Allowed file types for uploads
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain',
];

// Maximum file size in bytes (20MB)
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

// PDF security options (for secured documents)
export const PDF_SECURITY_OPTIONS = {
  userPassword: null, // No password required to open
  ownerPassword: 'secure-document', // Password for changing permissions
  permissions: {
    printing: 'highResolution',
    modifying: false,
    copying: false,
    annotating: false,
    fillingForms: false,
    contentAccessibility: true,
    documentAssembly: false,
  },
};

// Pagination default values
export const PAGINATION_DEFAULTS = {
  PAGE_SIZE: 10,
  SIBLING_COUNT: 1,
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMMM d, yyyy',
  COMPACT: 'MMM d, yyyy',
  INPUT: 'yyyy-MM-dd',
  WITH_TIME: 'MMMM d, yyyy h:mm a',
  ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
};

// Auto-deletion period in days
export const AUTO_DELETION_DAYS = 90; // 3 months

// API endpoints (for reference)
export const API_ENDPOINTS = {
  REQUESTS: 'requests',
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  REQUEST_FILES: 'request_files',
  COMMENTS: 'comments',
  NOTIFICATIONS: 'notifications',
};

// Notification types
export const NOTIFICATION_TYPES = {
  REQUEST_CREATED: 'request_created',
  REQUEST_ASSIGNED: 'request_assigned',
  REQUEST_COMPLETED: 'request_completed',
  COMMENT_ADDED: 'comment_added',
  FILE_UPLOADED: 'file_uploaded',
  DELETION_REMINDER: 'deletion_reminder',
};

// Default application settings
export const APP_SETTINGS = {
  APP_NAME: 'Document Request System',
  COPYRIGHT_YEAR: new Date().getFullYear(),
  SUPPORT_EMAIL: 'support@example.com',
};

export default {
  STORAGE_BUCKETS,
  REQUEST_STATUS,
  REQUEST_STATUS_LABELS,
  REQUEST_PRIORITIES,
  REQUEST_PRIORITY_LABELS,
  USER_ROLES,
  USER_ROLE_LABELS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  PDF_SECURITY_OPTIONS,
  PAGINATION_DEFAULTS,
  DATE_FORMATS,
  AUTO_DELETION_DAYS,
  API_ENDPOINTS,
  NOTIFICATION_TYPES,
  APP_SETTINGS,
};
