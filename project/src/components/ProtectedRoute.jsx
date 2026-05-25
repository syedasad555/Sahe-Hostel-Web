import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('facultyAuthenticated') === 'true';
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page and remember the current location
    return <Navigate to="/faculty/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
