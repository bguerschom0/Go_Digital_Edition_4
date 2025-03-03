import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Edit2, 
  Lock, 
  Trash2, 
  Search,
  Copy,
  Check,
  FileSpreadsheet,
  FileText 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import  useRoleAccess  from '../../hooks/useRoleCheck';

// User Modal Component for Create/Edit
const UserModal = ({ isOpen, mode, user, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    role: 'user',
    is_active: true
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        role: user.role || 'user',
        is_active: user.is_active ?? true
      });
    } else {
      setFormData({
        username: '',
        full_name: '',
        role: 'user',
        is_active: true
      });
    }
  }, [user]);

  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'security_guard', label: 'Security Guard' },
    { value: 'user', label: 'User' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Create User' : 'Edit User'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-black dark:text-white border-gray-300 dark:border-gray-700 
                       rounded focus:ring-black dark:focus:ring-white"
            />
            <label htmlFor="is_active" className="ml-2 text-gray-700 dark:text-gray-300">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 
                       dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black 
                       rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Temporary Password Modal Component
const TempPasswordModal = ({ isOpen, onClose, tempPassword }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Temporary Password Generated
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Please copy this temporary password. It will expire in 24 hours.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg font-mono text-lg break-all">
              {tempPassword}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-sm text-green-500 mt-2">
              ✓ Copied to clipboard
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <p>Important notes:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>This password is valid for 24 hours only</li>
            <li>User will be required to change it upon first login</li>
            <li>Keep this password secure and do not share it</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();


  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [showTempPasswordModal, setShowTempPasswordModal] = useState(false);
  const [currentTempPassword, setCurrentTempPassword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const generateTempPassword = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let tempPassword = '';
    const randomValues = new Uint32Array(10);
    crypto.getRandomValues(randomValues);
    
    randomValues.forEach((value) => {
      tempPassword += characters[value % characters.length];
    });

    return tempPassword;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(
          `username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`
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

  const handleCreateUser = async (userData) => {
    try {
      const tempPassword = generateTempPassword();
      const tempPasswordExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('users')
        .insert([{
          ...userData,
          temp_password: tempPassword,
          temp_password_expires: tempPasswordExpiry,
          password_change_required: true,
          created_by: currentUser.username
        }]);

      if (error) throw error;
      
      setCurrentTempPassword(tempPassword);
      setShowTempPasswordModal(true);
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_by: currentUser.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

const handleResetPassword = async (userId) => {
  try {
    // Generate a 10-character temporary password
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let tempPassword = '';
    const randomValues = new Uint32Array(10);
    crypto.getRandomValues(randomValues);
    
    randomValues.forEach((value) => {
      tempPassword += characters[value % characters.length];
    });

    // Set expiry to 24 hours from now
    const tempPasswordExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    // Only update temp password fields, NOT the actual password
    const { error } = await supabase
      .from('users')
      .update({
        temp_password: tempPassword,
        temp_password_expires: tempPasswordExpiry,
        password_change_required: true,
        updated_by: currentUser.username
      })
      .eq('id', userId);

    if (error) throw error;

    setCurrentTempPassword(tempPassword);
    setShowTempPasswordModal(true);
    
    fetchUsers();
  } catch (error) {
    console.error('Error resetting password:', error);
  }
};

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

const exportUsers = async (format) => {
  try {
    const exportData = users.map(user => ({
      'Username': user.username,
      'Full Name': user.full_name,
      'Role': user.role,
      'Status': user.is_active ? 'Active' : 'Inactive',
      'Created At': new Date(user.created_at).toLocaleString(),
      'Created By': user.created_by,
      'Last Login': user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `users_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exporting users:', error);
  }
};

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = users.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(users.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>

            <div className="flex flex-wrap gap-3">
<button
  onClick={() => exportUsers()}
  className="flex items-center px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-lg
           hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
>
  <FileSpreadsheet className="w-4 h-4 mr-2" />
  Export
</button>


              <button
                onClick={() => {
                  setModalMode('create');
                  setSelectedUser(null);
                  setShowModal(true);
                }}
                className="flex items-center px-4 py-2 bg-black text-white rounded-lg
                         hover:bg-gray-800 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
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
                      Created
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
                        Loading...
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
                                {user.username}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.full_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setModalMode('edit');
                                setShowModal(true);
                              }}
                              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
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
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div className="flex-1 flex justify-between sm:hidden">
<button
  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
  disabled={currentPage === 1}
  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 
             bg-white text-sm font-medium text-gray-500 dark:text-gray-300 
             hover:bg-gray-50 dark:hover:bg-gray-800"
>
  Previous
</button>
<button
  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
  disabled={currentPage === totalPages}
  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-700 
             bg-white text-sm font-medium text-gray-500 dark:text-gray-300 
             hover:bg-gray-50 dark:hover:bg-gray-800"
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
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Previous
                    </button>
{[...Array(totalPages)].map((_, i) => (
  <button
    key={i + 1}
    onClick={() => setCurrentPage(i + 1)}
    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
      ${currentPage === i + 1
        ? 'z-10 bg-black text-white dark:bg-white dark:text-black'
        : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
      } border-gray-300 dark:border-gray-700 rounded-md`}
  >
    {i + 1}
  </button>
))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={showModal}
        mode={modalMode}
        user={selectedUser}
        onClose={() => {
          setShowModal(false);
          setSelectedUser(null);
        }}
        onSubmit={modalMode === 'create' ? handleCreateUser : handleUpdateUser}
      />

      {/* Temporary Password Modal */}
      <TempPasswordModal
        isOpen={showTempPasswordModal}
        onClose={() => setShowTempPasswordModal(false)}
        tempPassword={currentTempPassword}
      />
    </div>
  );
};

export default UserManagement;
