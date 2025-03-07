import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { Building, Mail, Phone, MapPin, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

const OrganizationProfile = () => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        
        // First get the user's organization association
        const { data: userOrgData, error: userOrgError } = await supabase
          .from('v4_user_organizations')
          .select('organization_id, is_primary')
          .eq('user_id', user.id)
          .order('is_primary', { ascending: false })
          .limit(1);
          
        if (userOrgError) throw userOrgError;
        
        if (!userOrgData || userOrgData.length === 0) {
          setError('You are not associated with any organization');
          setLoading(false);
          return;
        }
        
        // Then get the organization details
        const { data: orgData, error: orgError } = await supabase
          .from('v4_organizations')
          .select('*')
          .eq('id', userOrgData[0].organization_id)
          .single();
          
        if (orgError) throw orgError;
        
        setOrganization(orgData);
      } catch (error) {
        console.error('Error fetching organization:', error);
        setError('Failed to load organization information');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchOrganization();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <div className="text-center">
            <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Organization Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Organization Profile</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          {/* Organization Header */}
          <div className="p-6 bg-blue-500 dark:bg-blue-600">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-white dark:bg-gray-800 rounded-full p-3">
                  <Building className="h-8 w-8 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-white ml-4">
                  {organization.name}
                </h2>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                Active
              </div>
            </div>
          </div>
          
          {/* Organization Details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {organization.contact_person && (
                <div className="flex items-start">
                  <User className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Person</p>
                    <p className="text-base text-gray-900 dark:text-white">{organization.contact_person}</p>
                  </div>
                </div>
              )}
              
              {organization.email && (
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Address</p>
                    <p className="text-base text-gray-900 dark:text-white">{organization.email}</p>
                  </div>
                </div>
              )}
              
              {organization.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone Number</p>
                    <p className="text-base text-gray-900 dark:text-white">{organization.phone}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
                  <p className="text-base text-gray-900 dark:text-white">
                    {format(new Date(organization.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
            
            {organization.address && (
              <div className="mt-6">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                    <p className="text-base text-gray-900 dark:text-white whitespace-pre-line">
                      {organization.address}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Request Stats */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request Statistics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">--</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-500">--</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfile;
