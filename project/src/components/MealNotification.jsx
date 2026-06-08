import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Utensils } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import StudentLoginPage from '../pages/StudentLoginPage';

const MealNotification = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const checkMealSelectionStatus = useCallback(async () => {
    try {
      const hiddenUntil = Number(localStorage.getItem('mealNotificationHiddenUntil') || 0);
      if (Date.now() < hiddenUntil) {
        setIsVisible(false);
        return;
      }

      const { data: statusRes } = await axios.get('/api/meals/status');
      if (!statusRes?.data?.isOpen) {
        setIsVisible(false);
        return;
      }

      const studentId = localStorage.getItem('studentId');
      if (studentId) {
        try {
          const token = localStorage.getItem('token');
          const { data: checkRes } = await axios.get('/api/meals/check', {
            params: { studentId },
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const selected = checkRes?.data?.hasSelectedMeal === true;
          setIsVisible(!selected);
        } catch {
          setIsVisible(true);
        }
      } else {
        setIsVisible(true);
      }
    } catch {
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkMealSelectionStatus();
    const interval = setInterval(checkMealSelectionStatus, 60000);
    return () => clearInterval(interval);
  }, [checkMealSelectionStatus]);

  const handleClose = () => {
    setIsVisible(false);
    const hideUntil = new Date();
    hideUntil.setHours(hideUntil.getHours() + 1);
    localStorage.setItem('mealNotificationHiddenUntil', String(hideUntil.getTime()));
  };

  if (isLoading || !isVisible || !isHomePage) {
    return null;
  }

  return (
    <div className="fixed top-32 right-8 z-50">
      <div className="relative group">
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowLoginPopup(true);
          }}
          className="flex items-center justify-center p-5 rounded-full shadow-lg bg-yellow-400 hover:bg-yellow-500 focus:outline-none ring-4 ring-offset-2 ring-yellow-300/70 hover:ring-yellow-400/90 transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 motion-reduce:transform-none motion-reduce:transition-none"
          aria-label="Select Meal"
          title="Select Meal"
        >
          <Utensils className="h-7 w-7 text-black transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none" />
        </button>
        <div className="absolute top-full right-0 mt-3 px-3 py-2 text-sm text-white bg-gray-900 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          Choose your meal
          <div className="absolute bottom-full right-4 w-2 h-2 -mb-1 rotate-45 bg-gray-900" />
        </div>
      </div>

      {showLoginPopup &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLoginPopup(false)} />
            <div className="relative w-full max-w-md animate-fade-in">
              <button
                onClick={() => setShowLoginPopup(false)}
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
