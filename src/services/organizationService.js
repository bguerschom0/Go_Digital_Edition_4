import { supabase } from '../config/supabase';

/**
 * Fetch all organizations
 * @returns {Promise<Array>} Array of organizations
 */
export const fetchAllOrganizations = async () => {
  try {
    const { data, error } = await supabase
      .from('v4_organizations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

/**
 * Fetch a single organization by ID
 * @param {string} id - Organization ID
 * @returns {Promise<Object>} Organization data
 */
export const fetchOrganizationById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('v4_organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching organization with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new organization
 * @param {Object} orgData - Organization data
 * @returns {Promise<Object>} Created organization
 */
export const createOrganization = async (orgData) => {
  try {
    const { data, error } = await supabase
      .from('v4_organizations')
      .insert([orgData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

/**
 * Update an existing organization
 * @param {string} id - Organization ID
 * @param {Object} orgData - Updated organization data
 * @returns {Promise<Object>} Updated organization
 */
export const updateOrganization = async (id, orgData) => {
  try {
    const { data, error } = await supabase
      .from('v4_organizations')
      .update(orgData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating organization with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete an organization
 * @param {string} id - Organization ID
 * @returns {Promise<void>}
 */
export const deleteOrganization = async (id) => {
  try {
    const { error } = await supabase
      .from('v4_organizations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error(`Error deleting organization with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch users assigned to an organization
 * @param {string} orgId - Organization ID
 * @returns {Promise<Array>} Array of users
 */
export const fetchOrganizationUsers = async (orgId) => {
  try {
    const { data, error } = await supabase
      .from('v4_user_organizations')
      .select(`
        is_primary,
        users:user_id (
          id,
          username,
          full_name,
          email,
          is_active
        )
      `)
      .eq('organization_id', orgId);

    if (error) throw error;
    
    // Transform the data to a more usable format
    return data.map(item => ({
      ...item.users,
      is_primary: item.is_primary
    })) || [];
  } catch (error) {
    console.error(`Error fetching users for organization ${orgId}:`, error);
    throw error;
  }
};

/**
 * Fetch organizations a user belongs to
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of organizations
 */
export const fetchUserOrganizations = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('v4_user_organizations')
      .select(`
        is_primary,
        organizations:organization_id (
          id,
          name,
          contact_person,
          email,
          phone,
          is_active
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    
    // Transform the data to a more usable format
    return data.map(item => ({
      ...item.organizations,
      is_primary: item.is_primary
    })) || [];
  } catch (error) {
    console.error(`Error fetching organizations for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Assign a user to an organization
 * @param {string} userId - User ID
 * @param {string} orgId - Organization ID
 * @param {boolean} isPrimary - Whether this is the user's primary organization
 * @returns {Promise<Object>} Assignment data
 */
export const assignUserToOrganization = async (userId, orgId, isPrimary = false) => {
  try {
    // If making this the primary organization, first reset any existing primary
    if (isPrimary) {
      await supabase
        .from('v4_user_organizations')
        .update({ is_primary: false })
        .eq('user_id', userId);
    }
    
    // Create the assignment
    const { data, error } = await supabase
      .from('v4_user_organizations')
      .insert([{
        user_id: userId,
        organization_id: orgId,
        is_primary: isPrimary
      }])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error(`Error assigning user ${userId} to organization ${orgId}:`, error);
    throw error;
  }
};

/**
 * Remove a user from an organization
 * @param {string} userId - User ID
 * @param {string} orgId - Organization ID
 * @returns {Promise<void>}
 */
export const removeUserFromOrganization = async (userId, orgId) => {
  try {
    const { error } = await supabase
      .from('v4_user_organizations')
      .delete()
      .eq('user_id', userId)
      .eq('organization_id', orgId);

    if (error) throw error;
    
    // Check if this was the user's primary organization
    const { data: remaining } = await supabase
      .from('v4_user_organizations')
      .select('id')
      .eq('user_id', userId);
      
    // If user still has organizations but no primary, set the first one as primary
    if (remaining && remaining.length > 0) {
      const { data: hasAnyPrimary } = await supabase
        .from('v4_user_organizations')
        .select('id')
        .eq('user_id', userId)
        .eq('is_primary', true);
        
      if (!hasAnyPrimary || hasAnyPrimary.length === 0) {
        await supabase
          .from('v4_user_organizations')
          .update({ is_primary: true })
          .eq('id', remaining[0].id);
      }
    }
  } catch (error) {
    console.error(`Error removing user ${userId} from organization ${orgId}:`, error);
    throw error;
  }
};

/**
 * Set a user's primary organization
 * @param {string} userId - User ID
 * @param {string} orgId - Organization ID to set as primary
 * @returns {Promise<void>}
 */
export const setPrimaryOrganization = async (userId, orgId) => {
  try {
    // First, set all to false
    await supabase
      .from('v4_user_organizations')
      .update({ is_primary: false })
      .eq('user_id', userId);
      
    // Then set the selected one to true
    const { error } = await supabase
      .from('v4_user_organizations')
      .update({ is_primary: true })
      .eq('user_id', userId)
      .eq('organization_id', orgId);

    if (error) throw error;
  } catch (error) {
    console.error(`Error setting primary organization for user ${userId}:`, error);
    throw error;
  }
};
