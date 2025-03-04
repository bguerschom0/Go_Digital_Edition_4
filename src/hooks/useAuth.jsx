import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { supabase } from '../config/supabase';
import bcrypt from 'bcryptjs';

// Create auth context
const AuthContext = createContext();

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const logoutTimer = useRef(null);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Check if user is active
      if (parsedUser.is_active) {
        setUser(parsedUser);
        resetLogoutTimer();
      } else {
        // Clear user if account is not active
        logout();
      }
    }
    setLoading(false);
  }, []);

  // Reset logout timer for auto-logout after inactivity
  const resetLogoutTimer = () => {
    clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(() => {
      logout();
    }, 5 * 60 * 1000); // 5 minutes of inactivity
  };

  // Reset logout timer on user activity
  useEffect(() => {
    const resetTimerOnActivity = () => {
      if (user && user.is_active) {
        resetLogoutTimer();
      }
    };
    
    window.addEventListener('mousemove', resetTimerOnActivity);
    window.addEventListener('keydown', resetTimerOnActivity);
    window.addEventListener('click', resetTimerOnActivity);
    window.addEventListener('scroll', resetTimerOnActivity);

    return () => {
      window.removeEventListener('mousemove', resetTimerOnActivity);
      window.removeEventListener('keydown', resetTimerOnActivity);
      window.removeEventListener('click', resetTimerOnActivity);
      window.removeEventListener('scroll', resetTimerOnActivity);
    };
  }, [user]);

  // Login function
  const login = async (username, password) => {
    try {
      // First check user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
        
      if (userError) {
        return { error: 'Invalid credentials' };
      }
      
      // Check if user is active
      if (!userData.is_active) {
        return { 
          accountInactive: true, 
          error: 'Account is not active. Please contact administrator.' 
        };
      }
      
      // First check if there's a valid temporary password
      if (userData?.temp_password) {
        const tempPasswordValid = 
          userData.temp_password === password && 
          new Date(userData.temp_password_expires) > new Date();

        if (tempPasswordValid) {
          return { 
            user: userData, 
            error: null, 
            passwordChangeRequired: true 
          };
        }
      }
      
      // If no valid temp password, check regular password
      if (!userData.password) {
        return { error: 'Invalid credentials' };
      }

      const isValidPassword = await bcrypt.compare(password, userData.password);

      if (!isValidPassword) {
        return { error: 'Invalid credentials' };
      }
      
      // Update last login timestamp
      await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString()
        })
        .eq('id', userData.id);
      
      // Set user in state and local storage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      resetLogoutTimer();
      
      return { user: userData };
    } catch (err) {
      console.error('Login error:', err);
      return { error: 'An error occurred during login. Please try again.' };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    clearTimeout(logoutTimer.current);
  };

  // Update password function
  const updatePassword = async (userId, newPassword) => {
    try {
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const { error } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          temp_password: null,
          temp_password_expires: null,
          password_change_required: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Fetch updated user information
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Update user in state and localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      resetLogoutTimer();
      
      return { error: null };
    } catch (err) {
      console.error('Password update error:', err);
      return { error: 'Failed to update password. Please try again.' };
    }
  };

  // Value to be provided by the context
  const value = {
    user,
    setUser,
    loading,
    error,
    login,
    logout,
    updatePassword
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
