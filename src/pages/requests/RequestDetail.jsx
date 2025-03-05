import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare,
  Loader2, 
  AlertCircle,
  Check,
  Download,
  Edit2,
  User,
  Building,
  Tag,
  ClipboardList,
  AlertTriangle,
  Flag
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import FileUploader from '../../components/requests/FileUploader';
import CommentSection from '../../components/requests/CommentSection';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [requestFiles, setRequestFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [orgData, setOrgData] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  
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
            organization:sender (id, name, contact_person, email, phone),
            created_by_user:created_by (full_name, username),
            assigned_to_user:assigned_to (full_name, username),
            updated_by_user:updated_by (full_name, username)
          `)
          .eq('id', id)
          .single();
          
        if (requestError) throw requestError;
        
        // Fetch request files
        const { data: filesData, error: filesError } = await supabase
          .from('v4_request_files')
          .select(`
            *,
            uploaded_by_user:uploaded_by (full_name, username)
          `)
          .eq('request_id', id)
          .order('created_at', { ascending: false });
          
        if (filesError) throw filesError;
        
        // Organize request data
        setRequest({
          ...requestData,
          sender_name: requestData.organization?.name,
          sender_org: requestData.organization
        });
        
        setOrgData(requestData.organization);
        setRequestFiles(filesData || []);
        
        // Initialize edit data
        setEditData({
          subject: requestData.subject,
          description: requestData.description,
          status: requestData.status,
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
    
    // Fetch organizations for dropdown
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('v4_organizations')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };
    
    fetchRequestData();
    fetchOrganizations();
    
    // Set up real-time subscription for files
    const fileSubscription = supabase
      .channel('public:v4_request_files')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'v4_request_files',
        filter: `request_id=eq.${id}`
      }, () => {
        // Refetch files when new ones are added
        const fetchFiles = async () => {
          const { data, error } = await supabase
            .from('v4_request_files')
            .select(`
              *,
              uploaded_by_user:uploaded_by (full_name, username)
            `)
            .eq('request_id', id)
            .order('created_at', { ascending: false });
            
          if (!error) {
            setRequestFiles(data || []);
          }
        };
        
        fetchFiles();
      })
      .subscribe();
      
    // Set up real-time subscription for request updates
    const requestSubscription = supabase
      .channel('public:v4_requests')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'v4_requests',
        filter: `id=eq.${id}`
      }, () => {
        // Refetch request when it's updated
        fetchRequestData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(fileSubscription);
      supabase.removeChannel(requestSubscription);
    };
  }, [id]);

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

  // Update request data
  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('v4_requests')
        .update({
          subject: editData.subject,
          description: editData.description,
          status: editData.status,
          priority: editData.priority,
          sender: editData.sender,
          date_received: editData.date_received,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      setEditing(false);
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // Check if user can edit this request
  const canEdit = () => {
    if (!user || !request) return false;
    
    // Administrators can edit any request
    if (user.role === 'administrator') return true;
    
    // Users with processing capabilities can edit
    if (user.role === 'user') return true;
    
    // Organization users cannot edit
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

  // Get priority color and icon
  const getPriorityInfo = (priority) => {
    switch(priority) {
      case 'low':
        return { 
          color: 'text-blue-600 dark:text-blue-400', 
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          icon: <Flag className="h-4 w-4" />
        };
      case 'high':
        return { 
          color: 'text-orange-600 dark:text-orange-400', 
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          icon: <Flag className="h-4 w-4" />
        };
      case 'urgent':
        return { 
          color: 'text-red-600 dark:text-red-400', 
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          icon: <AlertTriangle className="h-4 w-4" />
        };
      default: // normal
        return { 
          color: 'text-gray-600 dark:text-gray-400', 
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          icon: <Flag className="h-4 w-4" />
        };
    }
  };

  // Check if user can upload responses
  const canUploadResponse = () => {
    if (!user || !request) return false;
    
    // Only administrators and users can upload responses
    return (user.role === 'administrator' || user.role === 'user') && request.status !== 'completed';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Request Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {error || "The request you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <button
              onClick={() => navigate('/requests')}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                       hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Back to Requests
            </button>
          </div>
        </div>
      </div>
    );
  }

  const priorityInfo = getPriorityInfo(request.priority);

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <button
        onClick={() => navigate('/requests')}
        className="flex items-center mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 
                 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Requests
      </button>
      
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error || !request ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Request Not Found
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {error || "The request you're looking for doesn't exist or you don't have permission to view it."}
          </p>
          <button
            onClick={() => navigate('/requests')}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                     hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Back to Requests
          </button>
        </div>
      ) : (
        <>
          {/* Request header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6">
            {/* Header with reference number and status */}
            <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700">
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
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* Priority badge */}
                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium
                               ${getPriorityColor(request.priority)}`}>
                  <Flag className="h-4 w-4" />
                  <span>{request.priority.charAt(0).toUpperCase() + request.priority.slice(1)} Priority</span>
                </div>
                
                {/* Status badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {formatStatus(request.status)}
                </div>
                
                {/* Edit button (only for admin and user roles) */}
                {(user.role === 'administrator' || user.role === 'user') && (
                  <button
                    onClick={() => setEditing(!editing)}
                    disabled={saving}
                    className="ml-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 
                             dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700
                             transition-colors disabled:opacity-50"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Request details */}
            <div className="p-6">
              {editing ? (
                /* Edit form */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subject / Request Type*
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={editData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editData.description || ''}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={editData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                                 bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={editData.priority}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                                 bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sender Organization
                      </label>
                      <select
                        name="sender"
                        value={editData.sender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                                 bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      >
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date Received
                      </label>
                      <input
                        type="date"
                        name="date_received"
                        value={editData.date_received}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                                 bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                                 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      disabled={saving}
                      className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 
                               dark:hover:text-white transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                               hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors 
                               flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div className="space-y-6">
                  {/* Subject and description */}
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {request.subject}
                    </h2>
                    {request.description && (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {request.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Organization info */}
                  <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Sender Organization
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {request.sender_name}
                        </p>
                        {orgData?.contact_person && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 flex items-center">
                            <User className="h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-400" />
                            {orgData.contact_person}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        {orgData?.email && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Email: {orgData.email}
                          </p>
                        )}
                        {orgData?.phone && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            Phone: {orgData.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Meta information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                        <ClipboardList className="h-4 w-4 mr-1" />
                        Request Information
                      </h3>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Created by:</span>{' '}
                          {request.created_by_user?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Created on:</span>{' '}
                          {format(new Date(request.created_at), 'PPP')}
                        </p>
                        {request.updated_by && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            <span className="font-medium">Last updated by:</span>{' '}
                            {request.updated_by_user?.full_name || 'Unknown'},{' '}
                            {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        Additional Information
                      </h3>
                      <div className="space-y-2">
                        {request.is_duplicate && (
                          <p className="text-sm text-yellow-600 dark:text-yellow-400">
                            This request has a duplicate reference number.
                          </p>
                        )}
                        {request.status === 'completed' && request.deletion_date && (
                          <p className="text-sm text-red-600 dark:text-red-400">
                            <span className="font-medium">Auto-deletion date:</span>{' '}
                            {format(new Date(request.deletion_date), 'PPP')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Request documents */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Documents
              </h2>
            </div>
            
            <div className="p-6">
              {/* Original request documents */}
              {requestFiles.some(file => file.is_original_request) && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Original Request Files
                  </h3>
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
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Response Files
                </h3>
                
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
              
              {/* Upload new response files (only for admin and user) */}
              {(user.role === 'administrator' || user.role === 'user') && request.status !== 'completed' && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Upload Response Files
                  </h3>
                  <FileUploader 
                    requestId={request.id} 
                    onUploadComplete={() => {}} 
                    isResponseUpload={true}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Comments section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Discussion
              </h2>
            </div>
            
            <div className="p-6">
              <CommentSection requestId={request.id} />
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);

  export default RequestDetail;
