import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Route guard. This hides screens; it does not secure them -- the API's
 * authorize() middleware is what actually enforces RBAC.
 */
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="loading">Checking your session…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/no-access" replace />;

  return children;
};

export default ProtectedRoute;
