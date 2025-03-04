import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { Search, Plus, X, Loader2 } from 'lucide-react';

const OrganizationSelector = ({ value, onChange, error, allowCreate = true }) => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOrgs, setFilteredOrgs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [addingOrg, setAddingOrg] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch organizations from the database
  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('name')
          .order('name');
          
        if (error) throw error;
        setOrganizations(data?.map(org => org.name) || []);
        setFilteredOrgs(data?.map(org => org.name) || []);
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganizations();
  }, []);

  // Filter organizations based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOrgs(organizations);
      setShowAddNew(false);
      return;
    }
    
    const filtered = organizations.filter(org => 
      org.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredOrgs(filtered);
    
    // Show "Add New" option if no exact match and creation is allowed
    const exactMatch = organizations.some(org => 
      org.toLowerCase() === searchTerm.toLowerCase()
    );
    
    setShowAddNew(allowCreate && !exactMatch && searchTerm.length > 0);
  }, [searchTerm, organizations, allowCreate]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create a new organization
  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) return;
    
    setAddingOrg(true);
    
    try {
      // Check if organization already exists
      const { data: existingOrg, error: checkError } = await supabase
        .from('organizations')
        .select('name')
        .eq('name', newOrgName)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "no rows returned"
        throw checkError;
      }
      
      if (existingOrg) {
        // Organization already exists, just select it
        onChange(existingOrg.name);
        setIsOpen(false);
        setNewOrgName('');
        return;
      }
      
      // Create new organization
      const { data, error } = await supabase
        .from('organizations')
        .insert([{ name: newOrgName, is_active: true }])
        .select('name')
        .single();
        
      if (error) throw error;
      
      // Add to local list and select it
      setOrganizations(prev => [...prev, data.name].sort());
      onChange(data.name);
      setIsOpen(false);
      setNewOrgName('');
    } catch (error) {
      console.error('Error creating organization:', error);
    } finally {
      setAddingOrg(false);
    }
  };

  // Select an organization
  const handleSelectOrganization = (org) => {
    onChange(org);
    setIsOpen(false);
  };

  // Clear selection
  const handleClearSelection = () => {
    onChange('');
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search organizations..."
          className={`w-full px-4 py-2 pr-10 rounded-lg border ${
            error
              ? 'border-red-500 dark:border-red-500'
              : 'border-gray-200 dark:border-gray-700'
          } bg-white dark:bg-gray-900 text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
        />
        
        {/* Show the selected value */}
        {value && value !== searchTerm && (
          <div className="absolute inset-0 flex items-center px-4 py-2 bg-white dark:bg-gray-900 rounded-lg">
            <span className="flex-grow truncate">{value}</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {/* Search icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
              Loading organizations...
            </div>
          ) : filteredOrgs.length === 0 && !showAddNew ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              No organizations found
            </div>
          ) : (
            <ul className="py-1">
              {filteredOrgs.map((org) => (
                <li key={org}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSelectOrganization(org)}
                  >
                    {org}
                  </button>
                </li>
              ))}
              
              {/* Add new organization option */}
              {showAddNew && (
                <li className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                  {addingOrg ? (
                    <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Creating organization...
                    </div>
                  ) : (
                    <div className="px-4 py-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Add new organization
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                          placeholder="Organization name"
                          className="flex-grow px-3 py-1 text-sm rounded-md border border-gray-200 dark:border-gray-700 
                                   bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                                   focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                        />
                        <button
                          type="button"
                          onClick={handleCreateOrganization}
                          disabled={!newOrgName.trim()}
                          className="px-3 py-1 text-sm bg-black text-white dark:bg-white dark:text-black rounded-md
                                  hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationSelector;
