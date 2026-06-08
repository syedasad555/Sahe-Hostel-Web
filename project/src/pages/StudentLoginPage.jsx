import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, LogIn, User, Utensils } from 'lucide-react';

const StudentLoginPage = () => {
  const [rollNumber, setRollNumber] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

  const fieldClass =
    'block w-full pl-11 pr-4 py-3 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-[box-shadow,border-color] duration-150 ease-out placeholder-gray-400';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!rollNumber || !year) {
        setError('Please enter your roll/administration number and select your year');
        return;
      }

      // For 1st year students, they should have administration numbers, not N/A
      if (year === '1st Year') {
        if (rollNumber === 'N/A' || rollNumber.trim() === '') {
          setError('1st Year students must provide an administration number (not N/A)');
          return;
        }
      }

      
      // Call the actual API to authenticate student
      const normalizedRoll = rollNumber.trim().toUpperCase();
      const response = await axios.post('/api/students/login', {
        rollNumber: normalizedRoll,
        year
      });

      const { student, token } = response.data;
      
      // Store the authentication token and student info
      localStorage.setItem('token', token);
      localStorage.setItem('studentId', student._id);
      localStorage.setItem('studentRollNumber', student.rollNumber);
      localStorage.setItem('studentName', student.studentName);
      localStorage.setItem('studentYear', student.year);
      
      
      // Redirect to meal selection page
      navigate('/meal-selection');
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to log in. Please check your roll/administration number and try again.');
      
      // Clear any existing auth data on error
      localStorage.removeItem('token');
      localStorage.removeItem('studentId');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-amber-500 to-amber-600 px-8 pt-10 pb-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white -mt-8">
                <Utensils className="h-9 w-9 text-amber-600" />
              </div>
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-white">Student Portal</h2>
                <p className="text-amber-100 text-sm mt-2 font-medium">Access your meal preferences</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="px-8 pt-12 pb-8">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-5">
                {/* Year Selection */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <select
                    id="year"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className={`${fieldClass} appearance-none`}
                  >
                    <option value="">Select Year</option>
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Roll/Administration Number Field */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4.5 w-4.5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                  </div>
                  <input
                    id="rollNumber"
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    autoCapitalize="characters"
                    spellCheck={false}
                    className={`${fieldClass} uppercase`}
                    placeholder={year === '1st Year' ? 'Enter your administration number' : 'Enter your roll number'}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center py-3 px-6 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 shadow-lg hover:shadow-amber-200/40 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-4.5 w-4.5 text-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="-ml-1 mr-2 h-4.5 w-4.5" />
                      Sign In to Continue
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
      </div>
    </div>
  );
};

export default StudentLoginPage;
