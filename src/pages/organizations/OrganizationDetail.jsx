import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Save,
  ArrowLeft,
  Users,
  Loader2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import useOrganization from '../../hooks/useOrganization';

// Utility function to validate UUID format
const isValidUUID = (str) => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const OrganizationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getOrganizationById, createOrganization, updateOrganization } = useOrganization();
  
  // Check if this is a new organization or a special route
  const isNewOrg = id === 'new';
  const isSpecialRoute = !isNewOrg && !isValidUUID(id);
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    is_active: true
  });
  
  const [loading, setLoading] = useState(!isNewOrg && !isSpecialRoute);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [requestCount, setRequestCount] = useState(0);
  
  useEffect(() => {
    // Handle special routes (like 'users')
    if (isSpecialRoute) {
      if (id === 'users') {
        navigate('/organizations/users');
      } else {
        setError(`Invalid organization ID: ${id}`);
        setLoading(false);
      }
      return;
    }
    
    // Don't fetch for new orgs
    if (!isNewOrg) {
      fetchOrganizationData();
    }
  }, [id, isNewOrg, isSpecialRoute]);
  
  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch organization details using the hook
      const orgData = await getOrganizationById(id);
      if (orgData) {
        setFormData(orgData);
      }
      
      // Fetch user count
      const { count: userCount, error: userError } = await supabase
        .from('v4_user_organizations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id);
        
      if (!userError) {
        setUserCount(userCount || 0);
      }
      
      // Fetch request count
      const { count: requestCount, error: requestError } = await supabase
        .from('v4_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sender', id);
        
      if (!requestError) {
        setRequestCount(requestCount || 0);
      }
      
    } catch (error) {
      console.error('Error fetching organization:', error);
      setError(error.message || 'Failed to load organization details');
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
      if (isNewOrg) {
        // Create new organization using the hook
        const data = await createOrganization(formData);
        
        if (data && data.id) {
          // Redirect to the new organization page
          navigate(`/organizations/${data.id}`, { replace: true });
        } else {
          throw new Error('Failed to create organization');
        }
      } else {
        // Update existing organization using the hook
        await updateOrganization(id, formData);
        
        // Refresh data
        fetchOrganizationData();
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      setError(error.message || 'Failed to save organization');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  // Handle invalid ID case
  if (isSpecialRoute && error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-3xl mx-auto">
          <Link
            to="/organizations"
            className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Organizations
          </Link>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Organization Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <Link
              to="/organizations"
              className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Return to Organizations
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link
          to="/organizations"
          className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Organizations
        </Link>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Building className="w-6 h-6 mr-2" />
                {isNewOrg ? 'New Organization' : 'Edit Organization'}
              </h1>
              
              {!isNewOrg && (
                <Link
                  to={`/organizations/users?org=${id}`}
                  className="flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300
                         rounded-lg transition-colors text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800/30"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Manage Users
                </Link>
              )}
            </div>
          </div>
          
          {error && (
            <div className="m-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Organization Info */}
              <div className="space-y-4">
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
                    Contact Person
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      name="contact_person"
                      value={formData.contact_person || ''}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
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
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                    <textarea
                      name="address"
                      value={formData.address || ''}
                      onChange={handleChange}
                      rows="3"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                               bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                               focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </div>
                
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
                onClick={() => navigate('/organizations')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 mr-3
                         hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-black text-white dark:bg-white dark:text-black
                         rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200
                         transition-colors disabled:opacity-50 flex items-center"
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetail;
