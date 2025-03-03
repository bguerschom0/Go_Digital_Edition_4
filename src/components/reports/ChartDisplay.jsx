import React from 'react';
import {
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Table
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format } from 'date-fns';

// Color constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#e45756', '#59a14f', '#f28e2b', '#4e79a7'];

const ChartDisplay = ({ reportType, setReportType, chartField, setChartField, reportData, isPreview = true }) => {
  // If this is just for selecting chart type
  if (isPreview) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Report Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setReportType('table')}
              className={`p-2 flex items-center justify-center gap-2 rounded-lg ${
                reportType === 'table' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <Table className="h-4 w-4" />
              Table
            </button>
            
            <button
              onClick={() => setReportType('bar')}
              className={`p-2 flex items-center justify-center gap-2 rounded-lg ${
                reportType === 'bar' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <BarChartIcon className="h-4 w-4" />
              Bar Chart
            </button>
            
            <button
              onClick={() => setReportType('pie')}
              className={`p-2 flex items-center justify-center gap-2 rounded-lg ${
                reportType === 'pie' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <PieChartIcon className="h-4 w-4" />
              Pie Chart
            </button>
            
            <button
              onClick={() => setReportType('line')}
              className={`p-2 flex items-center justify-center gap-2 rounded-lg ${
                reportType === 'line' 
                  ? 'bg-black text-white dark:bg-white dark:text-black' 
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <LineChartIcon className="h-4 w-4" />
              Line Chart
            </button>
          </div>
        </div>
        
        {reportType !== 'table' && reportType !== 'line' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chart Field
            </label>
            <select
              value={chartField}
              onChange={(e) => setChartField(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            >
              <option value="status">Status</option>
              <option value="priority">Priority</option>
              <option value="sender_name">Organization</option>
            </select>
          </div>
        )}
      </div>
    );
  }
  
  // For rendering actual charts
  // Format status for display
  const formatStatus = (status) => {
    return status?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Generate chart data
  const generateChartData = (field) => {
    if (!reportData || reportData.length === 0) return [];
    
    // Count occurrences
    const counts = {};
    
    reportData.forEach(item => {
      const value = item[field] || 'Unknown';
      counts[value] = (counts[value] || 0) + 1;
    });
    
    // Convert to array
    return Object.entries(counts).map(([name, value]) => ({
      name: field === 'status' ? formatStatus(name) : 
           (name.charAt(0).toUpperCase() + name.slice(1)),
      value
    }));
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
              {entry.name}: {entry.value}
              {entry.name === 'Completion Rate' ? '%' : ''}
              {entry.name === 'Avg. Response Time' ? ' days' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Render charts based on type
  if (reportType === 'bar') {
    const chartData = generateChartData(chartField);
    
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">
            No data available for chart
          </p>
        </div>
      );
    }
    
    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end"
              tick={{ fontSize: 12 }}
              height={70}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="value" name="Count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  } else if (reportType === 'pie') {
    const chartData = generateChartData(chartField);
    
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">
            No data available for chart
          </p>
        </div>
      );
    }
    
    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  } else if (reportType === 'line') {
    // For line charts, we need time-based data
    // Let's use created_at and group by month
    
    // Check if we have enough data for a meaningful line chart
    if (!reportData || reportData.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">
            Not enough data for a line chart. Need at least 2 data points.
          </p>
        </div>
      );
    }
    
    // Group by month
    const monthlyData = {};
    
    reportData.forEach(item => {
      if (!item.created_at) return;
      
      const date = new Date(item.created_at);
      const monthYear = format(date, 'MMM yyyy');
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { month: monthYear, count: 0 };
      }
      
      monthlyData[monthYear].count += 1;
    });
    
    // Convert to array and sort by date
    const lineData = Object.values(monthlyData).sort((a, b) => {
      return new Date(a.month) - new Date(b.month);
    });
    
    if (lineData.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-gray-500 dark:text-gray-400">
            Not enough time-based data for a line chart.
          </p>
        </div>
      );
    }
    
    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={lineData}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="count" name="Request Count" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  
  // Default (shouldn't happen, but just in case)
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <p className="text-gray-500 dark:text-gray-400">
        Please select a chart type
      </p>
    </div>
  );
};

export default ChartDisplay;
