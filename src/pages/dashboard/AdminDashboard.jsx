import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, UserCheck, Calendar, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { StatCard } from '../../components/StatCard';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalGuards: 0,
    systemUptime: 0
  });
  const [userRoleStats, setUserRoleStats] = useState([]);
  const [systemStats, setSystemStats] = useState([]);
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
    fetchAdminDashboardData();
  }, []);

  const fetchAdminDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch user statistics
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Fetch active users
      const { count: activeUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('is_active', true);

      // Fetch security guard count
      const { count: totalGuards } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .eq('role', 'security_guard');

      // Fetch user role distribution
      const { data: roleData } = await supabase
        .from('users')
        .select('role');

      // Process role distribution data
      const roleCounts = roleData.reduce((acc, { role }) => {
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      const roleStatsArray = Object.entries(roleCounts).map(([name, value]) => ({
        name,
        value
      }));

      setUserRoleStats(roleStatsArray);
      setStats({
        totalUsers,
        activeUsers,
        totalGuards,
      });

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
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
                title="Total Users"
                value={stats.totalUsers}
                icon={<Users size={24} className="text-gray-600 dark:text-gray-300" />}
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers}
                icon={<UserCheck size={24} className="text-gray-600 dark:text-gray-300" />}
              />
              <StatCard
                title="Security Guards"
                value={stats.totalGuards}
                icon={<Calendar size={24} className="text-gray-600 dark:text-gray-300" />}
              />
            </div>

            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
