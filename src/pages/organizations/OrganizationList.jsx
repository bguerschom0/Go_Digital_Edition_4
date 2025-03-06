import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Search, 
  Plus, 
  Edit, 
  Trash, 
  Users,
  Loader2
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import ModalOrganizationUsers from '../../components/modals/ModalOrganizationUsers';
import ModalOrganizationDetail from '../../components/modals/ModalOrganizationDetail';

const OrganizationList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('v4_organizations')
        .select('*, v4_user_organizations(user_id)')
        .order('name');

      if (error) throw error;

      // Count users in each organization
      const orgsWithUserCount = data.map(org => ({
        ...org,
        userCount: org.v4_user_organizations ? org.v4_user_organizations.length : 0
      }));

      setOrganizations(orgsWithUserCount);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this organization? This will remove all associated users and requests.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('v4_organizations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setOrganizations(organizations.filter(org => org.id !== id));
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization. It may have associated records.');
    }
  };

  // Handle modals
  const openUserModal = (orgId = null) => {
    setSelectedOrgId(orgId);
    setShowUserModal(true);
  };

  const openDetailModal = (orgId = null) => {
    setSelectedOrgId(orgId);
    setShowDetailModal(true);
  };

  const handleModalSuccess = () => {
    // Refresh the organizations list
    fetchOrganizations();
  };

  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Organization Users Modal */}
      <ModalOrganizationUsers 
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        organizationId={selectedOrgId}
      />
      
      {/* Organization Detail Modal */}
      <ModalOrganizationDetail 
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        organizationId={selectedOrgId || 'new'}
        onSuccess={handleModalSuccess}
      />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage organizations and their users
            </p>
          </div>

          <button
            onClick={() => openDetailModal('new')}
            className="flex items-center px-4 py-2 bg-black text-white dark:bg-white dark:text-black
                     rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Organization
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>

        {/* Organizations Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredOrganizations.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
            <Building className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No organizations found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? `No organizations matching "${searchTerm}"` 
                : "You haven't created any organizations yet"}
            </p>
            <button
              onClick={() => openDetailModal('new')}
              className="mt-4 px-4 py-2 bg-black text-white dark:bg-white dark:text-black
                       rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Create Organization
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org) => (
              <div 
                key={org.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {org.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{org.userCount} users</span>
                      </div>
                      {org.phone && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          Phone: {org.phone}
                        </p>
                      )}
                      {org.email && (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {org.email}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openDetailModal(org.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(org.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/30 flex justify-between">
                  <button
                    onClick={() => openDetailModal(org.id)}
                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => openUserModal(org.id)}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                  >
                    Manage Users
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationList;
