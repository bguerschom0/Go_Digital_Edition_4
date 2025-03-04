import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Building, 
  UserPlus, 
  Trash2, 
  CheckCircle,
  XCircle,
  Star,
  Loader2
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

// User-Organization Assignment Component
const UserOrgAssignment = ({ user, organizations, userOrgs, onAssign, onRemove, onSetPrimary }) => {
  const [selectedOrg, setSelectedOrg] = useState('');

  // Filter out organizations that the user is already assigned to
  const availableOrgs = organizations.filter(
    org => !userOrgs.some(userOrg => userOrg.organization_id === org.id)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.full_name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.username} {user.email && `• ${user.email}`}
          </p>
        </div>

        <div className="flex items-center">
          <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            Organization User
          </span>
        </div>
      </div>

      {/* Current Organizations */}
      {userOrgs.length > 0 ? (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Organizations:
          </h4>
          <div className="space-y-2">
            {userOrgs.map(userOrg => {
              const organization = organizations.find(org => org.id === userOrg.organization_id);
              return organization ? (
                <div 
                  key={userOrg.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center">
                    <Building className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900 dark:text-white">
                      {organization.name}
                    </span>
                    {userOrg.is_primary && (
                      <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!userOrg.is_primary && (
                      <button
                        onClick={() => onSetPrimary(userOrg.id)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Set as primary"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(userOrg.id)}
                      className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      title="Remove from organization"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg flex items-start">
          <XCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Not assigned to any organization</p>
            <p className="text-sm mt-1">This user needs to be assigned to at least one organization.</p>
          </div>
        </div>
      )}

      {/* Add New Organization */}
      {availableOrgs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assign to Organization:
          </h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="flex-grow px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="">Select an organization</option>
              {availableOrgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                if (selectedOrg) {
                  onAssign(user.id, selectedOrg, userOrgs.length === 0);
                  setSelectedOrg('');
                }
              }}
              disabled={!selectedOrg}
              className="px-4 py-2 sm:whitespace-nowrap bg-black text-white dark:bg-white dark:text-black rounded-lg
                       hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to Organization
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const OrganizationUsers = () => {
  const { user: currentUser } = useAuth();
  const [orgUsers, setOrgUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [userOrganizations, setUserOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [orgFilter, setOrgFilter] = useState('all');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users with organization role
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .eq('User_Role_V4', 'organization');
          
        if (usersError) throw usersError;
        
        // Fetch all organizations
        const { data: orgsData, error: orgsError } = await supabase
          .from('v4_organizations')
          .select('*')
          .order('name');
          
        if (orgsError) throw orgsError;
        
        // Fetch user-organization assignments
        const { data: userOrgsData, error: userOrgsError } = await supabase
          .from('v4_user_organizations')
          .select('*');
          
        if (userOrgsError) throw userOrgsError;
        
        setOrgUsers(usersData || []);
        setOrganizations(orgsData || []);
        setUserOrganizations(userOrgsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Assign user to organization
  const assignUserToOrg = async (userId, orgId, isPrimary) => {
    try {
      // First check if there's already an assignment (shouldn't happen in UI, but just in case)
      const existingAssignment = userOrganizations.find(
        uo => uo.user_id === userId && uo.organization_id === orgId
      );
      
      if (existingAssignment) {
        console.warn('User is already assigned to this organization');
        return;
      }
      
      // If this is the primary assignment, remove primary flag from other orgs for this user
      if (isPrimary) {
        const primaryUpdates = userOrganizations
          .filter(uo => uo.user_id === userId && uo.is_primary)
          .map(uo => ({
            ...uo,
            is_primary: false
          }));
          
        if (primaryUpdates.length > 0) {
          const { error: updateError } = await supabase
            .from('v4_user_organizations')
            .upsert(primaryUpdates);
            
          if (updateError) throw updateError;
        }
      }
      
      // Create new assignment
      const { data, error } = await supabase
        .from('v4_user_organizations')
        .insert([{
          user_id: userId,
          organization_id: orgId,
          is_primary: isPrimary
        }])
        .select();
        
      if (error) throw error;
      
      // Update local state
      setUserOrganizations(prev => [...prev, ...data]);
    } catch (error) {
      console.error('Error assigning user to organization:', error);
      alert('Failed to assign user to organization. Please try again.');
    }
  };
  
  // Remove user from organization
  const removeUserFromOrg = async (userOrgId) => {
    try {
      const userOrg = userOrganizations.find(uo => uo.id === userOrgId);
      
      if (!userOrg) {
        console.warn('User-organization assignment not found');
        return;
      }
      
      // Check if this is the only assignment for the user
      const userAssignments = userOrganizations.filter(uo => uo.user_id === userOrg.user_id);
      
      if (userAssignments.length === 1) {
        if (!window.confirm('This is the only organization for this user. Removing it will leave the user without an organization. Are you sure you want to continue?')) {
          return;
        }
      }
      
      // If removing primary, need to set a new primary if other orgs exist
      if (userOrg.is_primary && userAssignments.length > 1) {
        // Find another org to set as primary
        const newPrimary = userAssignments.find(uo => uo.id !== userOrgId);
        
        if (newPrimary) {
          const { error: updateError } = await supabase
            .from('v4_user_organizations')
            .update({ is_primary: true })
            .eq('id', newPrimary.id);
            
          if (updateError) throw updateError;
          
          // Update in local state
          setUserOrganizations(prev => 
            prev.map(uo => 
              uo.id === newPrimary.id ? { ...uo, is_primary: true } : uo
            )
          );
        }
      }
      
      // Remove the assignment
      const { error } = await supabase
        .from('v4_user_organizations')
        .delete()
        .eq('id', userOrgId);
        
      if (error) throw error;
      
      // Update local state
      setUserOrganizations(prev => prev.filter(uo => uo.id !== userOrgId));
    } catch (error) {
      console.error('Error removing user from organization:', error);
      alert('Failed to remove user from organization. Please try again.');
    }
  };
  
  // Set organization as primary
  const setPrimaryOrganization = async (userOrgId) => {
    try {
      const userOrg = userOrganizations.find(uo => uo.id === userOrgId);
      
      if (!userOrg) {
        console.warn('User-organization assignment not found');
        return;
      }
      
      // Remove primary flag from other orgs for this user
      const currentPrimary = userOrganizations.find(
        uo => uo.user_id === userOrg.user_id && uo.is_primary
      );
      
      if (currentPrimary) {
        const { error: updateError } = await supabase
          .from('v4_user_organizations')
          .update({ is_primary: false })
          .eq('id', currentPrimary.id);
          
        if (updateError) throw updateError;
      }
      
      // Set this org as primary
      const { error } = await supabase
        .from('v4_user_organizations')
        .update({ is_primary: true })
        .eq('id', userOrgId);
        
      if (error) throw error;
      
      // Update local state
      setUserOrganizations(prev => 
        prev.map(uo => ({
          ...uo,
          is_primary: uo.id === userOrgId ? true : 
                      (uo.user_id === userOrg.user_id ? false : uo.is_primary)
        }))
      );
    } catch (error) {
      console.error('Error setting primary organization:', error);
      alert('Failed to set primary organization. Please try again.');
    }
  };

  // Filter users by search term and organization
  const filteredUsers = orgUsers.filter(user => {
    // Apply search filter
    const matchesSearch = 
      searchTerm === '' || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply organization filter
    const userOrgIds = userOrganizations
      .filter(uo => uo.user_id === user.id)
      .map(uo => uo.organization_id);
      
    const matchesOrg = 
      orgFilter === 'all' || 
      (orgFilter === 'none' && userOrgIds.length === 0) ||
      userOrgIds.includes(orgFilter);
    
    return matchesSearch && matchesOrg;
  });

  // Get user's organizations
  const getUserOrgs = (userId) => {
    return userOrganizations.filter(uo => uo.user_id === userId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Organization User Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Assign users to organizations
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search filter */}
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Users
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, username, or email..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Organization filter */}
              <div className="md:w-64">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Organization
                </label>
                <select
                  value={orgFilter}
                  onChange={(e) => setOrgFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="all">All Organizations</option>
                  <option value="none">No Organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No organization users found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {searchTerm || orgFilter !== 'all' ? 
                  'No users match your current filters. Try adjusting your search criteria.' :
                  'There are no users with the organization role. Create users and assign them the organization role.'}
              </p>
            </div>
          ) : (
            <div>
              {filteredUsers.map((user) => (
                <UserOrgAssignment
                  key={user.id}
                  user={user}
                  organizations={organizations}
                  userOrgs={getUserOrgs(user.id)}
                  onAssign={assignUserToOrg}
                  onRemove={removeUserFromOrg}
                  onSetPrimary={setPrimaryOrganization}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationUsers;
