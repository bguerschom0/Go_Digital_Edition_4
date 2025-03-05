import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { getRoleBasedDashboard } from './utils/roleRoutes';
import { NotificationProvider } from './contexts/NotificationContext';

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
import OrgDashboard from './pages/dashboard/OrgDashboard';

// Request Pages
import RequestList from './pages/requests/RequestList';
import RequestDetail from './pages/requests/RequestDetail';
import RequestAnalytics from './pages/requests/RequestAnalytics';

// Report Pages
import RequestReports from './pages/reports/RequestReports';

// Organization Management
import OrganizationUsers from './pages/organizations/OrganizationUsers';
import OrganizationList from './pages/organizations/OrganizationList';
import OrganizationDetail from './pages/organizations/OrganizationDetail';

// Notification Pages
import NotificationCenter from './pages/notifications/NotificationCenter';

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
      <Route path="/admindashboard" element={<ProtectedRoute requiredRoles={['administrator']}><AuthenticatedLayout><AdminDashboard /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/userdashboard" element={<ProtectedRoute requiredRoles={['user']}><AuthenticatedLayout><UserDashboard /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/orgdashboard" element={<ProtectedRoute requiredRoles={['organization']}><AuthenticatedLayout><OrgDashboard /></AuthenticatedLayout></ProtectedRoute>} />
      
      {/* User Management routes - only for administrators */}
      <Route path="/user-management" element={<ProtectedRoute requiredRoles={['administrator']}><AuthenticatedLayout><UserManagement /></AuthenticatedLayout></ProtectedRoute>} />
      
      {/* Organization management routes */}
      <Route path="/organizations" element={<ProtectedRoute requiredRoles={['administrator']}><AuthenticatedLayout><OrganizationList /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/organization-users" element={<ProtectedRoute requiredRoles={['administrator']}><AuthenticatedLayout><OrganizationUsers /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/organizations/:id" element={<ProtectedRoute requiredRoles={['administrator']}><AuthenticatedLayout><OrganizationDetail /></AuthenticatedLayout></ProtectedRoute>} />


      {/* Request routes - accessible by all authenticated users */}
      <Route path="/requests" element={<ProtectedRoute><AuthenticatedLayout><RequestList /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/requests/:id" element={<ProtectedRoute><AuthenticatedLayout><RequestDetail /></AuthenticatedLayout></ProtectedRoute>} />
      
      {/* Analytics and reporting - only for administrators */}
      <Route path="/request-analytics" element={<ProtectedRoute requiredRoles={['administrator']}><AuthenticatedLayout><RequestAnalytics /></AuthenticatedLayout></ProtectedRoute>} />
      <Route path="/reports/requests" element={<ProtectedRoute requiredRoles={['administrator']}><AuthenticatedLayout><RequestReports /></AuthenticatedLayout></ProtectedRoute>} />

      {/* Notifications - for all authenticated users */}
      <Route path="/notifications" element={<ProtectedRoute><AuthenticatedLayout><NotificationCenter /></AuthenticatedLayout></ProtectedRoute>} />

      
      {/* Root route redirect */}
      <Route path="/" element={<Navigate to={user ? getRoleBasedDashboard(user.role) : "/login"} replace />} />

      {/* Unauthorized and catch-all routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/unauthorized" replace />} />
    </Routes>
  );
};

export default App;
