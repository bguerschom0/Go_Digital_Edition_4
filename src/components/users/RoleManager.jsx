import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';

const RoleManager = ({ userId, currentRole, onRoleChange, disabled = false }) => {
  const { user: currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState(currentRole || 'user');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Available roles
  const roles = [
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
    { value: 'supervisor', label: 'Supervisor', description: 'View and generate reports' },
    { value: 'processor', label: 'Processor', description: 'Process document requests' },
    { value: 'organization', label: 'Organization', description: 'Organization member access' },
    { value: 'user', label: 'Regular User', description: 'Basic access' }
  ];

  // Update selected role when prop changes
  useEffect(() => {
    setSelectedRole(currentRole || 'user');
  }, [currentRole]);

  // Update user's role
  const updateUserRole = async (role) => {
    if (disabled || !userId || role === currentRole) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          role,
          updated_by: currentUser.username,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      setSelectedRole(role);
      if (onRoleChange) onRoleChange(role);
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role');
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200';
      case 'supervisor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
      case 'processor':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'organization':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Find the selected role object
  const selectedRoleObj = roles.find(r => r.value === selectedRole) || roles[4]; // Default to user

  return (
    <div className="relative">
      {/* Current role badge */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getRoleColor(selectedRole)} 
                 ${!disabled ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
      >
        <Shield className="h-4 w-4 mr-1.5" />
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
        ) : (
          selectedRoleObj.label
        )}
      </button>

      {/* Error message */}
      {error && (
        <p className="absolute left-0 -bottom-6 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Role selection dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-60 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select a role to change permissions
            </p>
          </div>
          <div className="py-1">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => updateUserRole(role.value)}
                disabled={loading}
                className={`w-full text-left flex items-center px-4 py-2 text-sm 
                         ${role.value === selectedRole 
                            ? 'bg-gray-100 dark:bg-gray-700' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <span className={`flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full mr-2 ${getRoleColor(role.value)}`}>
                  <Shield className="h-4 w-4" />
                </span>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {role.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {role.description}
                  </span>
                </div>
                {role.value === selectedRole && (
                  <Check className="ml-auto h-4 w-4 text-green-500" />
                )}
              </button>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManager;
