import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  AlertCircle, 
  Calendar, 
  Upload,
  Loader2
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import FileUploader from '../../components/requests/FileUploader';
import useRoleCheck from '../../hooks/useRoleCheck';

const NewRequest = () => {
  const { user } = useAuth();
  const { canProcessRequests } = useRoleCheck();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [organizations, setOrganizations] = useState([]);
  const [checkingRef, setCheckingRef] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [duplicateDetails, setDuplicateDetails] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    reference_number: '',
    date_received: new Date().toISOString().split('T')[0], // Today's date
    sender: '',
    subject: '',
    description: '',
    priority: 'normal'
  });

  // Fetch organizations for dropdown
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
        
        // If user is from an organization, set it as default
        if (user.role === 'organization') {
          const { data: userOrgs, error: userOrgError } = await supabase
            .from('v4_user_organizations')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .single();
            
          if (!userOrgError && userOrgs) {
            setFormData(prev => ({ ...prev, sender: userOrgs.organization_id }));
          }
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
        setFormError('Failed to load organizations. Please try again.');
      }
    };
    
    fetchOrganizations();
  }, [user]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (formError) setFormError('');
    
    // Check for duplicate reference number
    if (name === 'reference_number' && value.trim()) {
      checkDuplicateReference(value);
    }
  };

  // Check for duplicate reference numbers
  const checkDuplicateReference = async (reference) => {
    setCheckingRef(true);
    try {
      const { data, error } = await supabase
        .from('v4_requests')
        .select('id, reference_number, date_received, status')
        .eq('reference_number', reference)
        .limit(1);
        
      if (error) throw error;
      
      setIsDuplicate(data && data.length > 0);
      setDuplicateDetails(data && data.length > 0 ? data[0] : null);
    } catch (error) {
      console.error('Error checking reference number:', error);
    } finally {
      setCheckingRef(false);
    }
  };

  // Handle upload completion
  const handleUploadComplete = (count) => {
    setUploadSuccess(true);
    setTimeout(() => {
      navigate('/requests');
    }, 2000);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.reference_number.trim()) {
      setFormError('Reference number is required');
      return;
    }
    
    if (!formData.sender) {
      setFormError('Sender organization is required');
      return;
    }
    
    if (!formData.subject.trim()) {
      setFormError('Subject is required');
      return;
    }
    
    setLoading(true);
    
    try {
      // Insert new request
      const { data, error } = await supabase
        .from('v4_requests')
        .insert([
          {
            reference_number: formData.reference_number,
            date_received: formData.date_received,
            sender: formData.sender,
            subject: formData.subject,
            description: formData.description || null,
            priority: formData.priority,
            status: 'pending',
            is_duplicate: isDuplicate,
            created_by: user.id
          }
        ])
        .select();
        
      if (error) throw error;
      
      // Navigate to the file upload section of the request detail
      navigate(`/requests/${data[0].id}`);
    } catch (error) {
      console.error('Error creating request:', error);
      setFormError('Failed to create request. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/requests')}
          className="flex items-center mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 
                   dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6"
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Create New Request
          </h1>
          
          {formError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          
          {uploadSuccess && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-lg flex items-start gap-2">
              <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>Request created successfully! Redirecting...</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={loading}
                />
                {checkingRef && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              
              {isDuplicate && duplicateDetails && (
                <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
                  <p className="font-medium">Duplicate reference number detected</p>
                  <p className="mt-1">
                    This reference exists for a request received on{' '}
                    {new Date(duplicateDetails.date_received).toLocaleDateString()}. 
                    Current status: {duplicateDetails.status.toUpperCase()}
                  </p>
                  <p className="mt-1">You can continue with this reference if needed.</p>
                </div>
              )}
            </div>
            
            {/* Date Received */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Received*
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  name="date_received"
                  value={formData.date_received}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  disabled={loading}
                />
              </div>
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
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                disabled={loading || user.role === 'organization'}
              >
                <option value="">Select an organization</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject / Request Type*
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                disabled={loading}
              />
            </div>
            
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                disabled={loading}
              />
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
                disabled={loading}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Request
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

// Missing import
const Check = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default NewRequest;
