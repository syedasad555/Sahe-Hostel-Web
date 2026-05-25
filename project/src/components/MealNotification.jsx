import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Utensils } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import StudentLoginPage from '../pages/StudentLoginPage';

// Add animation styles
const animationStyles = `
  @keyframes subtle-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
`;

// Create style element
const styleElement = document.createElement('style');
styleElement.type = 'text/css';
if (styleElement.styleSheet) {
  styleElement.styleSheet.cssText = animationStyles;
} else {
  styleElement.appendChild(document.createTextNode(animationStyles));
}

// Add to document head if not already added
if (!document.head.querySelector('style[data-meal-notification]')) {
  styleElement.setAttribute('data-meal-notification', 'true');
  document.head.appendChild(styleElement);
}

// Set this to true to enable test mode (shows notification regardless of time)
const TEST_MODE = true;

const MealNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSelected, setHasSelected] = useState(false);

  useEffect(() => {
    const checkMealSelectionStatus = async () => {
      try {
        const now = new Date();
        const day = now.getDay();
        const hours = now.getHours();

        if (TEST_MODE) {
          setIsVisible(true);
          setIsLoading(false);
          return;
        }

        const isTuesdayWindow = day === 2 && hours >= 18 && hours < 23;
        const isWednesdayWindow = day === 3 && hours >= 6 && hours < 11;

        if (isTuesdayWindow || isWednesdayWindow) {
          const studentId = localStorage.getItem('studentId');
          if (studentId) {
            try {
              const token = localStorage.getItem('token');
              const response = await axios.get('/api/meals/check', {
                params: { studentId },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              const selected = response.data?.data?.hasSelectedMeal === true;
              setHasSelected(selected);
              setIsVisible(!selected);
            } catch {
              setIsVisible(true);
            }
          } else {
            setHasSelected(false);
            setIsVisible(true);
          }
        } else {
          setIsVisible(false);
        }
      } catch (error) {
        console.error('Error checking meal selection status:', error);
        setIsVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkMealSelectionStatus();
    const interval = setInterval(checkMealSelectionStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Hide for 1 hour after closing
    const hideUntil = new Date();
    hideUntil.setHours(hideUntil.getHours() + 1);
    localStorage.setItem('mealNotificationHiddenUntil', hideUntil.getTime());
  };

  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  if (isLoading || !isVisible || !isHomePage) {
    return null;
  }

  const handleLoginClick = (e) => {
    e.preventDefault();
    setShowLoginPopup(true);
  };

  const handleClosePopup = () => {
    setShowLoginPopup(false);
  };

  return (
    <div className="fixed top-32 right-8 z-50">
      <div className="relative group">
        <button
          onClick={handleLoginClick}
          className="flex items-center justify-center p-5 rounded-full shadow-lg bg-yellow-400 hover:bg-yellow-500 focus:outline-none ring-4 ring-offset-2 ring-opacity-70 ring-gradient-to-r from-teal-400 via-blue-500 to-indigo-600 hover:ring-opacity-90 focus:ring-opacity-100 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-xl hover:shadow-yellow-200/50 active:scale-95 animate-float"
          aria-label="Select Meal"
          title="Select Meal"
          style={{
            animation: 'subtle-float 4s ease-in-out infinite',
          }}
        >
          <div className="relative">
            <Utensils className="h-7 w-7 transform group-hover:scale-110 transition-transform duration-300 text-black" />
          </div>
        </button>
        <div className="absolute top-full right-0 mt-3 px-3 py-2 text-sm text-white bg-gray-900 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Choose your meal
          <div className="absolute bottom-full right-4 w-2 h-2 -mb-1 rotate-45 bg-gray-900"></div>
        </div>
      </div>

      {/* Login Popup */}
      {showLoginPopup &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={handleClosePopup}
            />

            <div className="relative w-full max-w-md">
              <button
                onClick={handleClosePopup}
                className="absolute -top-10 -right-2 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <StudentLoginPage />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default MealNotification;
