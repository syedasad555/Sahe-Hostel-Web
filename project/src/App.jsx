import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Menu, X, ArrowLeft } from 'lucide-react';
import MealNotification from './components/MealNotification';
import Hero from './components/Hero';
import About from './components/About';
import Amenities from './components/Amenities';
import Contact from './components/Contact';
import Footer from './components/Footer';
import SimpleLayout from './layouts/SimpleLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

const StudentRegister = lazy(() => import('./components/Student'));
const FacultyPage = lazy(() => import('./pages/FacultyPage'));
const FacultyLoginPage = lazy(() => import('./pages/FacultyLoginPage'));
const StudentDetailsPage = lazy(() => import('./pages/StudentDetailsPage'));
const StudentLoginPage = lazy(() => import('./pages/StudentLoginPage'));
const MealSelectionPage = lazy(() => import('./pages/MealSelectionPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="h-9 w-9 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
    </div>
  );
}

const MAIN_NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Complaint' },
];

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showStudentRegister, setShowStudentRegister] = useState(false);
  const isFacultyPage = location.pathname === '/faculty';
  const isStudentDetailsPage = location.pathname.startsWith('/students/');

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10);
        ticking = false;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMenuOpen(false);
    }
  };

  const handleBackToHome = () => navigate('/');

  if (isStudentDetailsPage) {
    return null; // Don't render navigation for student details page
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="w-full">
          <div className="flex justify-between items-center h-20 px-3 sm:px-6">
            <div className="flex-shrink-0 cursor-pointer flex items-center gap-4">
              {isFacultyPage ? (
                <button 
                  onClick={handleBackToHome}
                  className="flex items-center gap-2 text-gray-700 hover:text-amber-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Home</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0 flex items-center justify-center">
                    <img 
                      src="/logo/vrsiddhartha-logo.png" 
                      alt="VR Siddhartha Engineering College logo" 
                      className="h-full w-auto object-contain"
                    />
                  </div>
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate max-w-[11rem] sm:max-w-none">
                    SAHE <span className="text-amber-600">Hostelers</span>
                  </h1>
                </div>
              )}
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {MAIN_NAV_ITEMS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="font-medium text-gray-700 hover:text-amber-600 transition-colors duration-300 hover:scale-105"
                >
                  {label}
                </button>
              ))}
              <button 
                onClick={() => {
                  setShowStudentRegister(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="ml-4 px-7 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-full hover:from-amber-600 hover:to-amber-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-amber-500/40 transform active:scale-95"
              >
                <span className="relative z-10">Register Now</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-amber-600 focus:outline-none p-2 rounded-md"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white shadow-lg transition-all duration-300 ease-in-out">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {MAIN_NAV_ITEMS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToSection(id)}
                  className="block w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-amber-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                >
                  {label}
                </button>
              ))}
              <button 
                onClick={() => {
                  setShowStudentRegister(true);
                  setIsMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full mt-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-300 transform active:scale-95 shadow-md hover:shadow-amber-500/30 text-center"
              >
                <span className="relative z-10">Register Now</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <main className="pt-24">
        <Routes>
          <Route 
            path="/" 
            element={
              <>
                <MealNotification />
                {showStudentRegister ? (
                  <div className="min-h-screen bg-gray-50">
                    <div className="container mx-auto max-w-full px-3 py-6 sm:px-5 sm:py-10 lg:px-8 lg:py-12 sm:max-w-5xl">
                      <button 
                        onClick={() => setShowStudentRegister(false)}
                        type="button"
                        className="mb-6 sm:mb-8 w-full sm:w-auto justify-center px-4 py-2.5 sm:px-6 sm:py-2 flex items-center text-sm sm:text-base text-amber-600 hover:text-amber-700 transition-colors bg-white rounded-lg shadow-sm border border-gray-200 hover:border-amber-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Home
                      </button>
                      <Suspense fallback={<PageLoader />}>
                        <StudentRegister
                          onBack={() => setShowStudentRegister(false)}
                          onRegistered={() => {
                            setShowStudentRegister(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        />
                      </Suspense>
                    </div>
                  </div>
                ) : (
                  <>
                    <Hero 
                      onBookNow={() => scrollToSection('contact')} 
                      onStudentRegister={() => setShowStudentRegister(true)}
                      onFacultyClick={() => navigate('/faculty/login')}
                    />
                    <Amenities />
                    <About />
                    <Contact />
                  </>
                )}
              </>
            } 
          />
        </Routes>
      </main>

      {!isStudentDetailsPage && <Footer scrollToSection={scrollToSection} />}
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/students/:id"
            element={
              <SimpleLayout>
                <StudentDetailsPage />
              </SimpleLayout>
            }
          />
          <Route
            path="/student/login"
            element={
              <div className="min-h-screen bg-white">
                <StudentLoginPage />
              </div>
            }
          />
          <Route
            path="/meal-selection"
            element={
              <div className="min-h-screen bg-white">
                <MealSelectionPage />
              </div>
            }
          />
          <Route
            path="/faculty/login"
            element={
              <div className="min-h-screen bg-white">
                <FacultyLoginPage />
              </div>
            }
          />
          <Route
            path="/faculty"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-white">
                  <FacultyPage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/login"
            element={
              <div className="min-h-screen bg-white">
                <AdminLoginPage />
              </div>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/*"
            element={
              <div className="min-h-screen bg-white">
                <Navigation />
              </div>
            }
          />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
