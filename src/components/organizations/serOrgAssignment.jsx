import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Check, Star, StarOff } from 'lucide-react';
import { supabase } from '../../config/supabase';

const UserOrgAssignment = ({ user, organizations, onRefresh }) => {
  const [userOrgs, setUserOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [makingPrimary, setMakingPrimary] = useState(null);

  useEffect(() => {
    fetchUserOrganizations();
  }, [user.id]);

  const fetchUserOrganizations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('v4_user_organizations')
        .select(`
          id,
          organization_id,
          is_primary,
          v4_organizations:organization_id (
            id, 
            name
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Format the data for easier use
      const formattedData = data.map(item => ({
        id: item.id,
        organization_id: item.organization_id,
        is_primary: item.is_primary,
        name: item.v4_organizations.name
      }));

      setUserOrgs(formattedData);
    } catch (error) {
      console.error('Error fetching user organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignToOrganization = async () => {
    if (!selectedOrg) return;
    
    try {
      setAssigning(true);
      
      // Check if this is the first organization assignment (make primary if so)
      const isPrimary = userOrgs.length === 0;
      
      const { error } = await supabase
        .from('v4_user_organizations')
        .insert([
          {
            user_id: user.id,
            organization_id: selectedOrg,
            is_primary: isPrimary
          }
        ]);

      if (error) throw error;
      
      // Refresh the list
      await fetchUserOrganizations();
      if (onRefresh) onRefresh();
      
      // Reset the select field
      setSelectedOrg('');
    } catch (error) {
      console.error('Error assigning user to organization:', error);
      alert('Failed to assign user to organization. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const removeFromOrganization = async (assignmentId) => {
    try {
      setRemoving(assignmentId);
      
      const { error } = await supabase
        .from('v4_user_organizations')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      
      // Refresh the list
      await fetchUserOrganizations();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error removing user from organization:', error);
      alert('Failed to remove user from organization. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  const setPrimaryOrganization = async (assignmentId) => {
    try {
      setMakingPrimary(assignmentId);
      
      // Begin transaction with two operations:
      // 1. Set all organizations for this user to not primary
      // 2. Set the selected organization to primary
      
      // First reset all to non-primary
      const { error: resetError } = await supabase
        .from('v4_user_organizations')
        .update({ is_primary: false })
        .eq('user_id', user.id);
        
      if (resetError) throw resetError;
      
      // Then set the chosen one to primary
      const { error: updateError } = await supabase
        .from('v4_user_organizations')
        .update({ is_primary: true })
        .eq('id', assignmentId);
        
      if (updateError) throw updateError;
      
      // Refresh the list
      await fetchUserOrganizations();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error setting primary organization:', error);
      alert('Failed to set primary organization. Please try again.');
    } finally {
      setMakingPrimary(null);
    }
  };

  const availableOrganizations = organizations.filter(
    org => !userOrgs.some(userOrg => userOrg.organization_id === org.id)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.full_name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.username} {user.email ? `• ${user.email}` : ''}
          </p>
        </div>
        
        {/* Add organization dropdown and button */}
        <div className="flex space-x-2 w-full sm:w-auto">
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            disabled={availableOrganizations.length === 0 || assigning}
            className="flex-grow px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                     disabled:opacity-50"
          >
            <option value="">Select an organization</option>
            {availableOrganizations.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
          
          <button
            onClick={assignToOrganization}
            disabled={!selectedOrg || assigning}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black 
                     rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors
                     flex items-center disabled:opacity-50"
          >
            {assigning ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Plus className="w-4 h-4 mr-1" />
            )}
            Assign
          </button>
        </div>
      </div>
      
      {/* Current organizations list */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Assigned Organizations
        </h4>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : userOrgs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center bg-gray-50 dark:bg-gray-700/30 rounded-lg">
            This user is not assigned to any organization yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Organization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Primary
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {userOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {org.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {org.is_primary ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                          <Check className="w-3 h-3 mr-1" />
                          Primary
                        </span>
                      ) : (
                        <button
                          onClick={() => setPrimaryOrganization(org.id)}
                          disabled={makingPrimary !== null}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                   bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200
                                   hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                          {makingPrimary === org.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Star className="w-3 h-3 mr-1" />
                          )}
                          Make Primary
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => removeFromOrganization(org.id)}
                        disabled={removing !== null}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 
                                 flex items-center ml-auto disabled:opacity-50"
                      >
                        {removing === org.id ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-1" />
                        )}
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrgAssignment;
