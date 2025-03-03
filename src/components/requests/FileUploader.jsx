import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, AlertCircle, File, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { applyPdfSecurity } from '../../services/pdfSecurityService';

const FileUploader = ({ requestId, onUploadComplete, isResponseUpload = false }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Maximum file size in bytes (20MB)
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  
  // Allowed file types
  const ALLOWED_TYPES = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ];

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    validateAndAddFiles(selectedFiles);
  };
  
  // Validate files and add them to the state
  const validateAndAddFiles = (selectedFiles) => {
    const validatedFiles = [];
    const errors = [];
    
    selectedFiles.forEach(file => {
      // Check file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" is not a supported file type.`);
        return;
      }
      
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}" exceeds the maximum file size of 20MB.`);
        return;
      }
      
      // Add unique ID to each file for tracking
      validatedFiles.push({
        file,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        progress: 0,
        error: null,
        uploaded: false
      });
    });
    
    if (errors.length > 0) {
      setError(errors.join(' '));
      setTimeout(() => setError(null), 5000);
    }
    
    if (validatedFiles.length > 0) {
      setFiles(prev => [...prev, ...validatedFiles]);
    }
  };
  
  // Handle drag and drop
  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  }, []);
  
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const onDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Remove file from the list
  const removeFile = (id) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Upload files to Supabase
  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    let uploadedCount = 0;
    const uploadErrors = [];
    
    // Create a copy of files to track progress
    const filesCopy = [...files];
    
    for (let i = 0; i < filesCopy.length; i++) {
      const { file, id } = filesCopy[i];
      
      try {
        // If it's a PDF, apply security settings
        let fileToUpload = file;
        let isSecured = false;
        
        if (file.type === 'application/pdf' && isResponseUpload) {
          try {
            // Update progress to show processing
            setUploadProgress(prev => ({
              ...prev,
              [id]: { progress: 0, status: 'processing' }
            }));
            
            // Apply PDF security
            fileToUpload = await applyPdfSecurity(file);
            isSecured = true;
            
            // Update progress after processing
            setUploadProgress(prev => ({
              ...prev,
              [id]: { progress: 10, status: 'uploading' }
            }));
          } catch (pdfError) {
            console.error('Error securing PDF:', pdfError);
            // Continue with original file if security application fails
            setUploadProgress(prev => ({
              ...prev,
              [id]: { progress: 10, status: 'uploading', warning: 'Could not apply security features' }
            }));
          }
        } else {
          // Set initial progress for non-PDF files
          setUploadProgress(prev => ({
            ...prev,
            [id]: { progress: 10, status: 'uploading' }
          }));
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
            upsert: false,
            onUploadProgress: (progress) => {
              // Calculate progress percentage (10-90%)
              const progressPercentage = 10 + Math.round((progress.loaded / progress.total) * 80);
              setUploadProgress(prev => ({
                ...prev,
                [id]: { 
                  ...prev[id],
                  progress: progressPercentage, 
                  status: 'uploading' 
                }
              }));
            },
          });
          
        if (uploadError) throw uploadError;
        
        // Update progress to show processing metadata
        setUploadProgress(prev => ({
          ...prev,
          [id]: { progress: 95, status: 'processing' }
        }));
        
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
              is_secured: isSecured,
              is_original_request: !isResponseUpload,
              is_response: isResponseUpload,
              uploaded_by: user.id
            },
          ]);
          
        if (metadataError) throw metadataError;
        
        // Update progress to show success
        setUploadProgress(prev => ({
          ...prev,
          [id]: { progress: 100, status: 'completed' }
        }));
        
        uploadedCount++;
        
        // Update file status in state
        filesCopy[i] = {
          ...filesCopy[i],
          uploaded: true,
          error: null
        };
        
      } catch (error) {
        console.error('Error uploading file:', error);
        
        // Update progress to show error
        setUploadProgress(prev => ({
          ...prev,
          [id]: { progress: 0, status: 'error', message: error.message }
        }));
        
        // Update file status in state
        filesCopy[i] = {
          ...filesCopy[i],
          error: error.message
        };
        
        uploadErrors.push(`Failed to upload "${file.name}": ${error.message}`);
      }
    }
    
    // Update request status if this is a response upload and all files were uploaded successfully
    if (isResponseUpload && uploadedCount > 0 && uploadedCount === files.length) {
      try {
        await supabase
          .from('requests')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_by: user.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);
      } catch (statusError) {
        console.error('Error updating request status:', statusError);
      }
    }
    
    setUploading(false);
    
    // Show error if any
    if (uploadErrors.length > 0) {
      setError(uploadErrors.join(' '));
      setTimeout(() => setError(null), 5000);
    }
    
    // Call the callback if all files were uploaded successfully
    if (uploadedCount === files.length) {
      if (onUploadComplete) onUploadComplete(uploadedCount);
      // Clear the files list after successful upload
      setTimeout(() => {
        setFiles([]);
        setUploadProgress({});
      }, 2000);
    }
  };

  // Get file icon based on mime type
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) {
      return <File className="h-5 w-5 text-red-500" />;
    } else if (fileType.includes('word')) {
      return <File className="h-5 w-5 text-blue-500" />;
    } else if (fileType.includes('excel') || fileType.includes('sheet')) {
      return <File className="h-5 w-5 text-green-500" />;
    } else if (fileType.includes('image')) {
      return <File className="h-5 w-5 text-purple-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get status icon based on upload status
  const getStatusIcon = (fileId) => {
    const status = uploadProgress[fileId]?.status;
    
    if (status === 'completed') {
      return <Check className="h-4 w-4 text-green-500" />;
    } else if (status === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    } else if (status === 'processing' || status === 'uploading') {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    } else {
      return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag and drop area */}
      <div
        onClick={() => fileInputRef.current.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragEnter}
        className={`border-2 border-dashed rounded-lg p-6 
                   flex flex-col items-center justify-center 
                   cursor-pointer transition-colors
                   ${uploading ? 'opacity-50 pointer-events-none' : ''}
                   ${error ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                           : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
          disabled={uploading}
        />
        
        <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mb-2" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
          {isResponseUpload 
            ? "Drag and drop response files here or click to browse"
            : "Drag and drop request documents here or click to browse"}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
          PDF, Word, Excel, JPEG, PNG (max 20MB per file)
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg flex items-start gap-2 text-sm">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* Selected files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {files.length} {files.length === 1 ? 'file' : 'files'} selected
          </p>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              <AnimatePresence initial={false}>
                {files.map(({ file, id }) => (
                  <motion.li
                    key={id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {getFileIcon(file.type)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {/* Progress indicator */}
                      {uploadProgress[id] && (
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(id)}
                          {uploadProgress[id].status !== 'completed' && (
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full" 
                                style={{ width: `${uploadProgress[id].progress}%` }} 
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Remove button (only visible if not uploaded/uploading) */}
                      {(!uploadProgress[id] || uploadProgress[id].status === 'error') && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(id);
                          }}
                          className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        </div>
      )}
      
      {/* Upload button */}
      {files.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={uploadFiles}
            disabled={uploading || files.length === 0}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                     hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors 
                     flex items-center gap-2 disabled:opacity-50"
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading 
              ? `Uploading ${files.length} ${files.length === 1 ? 'file' : 'files'}...` 
              : `Upload ${files.length} ${files.length === 1 ? 'file' : 'files'}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
