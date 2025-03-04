import { supabase } from '../config/supabase';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, STORAGE_BUCKETS } from '../config/constants';
import { applyPdfSecurity } from '../services/pdfSecurityService';

/**
 * Check if a file type is allowed for upload
 * @param {string} fileType - File MIME type
 * @returns {boolean} True if file type is allowed
 */
export const isAllowedFileType = (fileType) => {
  return ALLOWED_FILE_TYPES.includes(fileType);
};

/**
 * Check if a file size is within limits
 * @param {number} fileSize - File size in bytes
 * @returns {boolean} True if file size is within limits
 */
export const isValidFileSize = (fileSize) => {
  return fileSize > 0 && fileSize <= MAX_FILE_SIZE;
};

/**
 * Generate a unique file name for storage
 * @param {string} originalName - Original file name
 * @returns {string} Unique file name
 */
export const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = originalName.split('.').pop();
  
  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * Get file extension from file name
 * @param {string} fileName - File name
 * @returns {string} File extension
 */
export const getFileExtension = (fileName) => {
  return fileName.split('.').pop().toLowerCase();
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Get file icon name based on file type
 * @param {string} fileType - File MIME type
 * @returns {string} Icon name
 */
export const getFileIconByType = (fileType) => {
  if (!fileType) return 'file';
  
  if (fileType.includes('pdf')) {
    return 'file-text';
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return 'file-text';
  } else if (fileType.includes('excel') || fileType.includes('sheet')) {
    return 'file-spreadsheet';
  } else if (fileType.includes('image')) {
    return 'image';
  } else if (fileType.includes('text')) {
    return 'file-text';
  } else {
    return 'file';
  }
};

/**
 * Upload a file to Supabase storage
 * @param {File} file - File to upload
 * @param {string} path - Storage path
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload result
 */
export const uploadFile = async (file, path, options = {}) => {
  const { securePdf = false, bucket = STORAGE_BUCKETS.REQUEST_FILES } = options;
  
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (!isAllowedFileType(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
    
    if (!isValidFileSize(file.size)) {
      throw new Error(`File size exceeds maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`);
    }
    
    // Apply PDF security if needed
    let fileToUpload = file;
    let isSecured = false;
    
    if (securePdf && file.type === 'application/pdf') {
      fileToUpload = await applyPdfSecurity(file);
      isSecured = true;
    }
    
    // Generate file path if not provided
    const filePath = path || `${generateUniqueFileName(file.name)}`;
    
    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) throw error;
    
    return { 
      data, 
      filePath, 
      isSecured
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Download a file from Supabase storage
 * @param {string} path - Storage path
 * @param {string} downloadName - File name for download
 * @param {string} bucket - Storage bucket
 * @returns {Promise<boolean>} True if download successful
 */
export const downloadFile = async (path, downloadName, bucket = STORAGE_BUCKETS.REQUEST_FILES) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);
      
    if (error) throw error;
    
    // Create download link
    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadName || path.split('/').pop();
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    link.remove();
    
    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    return false;
  }
};

/**
 * Get file URL from Supabase storage
 * @param {string} path - Storage path
 * @param {string} bucket - Storage bucket
 * @returns {string} File URL
 */
export const getFileUrl = (path, bucket = STORAGE_BUCKETS.REQUEST_FILES) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
};

/**
 * Delete a file from Supabase storage
 * @param {string} path - Storage path
 * @param {string} bucket - Storage bucket
 * @returns {Promise<boolean>} True if deletion successful
 */
export const deleteFile = async (path, bucket = STORAGE_BUCKETS.REQUEST_FILES) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

export default {
  isAllowedFileType,
  isValidFileSize,
  generateUniqueFileName,
  getFileExtension,
  formatFileSize,
  getFileIconByType,
  uploadFile,
  downloadFile,
  getFileUrl,
  deleteFile
};
