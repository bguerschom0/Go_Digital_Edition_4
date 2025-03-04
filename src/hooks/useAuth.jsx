import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [loading, setLoading] = useState(true);
  const logoutTimer = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Check if user is active
      if (parsedUser.is_active) {
        // Ensure the user has the processed role from User_Role_V4
        if (!parsedUser.processed_role) {
          const userWithRole = {
            ...parsedUser,
            role: parsedUser.User_Role_V4 || mapLegacyRole(parsedUser.role),
            processed_role: true
          };
          setUser(userWithRole);
          localStorage.setItem('user', JSON.stringify(userWithRole));
        } else {
          setUser(parsedUser);
        }
        resetLogoutTimer();
      } else {
        // Clear user if account is not active
        logout();
      }
    }
    setLoading(false);
  }, []);

  // Mapping from legacy roles to new roles
  const mapLegacyRole = (legacyRole) => {
    switch(legacyRole?.toLowerCase()) {
      case 'administrator':
        return 'administrator';
      case 'user':
        return 'user';
      case 'organization':
        return 'organization';
      default:
        return 'user'; // Default role
    }
  };

  const resetLogoutTimer = () => {
    clearTimeout(logoutTimer.current);
    logoutTimer.current = setTimeout(() => {
      logout();
    }, 5 * 60 * 1000); // 5 minutes of inactivity
  };

  const login = async (username, password) => {
    try {
      // First check user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (userError) throw new Error('Invalid credentials');

      // Check user active status
      if (!userData.is_active) {
        return { 
          user: null, 
          error: 'Account is not active. Please contact the administrator.',
          accountInactive: true
        };
      }

      // First check if there's a valid temporary password
      if (userData?.temp_password) {
        const tempPasswordValid = 
          userData.temp_password === password && 
          new Date(userData.temp_password_expires) > new Date();

        if (tempPasswordValid) {
          // Process the role for temporary password login
          const userWithRole = {
            ...userData,
            role: userData.User_Role_V4 || mapLegacyRole(userData.role),
            processed_role: true
          };
          
          return { 
            user: userWithRole, 
            error: null, 
            passwordChangeRequired: true
          };
        }
      }

      // If no valid temp password, check regular password
      if (!userData.password) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, userData.password);

      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString() 
        })
        .eq('id', userData.id);

      if (updateError) console.error('Error updating last login:', updateError);

      // Process the role from User_Role_V4 or legacy role
      const userWithRole = {
        ...userData,
        role: userData.User_Role_V4 || mapLegacyRole(userData.role),
        processed_role: true
      };

      // Store the processed user in localStorage
      localStorage.setItem('user', JSON.stringify(userWithRole));

      return { 
        user: userWithRole, 
        error: null, 
        passwordChangeRequired: false
      };
    } catch (error) {
      console.error('Login error:', error.message);
      return { user: null, error: error.message };
    }
  };

  const updatePassword = async (userId, newPassword) => {
    try {
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          temp_password: null,
          temp_password_expires: null,
          password_change_required: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Fetch updated user information
      const { data: updatedUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Process the role for the updated user
      const updatedUserWithRole = {
        ...updatedUser,
        role: updatedUser.User_Role_V4 || mapLegacyRole(updatedUser.role),
        processed_role: true
      };

      // Update user in state and localStorage
      setUser(updatedUserWithRole);
      localStorage.setItem('user', JSON.stringify(updatedUserWithRole));
      resetLogoutTimer();

      return { error: null };
    } catch (error) {
      console.error('Password update error:', error);
      return { error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    clearTimeout(logoutTimer.current);
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser, 
      loading, 
      login, 
      logout, 
      updatePassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
