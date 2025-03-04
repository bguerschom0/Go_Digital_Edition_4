import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Search, 
  Building, 
  Users,
  ArrowLeft,
  Loader2,
  UserPlus,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../hooks/useAuth';
import UserOrgAssignment from '../../components/organizations/UserOrgAssignment';

// Utility function to validate UUID format
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const OrganizationUsers = () => {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  
  // Correctly extract query parameters
  const queryParams = new URLSearchParams(location.search);
  const orgId = queryParams.get('org'); // Will be null if not present
  
  const [orgUsers, setOrgUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(orgId || 'all');
  const [currentOrg, setCurrentOrg] = useState(null);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [orgId]);

  // Update filtered users when search or org filter changes
  useEffect(() => {
    filterUsers();
  }, [searchTerm, selectedOrg, orgUsers]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all organizations for dropdown
      const { data: orgsData, error: orgsError } = await supabase
        .from('v4_organizations')
        .select('*')
        .order('name');
        
      if (orgsError) throw orgsError;
      setOrganizations(orgsData || []);
      
      // If we have a specific org ID in the URL
      if (orgId && isValidUUID(orgId)) {
        // Find the org details
        const organization = orgsData.find(org => org.id === orgId);
        if (organization) {
          setCurrentOrg(organization);
          setSelectedOrg(orgId);
        } else {
          setError(`Organization with ID ${orgId} not found`);
        }
      }
      
      // Fetch users with organization role
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('user_role_v4', 'organization');
        
      if (usersError) throw usersError;
      setOrgUsers(usersData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    // Start with all users
    let filtered = [...orgUsers];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.full_name && user.full_name.toLowerCase().includes(term)) ||
        (user.username && user.username.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term))
      );
    }
    
    setFilteredUsers(filtered);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleOrgFilterChange = (e) => {
    const value = e.target.value;
    setSelectedOrg(value);
    
    // Update URL without reloading page
    const url = new URL(window.location.href);
    if (value === 'all') {
      url.searchParams.delete('org');
    } else {
      url.searchParams.set('org', value);
    }
    window.history.pushState({}, '', url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          to="/organizations"
          className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Organizations
        </Link>
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <Users className="w-6 h-6 mr-2" />
              {currentOrg 
                ? `Users in ${currentOrg.name}` 
                : 'Organization User Management'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Assign users to organizations and set their access levels
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search filter */}
            <div className="flex-grow">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, username, or email..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                           bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>
            </div>

            {/* Organization filter */}
            <div className="md:w-64">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Organization
              </label>
              <select
                value={selectedOrg}
                onChange={handleOrgFilterChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              >
                <option value="all">All Organizations</option>
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
              No users found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchTerm
                ? `No users match "${searchTerm}". Try adjusting your search criteria.`
                : 'There are no users with organization role. Create users and assign them the organization role first.'}
            </p>
          </div>
        ) : (
          <div>
            {filteredUsers.map((user) => (
              <UserOrgAssignment
                key={user.id}
                user={user}
                organizations={organizations}
                onRefresh={handleRefresh}
                // If we're filtering for a specific org, pass it to highlight in the component
                highlightOrgId={selectedOrg !== 'all' ? selectedOrg : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationUsers;
