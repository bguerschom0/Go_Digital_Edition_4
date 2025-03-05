import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import RequestDetails from '../requests/RequestDetails';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-4xl' }) => {
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

  // Handle click outside modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-0">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ModalRequestDetail = ({ isOpen, onClose, requestId, onUpdate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [request, setRequest] = useState(null);

  // Fetch request data
  useEffect(() => {
    if (!isOpen || !requestId) return;
    
    const fetchRequest = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('v4_requests')
          .select(`
            *,
            v4_organizations:sender (id, name, contact_person, email, phone),
            created_by_user:created_by (full_name, username),
            assigned_to_user:assigned_to (full_name, username),
            updated_by_user:updated_by (full_name, username)
          `)
          .eq('id', requestId)
          .single();
          
        if (error) throw error;
        
        setRequest(data);
      } catch (error) {
        console.error('Error fetching request:', error);
        setError('Failed to load request details.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRequest();
  }, [isOpen, requestId]);
  
  // Role-based editing permissions
  const canEditRequest = (request, user) => {
    if (!user || !request) return false;
    
    // Administrators can edit any request
    if (user.role === 'administrator') return true;
    
    // Regular users can only edit requests they created
    if (user.role === 'user' && request.created_by === user.id) return true;
    
    // Organization users cannot edit requests
    return false;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Details" maxWidth="max-w-5xl">
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="p-6">
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      ) : (
        <RequestDetails 
          requestId={requestId} 
          onClose={onClose}
          canEdit={canEditRequest(request, user)}
          onUpdate={onUpdate}
        />
      )}
    </Modal>
  );
};

export default ModalRequestDetail;
