import { supabase } from '../config/supabase';
import { applyPdfSecurity, isPdfFile } from './pdfSecurityService';

/**
 * Upload a file related to a request
 * 
 * @param {File} file - The file to upload
 * @param {string} requestId - The ID of the request
 * @param {boolean} isResponse - Whether this is a response file
 * @param {string} userId - The ID of the user uploading the file
 * @returns {Promise<Object>} - The uploaded file metadata
 */
export const uploadRequestFile = async (file, requestId, isResponse, userId) => {
  try {
    let fileToUpload = file;
    let isSecured = false;
    
    // Apply security to PDF files that are responses
    if (isPdfFile(file) && isResponse) {
      fileToUpload = await applyPdfSecurity(file);
      isSecured = true;
    }
    
    // Generate file path
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${file.name.split('.')[0]}-${timestamp}.${fileExt}`;
    const filePath = `requests/${requestId}/${fileName}`;
    
    // Upload file to Supabase storage
    const { error: uploadError, data } = await supabase.storage
      .from('request-files')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) throw uploadError;
    
    // Record file metadata in database
    const { error: metadataError, data: fileData } = await supabase
      .from('v4_request_files')
      .insert([
        {
          request_id: requestId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          is_secured: isSecured,
          is_original_request: !isResponse,
          is_response: isResponse,
          uploaded_by: userId
        },
      ])
      .select()
      .single();
      
    if (metadataError) throw metadataError;
    
    return fileData;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Download a file
 * 
 * @param {string} filePath - The path of the file in storage
 * @param {string} fileName - The name to use for the downloaded file
 * @returns {Promise<void>}
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
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Get files for a request
 * 
 * @param {string} requestId - The ID of the request
 * @returns {Promise<Array>} - Array of file metadata
 */
export const getRequestFiles = async (requestId) => {
  try {
    const { data, error } = await supabase
      .from('v4_request_files')
      .select(`
        *,
        uploaded_by_user:uploaded_by (full_name, username)
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching request files:', error);
    throw error;
  }
};

/**
 * Delete a file
 * 
 * @param {string} fileId - The ID of the file record
 * @param {string} filePath - The path of the file in storage
 * @returns {Promise<void>}
 */
export const deleteFile = async (fileId, filePath) => {
  try {
    // Delete from storage first
    const { error: storageError } = await supabase.storage
      .from('request-files')
      .remove([filePath]);
      
    if (storageError) throw storageError;
    
    // Then delete the metadata
    const { error: dbError } = await supabase
      .from('v4_request_files')
      .delete()
      .eq('id', fileId);
      
    if (dbError) throw dbError;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
