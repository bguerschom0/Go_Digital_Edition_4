import { supabase } from '../config/supabase';
import { isPdfFile, applyPdfSecurity } from './pdfSecurityService';

/**
 * Upload a file to Supabase storage
 * 
 * @param {File} file - The file to upload
 * @param {string} requestId - The request ID
 * @param {boolean} isSecured - Whether to apply security features
 * @param {boolean} isResponse - Whether this is a response file
 * @param {string} userId - The ID of the user uploading the file
 * @returns {Promise<{filePath: string, error: Error|null}>} - The file path and any error
 */
export const uploadFile = async (file, requestId, isSecured = false, isResponse = false, userId) => {
  try {
    // Apply security to PDF files if needed
    let fileToUpload = file;
    let secured = false;
    
    if (isPdfFile(file) && isSecured) {
      try {
        fileToUpload = await applyPdfSecurity(file);
        secured = true;
      } catch (error) {
        console.error('Error applying PDF security:', error);
        // Continue with original file if security application fails
      }
    }
    
    // Generate file path
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const sanitizedName = file.name.split('.')[0].replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${sanitizedName}-${timestamp}.${fileExt}`;
    const filePath = `requests/${requestId}/${fileName}`;
    
    // Upload file to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('request-files')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) throw uploadError;
    
    // Record file metadata in database
    const { error: metadataError } = await supabase
      .from('request_files')
      .insert([
        {
          request_id: requestId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          is_secured: secured,
          is_original_request: !isResponse,
          is_response: isResponse,
          uploaded_by: userId
        },
      ]);
      
    if (metadataError) throw metadataError;
    
    return { filePath, error: null };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { filePath: null, error };
  }
};

/**
 * Download a file from Supabase storage
 * 
 * @param {string} filePath - The path to the file in storage
 * @param {string} fileName - The name to save the file as
 * @returns {Promise<{success: boolean, error: Error|null}>} - Whether the download was successful
 */
export const downloadFile = async (filePath, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from('request-files')
      .download(filePath);
      
    if (error) throw error;
    
    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error downloading file:', error);
    return { success: false, error };
  }
};

/**
 * Delete a file from Supabase storage
 * 
 * @param {string} filePath - The path to the file in storage
 * @param {string} fileId - The ID of the file in the database
 * @returns {Promise<{success: boolean, error: Error|null}>} - Whether the deletion was successful
 */
export const deleteFile = async (filePath, fileId) => {
  try {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('request-files')
      .remove([filePath]);
      
    if (storageError) throw storageError;
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('request_files')
      .delete()
      .eq('id', fileId);
      
    if (dbError) throw dbError;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error };
  }
};

/**
 * Get a public URL for a file
 * 
 * @param {string} filePath - The path to the file in storage
 * @returns {Promise<{url: string|null, error: Error|null}>} - The public URL
 */
export const getFileUrl = async (filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from('request-files')
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
      
    if (error) throw error;
    
    return { url: data.signedUrl, error: null };
  } catch (error) {
    console.error('Error getting file URL:', error);
    return { url: null, error };
  }
};

/**
 * Get all files for a request
 * 
 * @param {string} requestId - The request ID
 * @returns {Promise<{files: Array, error: Error|null}>} - The files
 */
export const getRequestFiles = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('request_files')
      .select(`
        *,
        uploaded_by_user:uploaded_by (full_name, username)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return { files: data || [], error: null };
  } catch (error) {
    console.error('Error getting request files:', error);
    return { files: [], error };
  }
};

/**
 * Check if any files exist for a request
 * 
 * @param {string} requestId - The request ID
 * @returns {Promise<{exists: boolean, count: number, error: Error|null}>} - Whether files exist and count
 */
export const checkFilesExist = async (requestId) => {
  try {
    const { count, error } = await supabase
      .from('request_files')
      .select('*', { count: 'exact' })
      .eq('request_id', requestId);
      
    if (error) throw error;
    
    return { exists: count > 0, count, error: null };
  } catch (error) {
    console.error('Error checking files exist:', error);
    return { exists: false, count: 0, error };
  }
};
