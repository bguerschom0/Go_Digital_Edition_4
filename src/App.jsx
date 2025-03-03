import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { getRoleBasedDashboard } from './utils/roleRoutes';

// Layout Components
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import LoginPage from './pages/Login/Login';
import UserManagement from './pages/UserManagement/UserManagement';
import Unauthorized from './pages/Unauthorized';

// Dashboard Pages
import AdminDashboard from './pages/dashboard/AdminDashboard';
import UserDashboard from './pages/dashboard/UserDashboard';


const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role?.toLowerCase())) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const AuthenticatedLayout = ({ children }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
    <Header />
    <main className="pt-10 pb-10">{children}</main>
    <Footer />
  </div>
);

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={user ? <Navigate to={getRoleBasedDashboard(user.role)} replace /> : <LoginPage />} />

      {/* Dashboard routes */}
      <Route path="/admindashboard" element={<ProtectedRoute requiredRoles={['admin']}><AuthenticatedLayout><AdminDashboard /></AuthenticatedLayout></ProtectedRoute>} />q
      <Route path="/userdashboard" element={<ProtectedRoute requiredRoles={['admin','user']}><AuthenticatedLayout><UserDashboard /></AuthenticatedLayout></ProtectedRoute>} />
      
      {/* User Management route */}
      <Route path="/user-management" element={<ProtectedRoute requiredRoles={['admin']}><AuthenticatedLayout><UserManagement /></AuthenticatedLayout></ProtectedRoute>} />


      {/* Root route redirect */}
      <Route path="/" element={<Navigate to={user ? getRoleBasedDashboard(user.role) : "/login"} replace />} />

      {/* Unauthorized and catch-all routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/unauthorized" replace />} />
    </Routes>
  );
};

export default App;
