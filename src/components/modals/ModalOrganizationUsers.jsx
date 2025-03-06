import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Loader2, 
  AlertCircle,
  Search,
  UserPlus,
  Building,
  CheckCircle,
  XCircle,
  Users,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

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

const ModalOrganizationUsers = ({ isOpen, onClose, organizationId }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orgUsers, setOrgUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [organization, setOrganization] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch data when modal opens and organizationId changes
  useEffect(() => {
    if (!isOpen || !organizationId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the specific organization
        const { data: orgData, error: orgError } = await supabase
          .from('v4_organizations')
          .select('*')
          .eq('id', organizationId)
          .single();
          
        if (orgError) throw orgError;
        setOrganization(orgData);
        
        // Fetch all users with organization role
        const { data: allUsersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .eq('user_role_v4', 'organization');
          
        if (usersError) throw usersError;
        setAllUsers(allUsersData || []);
        
        // Fetch organization memberships
        const { data: membershipsData, error: membershipsError } = await supabase
          .from('v4_user_organizations')
          .select('*')
          .eq('organization_id', organizationId);
          
        if (membershipsError) throw membershipsError;
        
        // Create a set of user IDs who are members of this organization
        const memberUserIds = new Set(membershipsData.map(m => m.user_id));
        
        // Mark each user as a member or not
        const processedUsers = allUsersData.map(user => ({
          ...user,
          isMember: memberUserIds.has(user.id),
          isPrimary: membershipsData.some(m => m.user_id === user.id && m.is_primary)
        }));
        
        setOrgUsers(processedUsers);
      } catch (error) {
        console.error('Error fetching organization users:', error);
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isOpen, organizationId]);

  // Toggle user membership
  const toggleUserMembership = async (userId, currentState) => {
    try {
      setError(null);
      
      if (currentState) {
        // Remove user from organization
        const { data: userOrg, error: findError } = await supabase
          .from('v4_user_organizations')
          .select('id, is_primary')
          .eq('user_id', userId)
          .eq('organization_id', organizationId)
          .single();
          
        if (findError) throw findError;
        
        // Check if this is their only organization
        const { count, error: countError } = await supabase
          .from('v4_user_organizations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
          
        if (countError) throw countError;
        
        if (count === 1) {
          // This is the user's only organization - confirm before removing
          if (!window.confirm('This is the user\'s only organization. Removing it will leave them without an organization. Continue?')) {
            return;
          }
        }
        
        // If this was the primary organization and they have others, set another one as primary
        if (userOrg.is_primary && count > 1) {
          const { data: otherOrg, error: otherOrgError } = await supabase
            .from('v4_user_organizations')
            .select('id')
            .eq('user_id', userId)
            .neq('organization_id', organizationId)
            .limit(1)
            .single();
            
          if (!otherOrgError && otherOrg) {
            // Set another org as primary
            await supabase
              .from('v4_user_organizations')
              .update({ is_primary: true })
              .eq('id', otherOrg.id);
          }
        }
        
        // Delete the membership
        const { error: deleteError } = await supabase
          .from('v4_user_organizations')
          .delete()
          .eq('id', userOrg.id);
          
        if (deleteError) throw deleteError;
        
        // Update local state
        setOrgUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, isMember: false, isPrimary: false } : user
          )
        );
        
        setSuccessMessage('User removed from organization');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        // Add user to organization
        
        // Check if this will be their first organization
        const { count, error: countError } = await supabase
          .from('v4_user_organizations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
          
        if (countError) throw countError;
        
        // If this is their first org, make it primary
        const isPrimary = count === 0;
        
        // Add the membership
        const { error: insertError } = await supabase
          .from('v4_user_organizations')
          .insert({
            user_id: userId,
            organization_id: organizationId,
            is_primary: isPrimary
          });
          
        if (insertError) throw insertError;
        
        // Update local state
        setOrgUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId ? { ...user, isMember: true, isPrimary } : user
          )
        );
        
        setSuccessMessage('User added to organization');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error updating user membership:', error);
      setError('Failed to update user. Please try again.');
    }
  };

  // Set organization as primary for a user
  const setPrimaryOrganization = async (userId) => {
    try {
      setError(null);
      
      // Find current primary organization for this user
      const { data: currentPrimary, error: findError } = await supabase
        .from('v4_user_organizations')
        .select('id')
        .eq('user_id', userId)
        .eq('is_primary', true);
        
      if (findError) throw findError;
      
      // If there's a current primary, unset it
      if (currentPrimary && currentPrimary.length > 0) {
        const { error: updateError } = await supabase
          .from('v4_user_organizations')
          .update({ is_primary: false })
          .eq('id', currentPrimary[0].id);
          
        if (updateError) throw updateError;
      }
      
      // Find this organization membership and set as primary
      const { data: membership, error: membershipError } = await supabase
        .from('v4_user_organizations')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .single();
        
      if (membershipError) throw membershipError;
      
      const { error: setPrimaryError } = await supabase
        .from('v4_user_organizations')
        .update({ is_primary: true })
        .eq('id', membership.id);
        
      if (setPrimaryError) throw setPrimaryError;
      
      // Update local state
      setOrgUsers(prevUsers => 
        prevUsers.map(user => ({
          ...user,
          isPrimary: user.id === userId ? true : user.isPrimary
        }))
      );
      
      setSuccessMessage('Primary organization updated');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error setting primary organization:', error);
      setError('Failed to update primary organization. Please try again.');
    }
  };

  // Filter users by search term
  const filteredUsers = orgUsers.filter(user => {
    if (!searchTerm) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      (user.full_name && user.full_name.toLowerCase().includes(term)) ||
      (user.username && user.username.toLowerCase().includes(term)) ||
      (user.email && user.email.toLowerCase().includes(term))
    );
  });

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={organization ? `Manage Users - ${organization.name}` : 'Manage Organization Users'}
      maxWidth="max-w-4xl"
    >
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>
        
        {/* User list */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No users found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchTerm ? 
                'No users match your search criteria.' :
                'There are no users with the organization role.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map(user => (
              <div 
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  user.isMember 
                    ? 'bg-white dark:bg-gray-800 border border-green-200 dark:border-green-900/40' 
                    : 'bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex-grow">
                  <div className="flex items-center">
                    <span className="text-base font-medium text-gray-900 dark:text-white">
                      {user.full_name || user.username}
                    </span>
                    {user.isMember && user.isPrimary && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email && (
                      <span>{user.email}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {user.isMember && !user.isPrimary && (
                    <button
                      onClick={() => setPrimaryOrganization(user.id)}
                      title="Set as primary organization"
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg"
                    >
                      <span className="text-sm">Make Primary</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => toggleUserMembership(user.id, user.isMember)}
                    className={`p-2 rounded-lg flex items-center ${
                      user.isMember
                        ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30'
                        : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30'
                    }`}
                  >
                    {user.isMember ? (
                      <>
                        <MinusCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Remove</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ModalOrganizationUsers;
