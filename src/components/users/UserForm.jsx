import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import OrganizationSelector from './OrganizationSelector';

const UserForm = ({ user, onSubmit, onCancel }) => {
  const { user: currentUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'user',
    organization: '',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  // Available roles
  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'processor', label: 'Processor' },
    { value: 'organization', label: 'Organization' },
    { value: 'user', label: 'Regular User' }
  ];

  // Initialize form data if editing a user
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role || 'user',
        organization: user.organization || '',
        is_active: user.is_active ?? true
      });
    }
  }, [user]);

  // Check if username already exists
  const checkDuplicateUsername = async (username) => {
    if (!username) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username);
        
      if (error) throw error;
      
      // Check if found user is different from current user (for edit mode)
      const isDuplicate = data && data.length > 0 && (!user || data[0].id !== user.id);
      setDuplicateWarning(isDuplicate);
    } catch (error) {
      console.error('Error checking username:', error);
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    
    // Check for duplicate username
    if (name === 'username') {
      checkDuplicateUsername(value);
    }
  };

  // Handle organization selection
  const handleOrganizationChange = (orgName) => {
    setFormData((prev) => ({ ...prev, organization: orgName }));
    
    // Clear organization error
    if (errors.organization) {
      setErrors((prev) => ({ ...prev, organization: null }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Organization is required for organization role
    if (formData.role === 'organization' && !formData.organization) {
      newErrors.organization = 'Organization is required for organization users';
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
      const userData = {
        ...formData,
        updated_by: currentUser.username,
        updated_at: new Date().toISOString()
      };
      
      // Add created_by for new users
      if (!user) {
        userData.created_by = currentUser.username;
      }
      
      await onSubmit(userData);
    } catch (error) {
      console.error('Error submitting user:', error);
      setErrors({ submit: 'An error occurred while saving user data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6"
    >
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        {user ? 'Edit User' : 'Create New User'}
      </h2>
      
      {errors.submit && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username*
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.username
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-200 dark:border-gray-700'
            } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
          />
          {errors.username && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.username}
            </p>
          )}
          {duplicateWarning && (
            <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
              This username is already taken. Please choose a different one.
            </p>
          )}
        </div>
        
        {/* Full Name field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name*
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.full_name
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-200 dark:border-gray-700'
            } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.full_name}
            </p>
          )}
        </div>
        
        {/* Email field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.email
                ? 'border-red-500 dark:border-red-500'
                : 'border-gray-200 dark:border-gray-700'
            } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
        </div>
        
        {/* Role field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role*
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Organization field (only show for organization role) */}
        {formData.role === 'organization' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization*
            </label>
            <OrganizationSelector
              value={formData.organization}
              onChange={handleOrganizationChange}
              error={errors.organization}
            />
            {errors.organization && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.organization}
              </p>
            )}
          </div>
        )}
        
        {/* Active status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="h-4 w-4 text-black dark:text-white border-gray-300 dark:border-gray-700 
                     rounded focus:ring-black dark:focus:ring-white"
          />
          <label htmlFor="is_active" className="ml-2 text-gray-700 dark:text-gray-300">
            Active
          </label>
        </div>
        
        {/* Form buttons */}
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
            disabled={loading || duplicateWarning}
            className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                     hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors 
                     flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {user ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserForm;
