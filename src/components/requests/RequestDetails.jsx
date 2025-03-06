import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  FileText, 
  MessageSquare,
  Download,
  User,
  Loader2,
  AlertCircle,
  Edit2,
  X,
  Check,
  ChevronDown
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import FileUploader from './FileUploader';
import CommentSection from './CommentSection';
import { format, formatDistanceToNow } from 'date-fns';

const RequestDetails = ({ requestId, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [requestFiles, setRequestFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [editData, setEditData] = useState({});
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  
  // Fetch request data
  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        setLoading(true);
        
        // Fetch request details
        const { data: requestData, error: requestError } = await supabase
          .from('v4_requests')
          .select(`
            *,
            created_by_user:created_by (full_name, username)
          `)
          .eq('id', requestId)
          .single();
          
        if (requestError) throw requestError;
        
        // Fetch request files
        const { data: filesData, error: filesError } = await supabase
          .from('v4_request_files')
          .select(`
            *,
            uploaded_by_user:uploaded_by (full_name, username)
          `)
          .eq('request_id', requestId)
          .order('created_at', { ascending: false });
          
        if (filesError) throw filesError;
        
        // Organize request data
        setRequest(requestData);
        setRequestFiles(filesData || []);
        setNewStatus(requestData.status);
        
        // Initialize edit data
        setEditData({
          subject: requestData.subject,
          description: requestData.description,
          priority: requestData.priority,
          sender: requestData.sender,
          date_received: requestData.date_received
        });
        
      } catch (error) {
        console.error('Error fetching request data:', error);
        setError('Failed to load request details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequestData();
    
    // Set up real-time subscription for files
    const fileSubscription = supabase
      .channel('public:v4_request_files')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'v4_request_files',
        filter: `request_id=eq.${requestId}`
      }, (payload) => {
        // Immediately update the files list with the new file
        supabase
          .from('v4_request_files')
          .select(`
            *,
            uploaded_by_user:uploaded_by (full_name, username)
          `)
          .eq('id', payload.new.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setRequestFiles(prev => [data, ...prev]);
            }
          });
      })
      .subscribe();
      
    // Set up real-time subscription for request updates
    const requestSubscription = supabase
      .channel('public:v4_requests')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'v4_requests',
        filter: `id=eq.${requestId}`
      }, (payload) => {
        // Immediately update the request with new data
        setRequest(prev => ({
          ...prev,
          ...payload.new
        }));
        setNewStatus(payload.new.status);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(fileSubscription);
      supabase.removeChannel(requestSubscription);
    };
  }, [requestId]);

  // Download a file
  const downloadFile = async (filePath, fileName) => {
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
      alert('Failed to download the file. Please try again.');
    }
  };

  // Update request data (for edit button)
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('v4_requests')
        .update({
          subject: editData.subject,
          description: editData.description,
          priority: editData.priority,
          sender: editData.sender,
          date_received: editData.date_received,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      if (error) throw error;
      
      setEditing(false);
      
      // Call update callback
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Update just the status
  const handleStatusChange = async () => {
    try {
      setSavingStatus(true);
      
      const { error } = await supabase
        .from('v4_requests')
        .update({
          status: newStatus,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
        
      if (error) throw error;
      
      setChangingStatus(false);
      
      // Call update callback
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating request status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setSavingStatus(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // Check if current user can edit this request
  const canEditRequest = () => {
    if (!user || !request) return false;
    
    // Administrators can edit any request
    if (user.role === 'administrator') return true;
    
    // Regular users can only edit requests they created
    if (user.role === 'user' && request.created_by === user.id) return true;
    
    // Organization users cannot edit requests
    return false;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Format status text
  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get priority badge color
  const getPriorityBadgeColor = (priority) => {
    switch(priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: // normal
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800/80 dark:text-gray-300';
    }
  };

  // Check if user can upload files - now allowed for all statuses
  const canUpload = () => {
    return (user.role === 'administrator' || user.role === 'user');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Request Not Found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {error || "The request you're looking for doesn't exist or you don't have permission to view it."}
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                   hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Back to Requests
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Request header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {request.reference_number}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Received: {format(new Date(request.date_received), 'PPP')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Created by: {request.created_by_user?.full_name || 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityBadgeColor(request.priority)}`}>
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority
            </div>
            
            {/* Status dropdown */}
            <div className="relative">
              {changingStatus ? (
                <div className="flex items-center gap-2">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-3 py-1 rounded border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs
                             focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={handleStatusChange}
                    disabled={savingStatus}
                    className="p-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-full"
                  >
                    {savingStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setChangingStatus(false)}
                    className="p-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setChangingStatus(true)}
                  className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)} hover:opacity-90`}
                >
                  {formatStatus(request.status)}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </button>
              )}
            </div>
            
            {/* Edit button (only if canEditRequest is true) */}
            {canEditRequest() && (
              <button
                onClick={() => setEditing(!editing)}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 
                         dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
                         transition-colors"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Editing form */}
        {editing && (
          <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject / Request Type
                </label>
                <input
                  type="text"
                  name="subject"
                  value={editData.subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  value={editData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={editData.description || ''}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded
                         text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="px-3 py-1 text-sm bg-black text-white dark:bg-white dark:text-black rounded
                         hover:bg-gray-800 dark:hover:bg-gray-200 flex items-center gap-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Files Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2" />
          Documents
        </h3>
        
        {/* Original request documents */}
        {requestFiles.some(file => file.is_original_request) && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Original Request Files
            </h4>
            <div className="space-y-2">
              {requestFiles
                .filter(file => file.is_original_request)
                .map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.file_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(file.file_size / 1024 / 1024).toFixed(2)} MB • Uploaded {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => downloadFile(file.file_path, file.file_name)}
                      className="flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg
                               text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600
                               transition-colors text-sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Response documents */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Response Files
          </h4>
          
          {requestFiles.some(file => file.is_response) ? (
            <div className="space-y-2">
              {requestFiles
                .filter(file => file.is_response)
                .map((file) => (
                  <div 
                    key={file.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.file_name}
                        </p>
                        <div className="flex items-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.file_size / 1024 / 1024).toFixed(2)} MB • Uploaded {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                          </p>
                          {file.is_secured && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded-full">
                              Secured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => downloadFile(file.file_path, file.file_name)}
                      className="flex items-center px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg
                               text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600
                               transition-colors text-sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm italic">
              No response files have been uploaded yet.
            </p>
          )}
        </div>
        
        {/* Upload new response files (always available) */}
        {canUpload() && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Upload Response Files
            </h4>
            <FileUploader 
              requestId={request.id} 
              onUploadComplete={() => {}} 
              isResponseUpload={true}
            />
          </div>
        )}
      </div>
      
      {/* Comments section */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 mr-2" />
          Discussion
        </h3>
        
        <CommentSection requestId={request.id} />
      </div>
    </div>
  );
};

export default RequestDetails;
