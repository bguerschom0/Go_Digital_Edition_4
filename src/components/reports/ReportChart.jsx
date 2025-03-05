import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const ReportChart = ({
  type = 'bar',
  data = [],
  width = '100%',
  height = 300,
  dataKey,
  nameKey = 'name',
  xAxisKey = 'name',
  layout = 'horizontal',
  colors = COLORS,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  customTooltip = null,
  customLegend = null,
  title = null,
  subtitle = null
}) => {
  // Handle multiple data keys for line/bar/area charts
  const parseDataKeys = () => {
    if (typeof dataKey === 'string') {
      // Handle comma-separated keys
      return dataKey.split(',').map(key => key.trim());
    }
    if (Array.isArray(dataKey)) {
      return dataKey;
    }
    return [dataKey];
  };
  
  const dataKeys = parseDataKeys();
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-md shadow-md">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' 
                ? entry.value.toLocaleString() 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  // Render appropriate chart based on type
  const renderChart = () => {
    switch (type.toLowerCase()) {
      case 'bar':
        return (
          <BarChart
            data={data}
            layout={layout}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            
            {layout === 'vertical' ? (
              <>
                <XAxis type="number" />
                <YAxis dataKey={xAxisKey} type="category" width={120} />
              </>
            ) : (
              <>
                <XAxis dataKey={xAxisKey} />
                <YAxis />
              </>
            )}
            
            {showTooltip && (customTooltip ? customTooltip : <Tooltip content={<CustomTooltip />} />)}
            {showLegend && (customLegend ? customLegend : <Legend />)}
            
            {dataKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={colors[index % colors.length]} 
                name={key} 
              />
            ))}
          </BarChart>
        );
        
      case 'line':
        return (
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && (customTooltip ? customTooltip : <Tooltip content={<CustomTooltip />} />)}
            {showLegend && (customLegend ? customLegend : <Legend />)}
            
            {dataKeys.map((key, index) => (
              <Line 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[index % colors.length]} 
                activeDot={{ r: 8 }}
                name={key}
              />
            ))}
          </LineChart>
        );
        
      case 'area':
        return (
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            {showTooltip && (customTooltip ? customTooltip : <Tooltip content={<CustomTooltip />} />)}
            {showLegend && (customLegend ? customLegend : <Legend />)}
            
            {dataKeys.map((key, index) => (
              <Area 
                key={key} 
                type="monotone" 
                dataKey={key} 
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]} 
                fillOpacity={0.3}
                name={key}
              />
            ))}
          </AreaChart>
        );
        
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKeys[0]} // Use first data key for pie chart
              nameKey={nameKey}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color || colors[index % colors.length]} 
                />
              ))}
            </Pie>
            {showTooltip && (customTooltip ? customTooltip : <Tooltip content={<CustomTooltip />} />)}
            {showLegend && (customLegend ? customLegend : <Legend />)}
          </PieChart>
        );
        
      default:
        return <div>Unsupported chart type: {type}</div>;
    }
  };
  
  return (
    <div className="w-full">
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      )}
      
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width={width} height={height}>
          {renderChart()}
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ReportChart;
