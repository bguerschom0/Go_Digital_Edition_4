import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import RequestForm from '../requests/RequestForm';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-4xl' }) => {
  // Handle click outside modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper function to create notifications
const createNotification = async (userId, title, message, relatedRequestId) => {
  try {
    await supabase
      .from('v4_notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        related_request_id: relatedRequestId
      }]);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const ModalRequestForm = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form submission
  const handleSubmit = async (requestData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Insert new request
      const { data, error } = await supabase
        .from('v4_requests')
        .insert([
          {
            ...requestData,
            created_by: user.id
          }
        ])
        .select();
        
      if (error) throw error;
      
      // Send notifications to organization users
      const newRequestId = data[0].id;
      const orgId = requestData.sender;
      const refNum = requestData.reference_number;
      
      // Get all users from the organization
      const { data: orgUsers } = await supabase
        .from('v4_user_organizations')
        .select('user_id')
        .eq('organization_id', orgId);
        
      if (orgUsers && orgUsers.length > 0) {
        // Create notifications for each organization user
        const notificationPromises = orgUsers
          .filter(orgUser => orgUser.user_id !== user.id) // Don't notify current user
          .map(orgUser => 
            createNotification(
              orgUser.user_id,
              'New Request',
              `A new request (${refNum}) has been created by ${user.full_name || 'a user'}.`,
              newRequestId
            )
          );
        
        await Promise.all(notificationPromises);
      }
      
      // Call success callback
      if (onSuccess) {
        onSuccess(data[0]);
      }
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating request:', error);
      setError('Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Request" maxWidth="max-w-3xl">
      {error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg flex items-start gap-2 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="max-w-full">
        <RequestForm 
          onSubmit={handleSubmit} 
          onCancel={onClose} 
          isSubmitting={loading}
          layoutType="very-compact" 
        />
      </div>
    </Modal>
  );
};

export default ModalRequestForm;
