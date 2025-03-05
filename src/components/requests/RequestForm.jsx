import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, Calendar } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

const RequestForm = ({ onSubmit, onCancel, isSubmitting = false, layoutType = "default" }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
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
          .from('v4_organizations')
          .select('id, name')
          .eq('is_active', true)
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
        .from('v4_requests')
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
      newErrors.reference_number = layoutType === "very-compact" ? 'Required' : 'Reference number is required';
    }
    
    if (!formData.date_received) {
      newErrors.date_received = layoutType === "very-compact" ? 'Required' : 'Received date is required';
    }
    
    if (!formData.sender) {
      newErrors.sender = layoutType === "very-compact" ? 'Required' : 'Sender organization is required';
    }
    
    if (!formData.subject.trim()) {
      newErrors.subject = layoutType === "very-compact" ? 'Required' : 'Subject is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
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
    }
  };

  // Improved Compact Layout
  if (layoutType === "very-compact") {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Ref Number, Date, Organization */}
        <div className="grid grid-cols-3 gap-4">
          {/* Reference Number */}
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
                className={`w-full h-9 px-3 py-2 text-sm rounded border ${
                  errors.reference_number
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white`}
              />
              {checkingRef && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {errors.reference_number && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.reference_number}
              </p>
            )}
          </div>
          
          {/* Date Received */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Received*
            </label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                name="date_received"
                value={formData.date_received}
                onChange={handleChange}
                className={`w-full h-9 pl-8 pr-3 py-2 text-sm rounded border ${
                  errors.date_received
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white`}
              />
            </div>
            {errors.date_received && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.date_received}
              </p>
            )}
          </div>
          
          {/* Sender Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sender Organization*
            </label>
            <select
              name="sender"
              value={formData.sender}
              onChange={handleChange}
              className={`w-full h-9 px-3 py-2 text-sm rounded border ${
                errors.sender
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
              focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white`}
            >
              <option value="">Select organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            {errors.sender && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.sender}
              </p>
            )}
          </div>
        </div>
        
        {/* Row 2: Subject and Priority */}
        <div className="grid grid-cols-4 gap-4">
          {/* Subject */}
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject / Request Type*
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className={`w-full h-9 px-3 py-2 text-sm rounded border ${
                errors.subject
                  ? 'border-red-500 dark:border-red-500'
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
              focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white`}
            />
            {errors.subject && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.subject}
              </p>
            )}
          </div>
          
          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full h-9 px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700
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
        
        {/* Row 3: Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description <span className="text-gray-500 dark:text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 text-sm rounded border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
          />
        </div>
        
        {/* Buttons - placed after description */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 
                     dark:hover:text-white transition-colors disabled:opacity-50 border border-gray-200 
                     dark:border-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded
                     hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors 
                     flex items-center gap-1 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Request'
            )}
          </button>
        </div>
        
        {/* Duplicate warning (if needed) */}
        {isDuplicate && duplicateDetails && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded text-sm">
            <p className="font-medium">Duplicate reference detected for request from {new Date(duplicateDetails.date_received).toLocaleDateString()} (Status: {duplicateDetails.status.toUpperCase()})</p>
          </div>
        )}
      </form>
    );
  }
  
  // Compact Layout
  if (layoutType === "compact") {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Ref Number, Date, Organization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Reference Number */}
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
          </div>
          
          {/* Date Received */}
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
          
          {/* Sender Organization */}
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
        </div>
        
        {/* Row 2: Subject, Priority, Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Subject */}
          <div className="md:col-span-2">
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
          
          {/* Priority */}
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
          
          {/* Buttons */}
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 
                       dark:hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                       hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors 
                       flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Request'
              )}
            </button>
          </div>
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description <span className="text-gray-500 dark:text-gray-400 font-normal">(Optional)</span>
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
        
        {/* Duplicate warning (if needed) */}
        {isDuplicate && duplicateDetails && (
          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
            <p className="font-medium">Duplicate reference number detected</p>
            <p className="mt-1">
              This reference number already exists for a request received on{' '}
              {new Date(duplicateDetails.date_received).toLocaleDateString()}. 
              Current status: {duplicateDetails.status.toUpperCase()}
            </p>
            <p className="mt-1">You can continue with this reference if needed.</p>
          </div>
        )}
      </form>
    );
  }

  // Default Layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-none p-0"
    >
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
                This reference number already exists for a request received on{' '}
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
            Description <span className="text-gray-500 dark:text-gray-400 font-normal">(Optional)</span>
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
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 
                     dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                     hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors 
                     flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Request'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default RequestForm;
