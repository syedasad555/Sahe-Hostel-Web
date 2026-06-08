import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#10B981', '#EF4444'];

const FacultyMealStatsPage = ({
  totalStudentsInManagement = 0,
  studentsListLoading = false,
}) => {
  const [stats, setStats] = useState({ 
    veg: 0, 
    nonVeg: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchMealStats = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const token = localStorage.getItem('facultyToken');

      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }


      const response = await axios.get('/api/meals/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      
      setStats({
        veg: response.data.data.veg || 0,
        nonVeg: response.data.data['non-veg'] || 0,
        total: response.data.data.total || 0
      });
      
    } catch (error) {
      console.error('Error fetching faculty meal statistics:', error);
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
    const isAuthenticated = localStorage.getItem('facultyAuthenticated');
    if (!isAuthenticated) {
      navigate('/faculty/login');
      return;
    }

    fetchMealStats();
    const intervalId = setInterval(fetchMealStats, 30000);
    return () => clearInterval(intervalId);
  }, [navigate]);

  const chartData = [
    { 
      name: 'Veg', 
      value: stats.veg,
      count: stats.veg,
      percentage: stats.veg + stats.nonVeg > 0 
        ? Math.round((stats.veg / (stats.veg + stats.nonVeg)) * 100) 
        : 0
    },
    { 
      name: 'Non-Veg', 
      value: stats.nonVeg,
      count: stats.nonVeg,
      percentage: stats.veg + stats.nonVeg > 0 
        ? Math.round((stats.nonVeg / (stats.veg + stats.nonVeg)) * 100) 
        : 0
    }
  ];
  
  const totalMeals = stats.veg + stats.nonVeg;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const denominator = studentsListLoading ? null : totalStudentsInManagement;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Today&apos;s Meal Statistics</h1>
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-gray-800"
          title="Selections today vs total students shown in Student Management (same filters)."
        >
          <span className="font-medium text-gray-700">Voted today</span>
          <span className="font-bold text-amber-700">{stats.total}</span>
          <span className="text-gray-500">/</span>
          <span className="font-semibold">{denominator === null ? '…' : denominator}</span>
          <span className="text-gray-600">students</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Meal Selection Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => 
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} students`, '']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Summary</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium">Total Selections</h3>
                <p className="text-3xl font-bold">{stats.total}</p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                      <div className="flex justify-between w-full">
                        <span className="text-gray-700 font-medium">Veg Meals:</span>
                        <span className="ml-4 font-semibold">{stats.veg}</span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
                      <div className="flex justify-between w-full">
                        <span className="text-gray-700 font-medium">Non-Veg Meals:</span>
                        <span className="ml-4 font-semibold">{stats.nonVeg}</span>
                      </div>
                    </div>
                    <div className="pt-2 mt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-800 font-semibold">Total Meals:</span>
                        <span className="font-bold text-amber-600">{totalMeals}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyMealStatsPage;
