import React from 'react';
import { format } from 'date-fns';
import { 
  Calendar,
  User,
  Building,
  Clock,
  Tag,
  AlertTriangle,
  FileText
} from 'lucide-react';
import StatusBadge from './StatusBadge';

const RequestDetails = ({ request, className = '', condensed = false }) => {
  if (!request) return null;

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'PPP');
  };

  // Format time ago for display
  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'today';
    if (diffInDays === 1) return 'yesterday';
    return `${diffInDays} days ago`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Reference and Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {request.reference_number}
          </h2>
          <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-1" />
            Received: {formatDate(request.date_received)}
            {!condensed && (
              <span className="ml-2 text-xs">({getTimeAgo(request.date_received)})</span>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <StatusBadge status={request.status} />
          
          {request.priority && request.priority !== 'normal' && (
            <span 
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                request.priority === 'urgent'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                  : request.priority === 'high'
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
              }`}
            >
              {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
            </span>
          )}
        </div>
      </div>
      
      {/* Subject and Description */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {request.subject}
        </h3>
        {request.description && !condensed && (
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {request.description}
          </p>
        )}
      </div>
      
      {!condensed && (
        <>
          {/* Organization Info */}
          {request.sender_org && (
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Sender Organization
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {request.sender_org.name}
                  </p>
                  {request.sender_org.contact_person && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 flex items-center">
                      <User className="h-3.5 w-3.5 mr-1 text-gray-500 dark:text-gray-400" />
                      {request.sender_org.contact_person}
                    </p>
                  )}
                </div>
                
                <div>
                  {request.sender_org.email && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Email: {request.sender_org.email}
                    </p>
                  )}
                  {request.sender_org.phone && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Phone: {request.sender_org.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Request Information
              </h4>
              <div className="space-y-2">
                {request.created_by_user && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Created by:</span>{' '}
                    {request.created_by_user.full_name || 'Unknown'}
                  </p>
                )}
                {request.created_at && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Created on:</span>{' '}
                    {formatDate(request.created_at)}
                  </p>
                )}
                {request.assigned_to_user && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Assigned to:</span>{' '}
                    {request.assigned_to_user.full_name}
                  </p>
                )}
                {request.updated_by_user && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Last updated by:</span>{' '}
                    {request.updated_by_user.full_name || 'Unknown'},{' '}
                    {getTimeAgo(request.updated_at)}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Timeline
              </h4>
              <div className="space-y-2">
                {request.status === 'completed' && request.completed_at && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Completed on:</span>{' '}
                    {formatDate(request.completed_at)}
                  </p>
                )}
                {request.status === 'completed' && request.completed_at && (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Time to complete:</span>{' '}
                    {Math.round((new Date(request.completed_at) - new Date(request.date_received)) / (1000 * 60 * 60 * 24))}{' '}
                    days
                  </p>
                )}
                {request.status === 'completed' && request.deletion_date && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <span className="font-medium">Auto-deletion date:</span>{' '}
                    {formatDate(request.deletion_date)}
                  </p>
                )}
                {request.is_duplicate && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    This request has a duplicate reference number.
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Files Count */}
          {request.files_count > 0 && (
            <div className="flex items-center text-sm text-gray-700 dark:text-gray-300 mt-4">
              <FileText className="h-4 w-4 mr-1" />
              This request has {request.files_count} file{request.files_count !== 1 ? 's' : ''} attached.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RequestDetails;
