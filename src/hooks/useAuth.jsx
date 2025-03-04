import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing user on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('user');
        }
      }
    );
    
    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      // Find user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (userError) throw userError;
      
      if (!userData) {
        return { error: 'Invalid username or password' };
      }
      
      // Check if account is active
      if (!userData.is_active) {
        return { accountInactive: true };
      }
      
      // Verify password (this should be done with bcrypt in a secure environment)
      // For demo purposes, we'll simulate password verification
      const isPasswordValid = userData.password === password || 
                            (userData.temp_password === password && 
                             new Date(userData.temp_password_expires) > new Date());
      
      if (!isPasswordValid) {
        return { error: 'Invalid username or password' };
      }
      
      // Check if password change is required
      if (userData.password_change_required) {
        return { passwordChangeRequired: true, user: userData };
      }
      
      // Update last login time
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);
      
      // IMPORTANT: Set role based on User_Role_V4 if available, otherwise use legacy role
      const userWithProcessedRole = {
        ...userData,
        // Use User_Role_V4 if available, otherwise map legacy role to one of the three new roles
        role: userData.User_Role_V4 || mapLegacyRole(userData.role)
      };
      
      // Store user in state and localStorage
      setUser(userWithProcessedRole);
      localStorage.setItem('user', JSON.stringify(userWithProcessedRole));
      
      return { user: userWithProcessedRole };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'An unexpected error occurred' };
    }
  };

  // Mapping from legacy roles to new roles
  const mapLegacyRole = (legacyRole) => {
    switch(legacyRole?.toLowerCase()) {
      case 'admin':
        return 'administrator';
      case 'processor':
      case 'supervisor':
      case 'user':
        return 'user';
      case 'organization':
        return 'organization';
      default:
        return 'user'; // Default role
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update password
  const updatePassword = async (userId, newPassword) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          password: newPassword,
          temp_password: null,
          temp_password_expires: null,
          password_change_required: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
