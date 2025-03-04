import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search,
  UserCog,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

const RoleManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  // Only the three available roles
  const roles = [
    { value: 'administrator', label: 'Administrator' },
    { value: 'user', label: 'User' },
    { value: 'organization', label: 'Organization' }
  ];

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active';
        query = query.eq('is_active', isActive);
      }
      
      // Apply role filter using User_Role_V4
      if (roleFilter !== 'all') {
        query = query.eq('User_Role_V4', roleFilter);
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(
          `username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setSavingRole(true);
      
      const { error } = await supabase
        .from('users')
        .update({
          User_Role_V4: newRole,  // Update the new role column
          updated_by: currentUser.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, User_Role_V4: newRole } : user
        )
      );
      
      setShowRoleModal(false);
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role. Please try again.');
    } finally {
      setSavingRole(false);
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: isActive,
          updated_by: currentUser.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      
      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, is_active: isActive } : user
        )
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    }
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  // Get display role from User_Role_V4
  const getUserRole = (user) => {
    return user.User_Role_V4 || 'user'; // Default to 'user' if not set
  };

  // Get display role text
  const getDisplayRole = (role) => {
    switch(role) {
      case 'administrator':
        return 'Administrator';
      case 'organization':
        return 'Organization';
      case 'user':
        return 'User';
      default:
        return 'User'; // Default fallback
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Role Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Manage user roles and permissions
            </p>
          </div>
          
          {/* Filters & Search */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Users
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, username, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                             bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                             focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  <option value="all">All Roles</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        <div className="flex justify-center items-center">
                          <Loader2 className="h-6 w-6 animate-spin mr-2" />
                          Loading users...
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.username}
                              </div>
                              {user.email && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {user.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span 
                            className="px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          >
                            {getDisplayRole(getUserRole(user))}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {user.last_login 
                            ? new Date(user.last_login).toLocaleString() 
                            : 'Never'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowRoleModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              Change Role
                            </button>
                            <button
                              onClick={() => handleStatusChange(user.id, !user.is_active)}
                              className={`${
                                user.is_active 
                                  ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                                  : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                              }`}
                            >
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && users.length > itemsPerPage && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 
                             bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 
                             hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 
                             bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 
                             hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(indexOfLastItem, users.length)}
                      </span>{' '}
                      of <span className="font-medium">{users.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 
                                 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300
                                 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="sr-only">Previous</span>
                        &larr;
                      </button>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                                   ${currentPage === i + 1
                                      ? 'z-10 bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                                      : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                                    }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 
                                 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300
                                 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="sr-only">Next</span>
                        &rarr;
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change User Role
              </h3>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                &times;
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Changing this user's role will affect their access and permissions within the system.
              </p>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User: <span className="font-bold">{selectedUser.full_name}</span>
                </label>
                
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Current Role:</span>
                  <span className="px-2.5 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    {getDisplayRole(getUserRole(selectedUser))}
                  </span>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Role:
                </label>
                <select
                  value={selectedUser.User_Role_V4 || 'user'} // Default to user if not set
                  onChange={(e) => setSelectedUser({...selectedUser, User_Role_V4: e.target.value})}
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
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-lg
                         hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRoleChange(selectedUser.id, selectedUser.User_Role_V4 || 'user')}
                disabled={savingRole}
                className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
                         hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors
                         flex items-center disabled:opacity-50"
              >
                {savingRole ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
