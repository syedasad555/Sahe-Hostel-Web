import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Download, RefreshCw } from 'lucide-react';
import axios from 'axios';

const COLORS = ['#10B981', '#EF4444'];

const MealReportPage = () => {
  const [stats, setStats] = useState({
    veg: 0,
    'non-veg': 0,
    total: 0,
    lastUpdated: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMealStats = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      const response = await axios.get('/api/meals/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setStats({
        ...response.data.data,
        lastUpdated: new Date().toLocaleTimeString()
      });
    } catch (error) {
      console.error('Error fetching meal statistics:', error);
      if (error.response?.status === 401) {
        setError('Authentication expired. Please log in again.');
      } else {
        setError('Failed to load meal statistics. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMealStats();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchMealStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const data = [
    { name: 'Veg', value: stats.veg },
    { name: 'Non-Veg', value: stats['non-veg'] },
  ];

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const handleDownloadReport = () => {
    // Create a CSV content
    const vegPercentage = stats.total > 0 ? ((stats.veg / stats.total) * 100).toFixed(1) : '0';
    const nonVegPercentage = stats.total > 0 ? ((stats['non-veg'] / stats.total) * 100).toFixed(1) : '0';
    
    const csvContent = `data:text/csv;charset=utf-8,Meal Type,Count,Percentage\n` +
      `Veg,${stats.veg},${vegPercentage}%\n` +
      `Non-Veg,${stats['non-veg']},${nonVegPercentage}%\n` +
      `Total,${stats.total},100%`;
    
    // Create a download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `meal-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meal statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-xl shadow-md">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchMealStats}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <RefreshCw className="-ml-1 mr-2 h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Meal Selection Report</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Real-time statistics of meal selections
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={fetchMealStats}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <RefreshCw className="-ml-0.5 mr-2 h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={handleDownloadReport}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
              >
                <Download className="-ml-0.5 mr-2 h-4 w-4" />
                Export
              </button>
            </div>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <div className="h-80 md:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value} (${(value / stats.total * 100).toFixed(1)}%)`,
                          name
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Summary</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Veg Meals</span>
                      </div>
                      <span className="text-sm font-semibold">{stats.veg}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Non-Veg Meals</span>
                      </div>
                      <span className="text-sm font-semibold">{stats['non-veg']}</span>
                    </div>
                    
                    <div className="border-t border-gray-200 my-2"></div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total Selections</span>
                      <span className="text-sm font-semibold">{stats.total}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Last Updated</h4>
                  <p className="text-2xl font-semibold text-blue-900">
                    {stats.lastUpdated || 'N/A'}
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    Updates automatically every 30 seconds
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Meal Selection Schedule</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Selection Window</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Tuesday: 6:00 PM - 11:00 PM</li>
                    <li>Wednesday: 6:00 AM - 11:00 AM</li>
                  </ul>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Current Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Live
                  </span>
                  <span className="ml-2 text-gray-500 text-sm">
                    Next update in 30 seconds
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealReportPage;
