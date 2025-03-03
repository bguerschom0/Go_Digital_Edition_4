import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../config/supabase';
import { getRoleBasedDashboard } from '../../utils/roleRoutes';

// Password Change Modal Component
const PasswordChangeModal = ({ isOpen, onClose, onSubmit, isTemp }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Comprehensive password validation
    const validationErrors = [];

    if (newPassword.length < 8) {
      validationErrors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(newPassword)) {
      validationErrors.push('Must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(newPassword)) {
      validationErrors.push('Must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(newPassword)) {
      validationErrors.push('Must contain at least one number');
    }

    if (!/[!@#$%^&*]/.test(newPassword)) {
      validationErrors.push('Must contain at least one special character (!@#$%^&*)');
    }

    if (newPassword !== confirmPassword) {
      validationErrors.push('Passwords do not match');
    }

    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit(newPassword);
      setIsSubmitting(false);
    } catch (err) {
      setError(err.message || 'Failed to update password');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full mx-4"
      >
        <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
          {isTemp ? 'Change Temporary Password' : 'Change Password'}
        </h2>
        
        {isTemp && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Your temporary password has expired or needs to be changed. Please create a new password.
          </p>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              required
            />
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>Password must contain:</p>
            <ul className="list-disc list-inside pl-2 space-y-0.5">
              <li>At least 8 characters</li>
              <li>At least one uppercase letter</li>
              <li>At least one lowercase letter</li>
              <li>At least one number</li>
              <li>At least one special character (!@#$%^&*)</li>
            </ul>
          </div>

          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 
                       dark:hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg
                       hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors 
                       flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Password
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login, updatePassword, setUser } = useAuth();

  // Initialize dark mode on component mount
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { 
        error: loginError, 
        passwordChangeRequired, 
        user: loggedInUser,
        accountInactive 
      } = await login(username, password);
      
      setIsLoading(false);

      if (accountInactive) {
        setError('Account is not active. Please contact the administrator.');
        return;
      }
      
      if (loginError) {
        setError(loginError);
        return;
      }

      if (passwordChangeRequired) {
        // Store temporary user for password change
        setTempUser(loggedInUser);
        setShowPasswordChange(true);
      } else {
        // Normal login flow with role-based redirect
        setUser(loggedInUser);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        
        // Get role-specific dashboard path
        const dashboardPath = getRoleBasedDashboard(loggedInUser.role);
        navigate(dashboardPath);
      }
    } catch (err) {
      setIsLoading(false);
      setError('An unexpected error occurred');
    }
  };

  const handlePasswordChange = async (newPassword) => {
    try {
      // Use the temporary user stored during login
      const userId = tempUser?.id;

      if (!userId) {
        setError('User information is missing. Please log in again.');
        return;
      }

      const { error } = await updatePassword(userId, newPassword);
      
      if (error) {
        setError(error);

      return;
      }

      // Fetch updated user information
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Error fetching updated user:', fetchError);
        setError('Failed to retrieve updated user information');
        return;
      }

      // Update user state and storage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Reset temporary user and close modal
      setTempUser(null);
      setShowPasswordChange(false);
      
      const dashboardPath = getRoleBasedDashboard(updatedUser.role);
      navigate(dashboardPath);
    } catch (error) {
      console.error('Password change error:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">

      {/* Dark Mode Toggle */}
      <button 
        onClick={toggleDarkMode} 
        className="fixed top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 
                 transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
      >
        {isDarkMode ? (
          <Sun className="h-6 w-6 text-white" />
        ) : (
          <Moon className="h-6 w-6 text-gray-700" />
        )}
      </button>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-96 p-8 rounded-3xl shadow-xl bg-white dark:bg-gray-800"
      >
        {/* Login Form Content */}
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-20 w-auto object-contain"
          />
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
          Welcome Back
        </h2>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-400 dark:border-red-800 
                       text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-6 flex items-start gap-2"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                       transition-colors duration-200"
              placeholder="Username"
              required
              disabled={isLoading}
            />
            <span className="absolute inset-y-0 right-3 flex items-center">
              <User className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </span>
          </div>
          
          <div className="relative">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-900 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                       transition-colors duration-200"
              placeholder="Password"
              required
              disabled={isLoading}
            />
            <span className="absolute inset-y-0 right-3 flex items-center">
              <Lock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </span>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black
                     hover:bg-gray-800 dark:hover:bg-gray-100
                     focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
                     transition-all duration-200 transform hover:scale-[1.02]
                     flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            Sign In
          </button>
        </form>
      </motion.div>

      {/* Password Change Modal */}
      <PasswordChangeModal 
        isOpen={showPasswordChange}
        onClose={() => {
          setShowPasswordChange(false);
          setTempUser(null);
        }}
        onSubmit={handlePasswordChange}
        isTemp={true}
      />
    </div>
  );
};

export default LoginPage;
