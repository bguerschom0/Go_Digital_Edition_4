import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Save,
  Users,
  Loader2,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

// Modal component
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

const ModalOrganizationDetail = ({ isOpen, onClose, organizationId, onSuccess }) => {
  const { user } = useAuth();
  const isNewOrg = organizationId === 'new';
  const [title, setTitle] = useState(isNewOrg ? 'New Organization' : 'Edit Organization');
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    phone2: '',
    email: '',
    address: '',
    is_active: true
  });
  
  const [loading, setLoading] = useState(!isNewOrg);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  
  // Fetch organization data
  useEffect(() => {
    if (!isOpen) return;
    
    if (!isNewOrg) {
      fetchOrganizationData();
    } else {
      setFormData({
        name: '',
        phone: '',
        phone2: '',
        email: '',
        address: '',
        is_active: true
      });
      setLoading(false);
    }
  }, [isOpen, organizationId]);
  
  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('v4_organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
        
      if (orgError) throw orgError;
      
      // Handle migration from contact_person to phone2 if needed
      const formattedData = {
        ...orgData,
        phone2: orgData.phone2 || orgData.contact_person || ''
      };
      
      setFormData(formattedData);
      setTitle(`${orgData.name}`);
      
      // Fetch user count
      const { count: userCount, error: userError } = await supabase
        .from('v4_user_organizations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);
        
      if (!userError) {
        setUserCount(userCount || 0);
      }
      
      // Fetch request count
      const { count: requestCount, error: requestError } = await supabase
        .from('v4_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sender', organizationId);
        
      if (!requestError) {
        setRequestCount(requestCount || 0);
      }
      
    } catch (error) {
      console.error('Error fetching organization:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      // Create a submission object (omit any properties we don't want to save)
      const submissionData = {
        name: formData.name,
        phone: formData.phone,
        phone2: formData.phone2,
        email: formData.email,
        address: formData.address,
        is_active: formData.is_active
      };
      
      if (isNewOrg) {
        // Create new organization
        const { data, error } = await supabase
          .from('v4_organizations')
          .insert([submissionData])
          .select()
          .single();
          
        if (error) throw error;
        
        if (onSuccess) {
          onSuccess(data);
        }
        
        onClose();
      } else {
        // Update existing organization
        const { error } = await supabase
          .from('v4_organizations')
          .update(submissionData)
          .eq('id', organizationId);
          
        if (error) throw error;
        
        if (onSuccess) {
          onSuccess();
        }
        
        // Refresh data
        fetchOrganizationData();
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-5xl">
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}
            
            {/* Organization Info */}
            <div className="space-y-4">
              {/* First row: Organization Name, Phone, Phone 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization Name*
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone 2
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="phone2"
                      value={formData.phone2 || ''}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>
              
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3 text-gray-400 dark:text-gray-500" />
                  <textarea
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    rows="3"
                    className="w-full pl-4 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>
              
              {/* Is Active */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-black focus:ring-black rounded border-gray-300"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
            </div>
            
            {/* Organization Stats (only for existing organizations) */}
            {!isNewOrg && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    <Users className="w-4 h-4 mr-1" />
                    <span>Users</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{userCount}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                  <div className="flex items-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>Requests</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{requestCount}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>

            <div className="pl-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg
                      hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </button>
              </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ModalOrganizationDetail;
