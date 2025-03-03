import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

const RequestForm = ({ onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState(null);
  const [checkingRef, setCheckingRef] = useState(false);
  
  const [formData, setFormData] = useState({
    reference_number: '',
    date_received: new Date().toISOString().split('T')[0], // Today's date as default
    sender: '',
    subject: '',
    description: '',
    priority: 'normal'
  });

  const [errors, setErrors] = useState({});

  // Fetch organizations for the dropdown
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name')
          .order('name');
          
        if (error) throw error;
        setOrganizations(data || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      }
    };

    fetchOrganizations();
  }, []);

  // Check for duplicate reference numbers
  const checkDuplicateReference = async (reference) => {
    if (!reference) return;
    
    setCheckingRef(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('id, reference_number, date_received, sender, subject, status')
        .eq('reference_number', reference)
        .limit(1);
        
      if (error) throw error;
      
      setIsDuplicate(data && data.length > 0);
      setDuplicateDetails(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Error checking duplicate reference:', error);
    } finally {
      setCheckingRef(false);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    
    // Check for duplicate reference numbers with debounce
    if (name === 'reference_number') {
      const timeoutId = setTimeout(() => {
        checkDuplicateReference(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.reference_number.trim()) {
      newErrors.reference_number = 'Reference number is required';
    }
    
    if (!formData.date_received) {
      newErrors.date_received = 'Received date is required';
    }
    
    if (!formData.sender) {
      newErrors.sender = 'Sender organization is required';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const newRequest = {
        ...formData,
        created_by: user.id,
        status: 'pending',
        is_duplicate: isDuplicate
      };
      
      await onSubmit(newRequest);
    } catch (error) {
      console.error('Error submitting request:', error);
      setErrors({ submit: 'Failed to submit request. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Record New Request
      </h2>
      
      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reference Number*
          </label>
          <div className="relative">
            <input
              type="text"
              name="reference_number"
              value={formData.reference_number}
              onChange={handleChange}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.reference_number
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
              focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
            />
            {checkingRef && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          {errors.reference_number && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.reference_number}
            </p>
          )}
          
          {isDuplicate && duplicateDetails && (
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
              <p className="font-medium">Duplicate reference number detected</p>
              <p className="mt-1">
                This reference number already exists for a request received on {' '}
                {new Date(duplicateDetails.date_received).toLocaleDateString()}. 
                Current status: {duplicateDetails.status.toUpperCase()}
              </p>
              <p className="mt-1">You can continue with this reference if needed.</p>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date Received*
          </label>
          <input
            type="date"
            name="date_received"
            value={formData.date_received}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.date_received
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-200 dark:border-gray-700'
            } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
          />
          {errors.date_received && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.date_received}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sender Organization*
          </label>
          <select
            name="sender"
            value={formData.sender}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.sender
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-200 dark:border-gray-700'
            } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
          >
            <option value="">Select an organization</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          {errors.sender && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.sender}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject / Request Type*
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.subject
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-200 dark:border-gray-700'
            } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.subject}
            </p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority
          </label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
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
        
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 
                     dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                     hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors 
                     flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Record Request
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default RequestForm;
