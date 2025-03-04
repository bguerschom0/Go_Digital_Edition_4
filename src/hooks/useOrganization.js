import { useState } from 'react';
import * as organizationService from '../services/organizationService';

/**
 * Custom hook for organization operations
 * @returns {Object} Organization methods and state
 */
const useOrganization = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get all organizations
   * @returns {Promise<Array>} Array of organizations
   */
  const getAllOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.fetchAllOrganizations();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get a single organization by ID
   * @param {string} id - Organization ID
   * @returns {Promise<Object>} Organization data
   */
  const getOrganizationById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.fetchOrganizationById(id);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new organization
   * @param {Object} orgData - Organization data
   * @returns {Promise<Object>} Created organization
   */
  const createOrganization = async (orgData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.createOrganization(orgData);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an existing organization
   * @param {string} id - Organization ID
   * @param {Object} orgData - Updated organization data
   * @returns {Promise<Object>} Updated organization
   */
  const updateOrganization = async (id, orgData) => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.updateOrganization(id, orgData);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an organization
   * @param {string} id - Organization ID
   * @returns {Promise<void>}
   */
  const deleteOrganization = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await organizationService.deleteOrganization(id);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get users assigned to an organization
   * @param {string} orgId - Organization ID
   * @returns {Promise<Array>} Array of users
   */
  const getOrganizationUsers = async (orgId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.fetchOrganizationUsers(orgId);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get organizations a user belongs to
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of organizations
   */
  const getUserOrganizations = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.fetchUserOrganizations(userId);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Assign a user to an organization
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @param {boolean} isPrimary - Whether this is the user's primary organization
   * @returns {Promise<Object>} Assignment data
   */
  const assignUserToOrganization = async (userId, orgId, isPrimary = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await organizationService.assignUserToOrganization(userId, orgId, isPrimary);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove a user from an organization
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID
   * @returns {Promise<void>}
   */
  const removeUserFromOrganization = async (userId, orgId) => {
    setLoading(true);
    setError(null);
    try {
      await organizationService.removeUserFromOrganization(userId, orgId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Set a user's primary organization
   * @param {string} userId - User ID
   * @param {string} orgId - Organization ID to set as primary
   * @returns {Promise<void>}
   */
  const setPrimaryOrganization = async (userId, orgId) => {
    setLoading(true);
    setError(null);
    try {
      await organizationService.setPrimaryOrganization(userId, orgId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getOrganizationUsers,
    getUserOrganizations,
    assignUserToOrganization,
    removeUserFromOrganization,
    setPrimaryOrganization
  };
};

export default useOrganization;
