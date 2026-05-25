import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Utensils, AlertCircle } from 'lucide-react';
import axios from 'axios';

const MealSelectionPage = () => {
  const [selectedMeal, setSelectedMeal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [existingSelection, setExistingSelection] = useState(null);
  const navigate = useNavigate();

  // Check for existing meal selection when component mounts
  useEffect(() => {
    const checkExistingSelection = () => {
      const studentId = localStorage.getItem('studentId');
      const today = new Date().toISOString().split('T')[0];
      
      if (!studentId) {
        setMessage({
          type: 'error',
          text: 'Please log in to select a meal.'
        });
        return;
      }
      
      const storedSelection = localStorage.getItem(`mealSelection_${studentId}_${today}`);
      
      if (storedSelection) {
        try {
          const { mealType, timestamp } = JSON.parse(storedSelection);
          setExistingSelection(mealType);
          setMessage({
            type: 'info',
            text: `You have already selected ${mealType} meal for today.`
          });
          setHasSubmitted(true);
        } catch (error) {
          console.error('Error parsing stored selection:', error);
          // Clear invalid stored data
          localStorage.removeItem(`mealSelection_${studentId}_${today}`);
        }
      }
      
      // Keep selection open for demo purposes
      setIsSelectionOpen(true);
    };
    
    checkExistingSelection();
  }, []);

  const handleMealSelect = (mealType) => {
    setSelectedMeal(mealType);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const studentId = localStorage.getItem('studentId');
    const today = new Date().toISOString().split('T')[0];
    
    if (!studentId) {
      setMessage({
        type: 'error',
        text: 'Please log in to select a meal.'
      });
      return;
    }
    
    // Double-check for existing selection
    const storedSelection = localStorage.getItem(`mealSelection_${studentId}_${today}`);
    if (storedSelection) {
      try {
        const { mealType } = JSON.parse(storedSelection);
        setExistingSelection(mealType);
        setMessage({
          type: 'error',
          text: `You have already selected ${mealType} meal for today.`
        });
        setHasSubmitted(true);
        return;
      } catch (error) {
        console.error('Error parsing stored selection:', error);
        // Clear invalid stored data
        localStorage.removeItem(`mealSelection_${studentId}_${today}`);
      }
    }
    
    if (hasSubmitted || existingSelection) {
      setMessage({
        type: 'error',
        text: `You have already selected a meal for today.`
      });
      return;
    }
    
    if (!selectedMeal) {
      setMessage({
        type: 'error',
        text: 'Please select a meal option.'
      });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Get the current student ID and auth token from local storage
      const studentId = localStorage.getItem('studentId');
      const token = localStorage.getItem('token');
      
      console.log('Auth debug - Student ID:', studentId);
      console.log('Auth debug - Token exists:', !!token);
      console.log('Auth debug - Token format:', token ? token.substring(0, 20) + '...' : 'none');
      
      if (!studentId || !token) {
        console.error('Authentication failed - Missing credentials');
        setMessage({
          type: 'error',
          text: 'Your session has expired. Please log in again.'
        });
        // Redirect to login after a short delay
        setTimeout(() => navigate('/student/login'), 2000);
        return;
      }
      
      // Check if token looks like a real JWT (has 3 parts separated by dots)
      if (!token.includes('.') || token.split('.').length !== 3) {
        console.error('Invalid token format - clearing and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('studentId');
        setMessage({
          type: 'error',
          text: 'Your session is invalid. Please log in again.'
        });
        setTimeout(() => navigate('/student/login'), 2000);
        return;
      }
      
      // Call the real API to submit meal selection
      console.log('Submitting meal selection to API:', { studentId, selectedMeal });
      
      const response = await axios.post('/api/meals/select', 
        { studentId, mealType: selectedMeal },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Meal selection response:', response.data);
      
      setMessage({
        type: 'success',
        text: response.data.message || `Success! Your ${selectedMeal} meal has been selected.`
      });
      
      setHasSubmitted(true);
      setExistingSelection(selectedMeal);
      
      // Redirect to home after a short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error submitting meal selection:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || 'Failed to submit meal selection. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-6">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
            <Utensils className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Meal</h2>
          <p className="text-gray-600">
            {isSelectionOpen 
              ? 'Please choose your meal option for today.'
              : 'Meal selection is currently closed.'}
          </p>
        </div>

        {message.text && (
          <div 
            className={`mb-6 p-4 rounded-md ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700' 
                : message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === 'error' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            </div>
          </div>
        )}

        {isSelectionOpen && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => handleMealSelect('veg')}
                className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-[border-color,background-color] duration-150 ${
                  selectedMeal === 'veg'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-xl">🌱</span>
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-lg font-medium text-gray-900">Veg Meal</h3>
                    <p className="text-sm text-gray-500">Fresh vegetarian options</p>
                  </div>
                </div>
                {selectedMeal === 'veg' && (
                  <div className="flex-shrink-0 text-green-500">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleMealSelect('non-veg')}
                className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-[border-color,background-color] duration-150 ${
                  selectedMeal === 'non-veg'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-xl">🍗</span>
                  </div>
                  <div className="ml-4 text-left">
                    <h3 className="text-lg font-medium text-gray-900">Non-Veg Meal</h3>
                    <p className="text-sm text-gray-500">Includes meat options</p>
                  </div>
                </div>
                {selectedMeal === 'non-veg' && (
                  <div className="flex-shrink-0 text-red-500">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                )}
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !selectedMeal}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isSubmitting || !selectedMeal
                    ? 'bg-amber-300 cursor-not-allowed'
                    : 'bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Selection'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
          <button
            onClick={() => navigate('/')}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            Back to Home
          </button>
          <p className="text-xs text-center text-gray-500">
            Meal selection is available on Tuesday (6:00 PM - 11:00 PM) and Wednesday (6:00 AM - 11:00 AM)
          </p>
        </div>
      </div>
    </div>
  );
};

export default MealSelectionPage;
