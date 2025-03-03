import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  CheckCircle 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Stats Card Component
const StatCard = ({ title, value, icon, change, changeType }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{value}</h3>
      </div>
      <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700">
        {icon}
      </div>
    </div>
    {change && (
      <div className="mt-4 flex items-center">
        <span className={`text-sm ${
          changeType === 'increase' ? 'text-green-500' : 'text-red-500'
        }`}>
          {changeType === 'increase' ? '↑' : '↓'} {change}%
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">vs last month</span>
      </div>
    )}
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalVisitors: 0,
    activeVisitors: 0,
    scheduledVisits: 0,
    completedVisits: 0
  });
  const [departmentStats, setDepartmentStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch total visitors
      const { count: totalVisitors } = await supabase
        .from('visitors')
        .select('*', { count: 'exact' });

      // Fetch active visitors
      const { count: activeVisitors } = await supabase
        .from('visitors')
        .select('*', { count: 'exact' })
        .is('check_out_time', null);

      // Fetch scheduled visits
      const { count: scheduledVisits } = await supabase
        .from('scheduled_visitors')
        .select('*', { count: 'exact' })
        .gte('visit_end_date', new Date().toISOString());

      // Fetch monthly visits for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('visitors')
        .select('check_in_time')
        .gte('check_in_time', sixMonthsAgo.toISOString())
        .order('check_in_time', { ascending: true });

      if (monthlyError) throw monthlyError;

      // Process monthly data
      const monthlyVisits = monthlyData.reduce((acc, visit) => {
        const month = new Date(visit.check_in_time).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      const monthlyStatsArray = Object.entries(monthlyVisits).map(([month, count]) => ({
        month,
        visits: count
      }));

      setMonthlyStats(monthlyStatsArray);

      // Fetch department distribution
      const { data: departmentData, error: departmentError } = await supabase
        .from('visitors')
        .select('department')
        .not('department', 'is', null);

      if (departmentError) throw departmentError;

      // Process department data
      const departmentCounts = departmentData.reduce((acc, { department }) => {
        acc[department] = (acc[department] || 0) + 1;
        return acc;
      }, {});

      const departmentStatsArray = Object.entries(departmentCounts).map(([name, value]) => ({
        name,
        value
      }));

      setDepartmentStats(departmentStatsArray);
      setStats({
        totalVisitors,
        activeVisitors,
        scheduledVisits,
        completedVisits: totalVisitors - activeVisitors
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
                Welcome back, {user?.full_name || 'User'}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Here's what's happening with your visitors today
              </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Visitors"
                value={stats.totalVisitors}
                icon={
                  <Users 
                    size={24}
                    className="text-gray-600 dark:text-gray-300" 
                  />
                }
                change={12}
                changeType="increase"
              />
              <StatCard
                title="Active Visitors"
                value={stats.activeVisitors}
                icon={
                  <UserCheck 
                    size={24}
                    className="text-gray-600 dark:text-gray-300" 
                  />
                }
              />
              <StatCard
                title="Scheduled Visits"
                value={stats.scheduledVisits}
                icon={
                  <Calendar 
                    size={24}
                    className="text-gray-600 dark:text-gray-300" 
                  />
                }
                change={5}
                changeType="increase"
              />
              <StatCard
                title="Completed Visits"
                value={stats.completedVisits}
                icon={
                  <CheckCircle 
                    size={24}
                    className="text-gray-600 dark:text-gray-300" 
                  />
                }
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Visits Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Monthly Visits
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: '#666' }}
                      />
                      <YAxis 
                        tick={{ fill: '#666' }}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="visits" 
                        fill="#000000" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Department Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Visits by Department
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {departmentStats.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
