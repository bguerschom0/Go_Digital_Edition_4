import React, { createContext, useContext } from 'react';
import { useAuth } from './useAuth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const authValue = useAuth();

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
