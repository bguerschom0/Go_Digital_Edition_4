import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Users, AlertCircle, Clock, CheckCircle, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { StatCard } from '../../components/StatCard';

const SecurityGuardDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeVisitors: 0,
    scheduledVisits: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};
  
  useEffect(() => {
    fetchSecurityDashboardData();
  }, []);

  const fetchSecurityDashboardData = async () => {
    try {
      setLoading(true);


      const { count: activeVisitors } = await supabase
        .from('visitors')
        .select('*', { count: 'exact' })
        .is('check_out_time', null);


      const { count: scheduledVisits } = await supabase
        .from('scheduled_visitors')
        .select('*', { count: 'exact' })
        .gte('visit_end_date', new Date().toISOString());

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('visitors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentActivity(activityData || []);
      setStats({
        activeVisitors,
        scheduledVisits,
      });

    } catch (error) {
      console.error('Error fetching security dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {getGreeting()}, {user?.full_name}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Welcome to Visitor Management Platform!
              </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Active Visitors"
                value={stats.activeVisitors}
                icon={<Users size={24} className="text-gray-600 dark:text-gray-300" />}
              />
              <StatCard
                title="Scheduled Visits"
                value={stats.scheduledVisits}
                icon={<Calendar size={24} className="text-gray-600 dark:text-gray-300" />}
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Recent Activity
              </h3>
              <div className="overflow-hidden">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visit Purpose
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Visitor
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentActivity.map((activity, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {activity.purpose}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.full_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityGuardDashboard;
