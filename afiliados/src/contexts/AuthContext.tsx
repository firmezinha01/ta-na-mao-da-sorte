import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Affiliate } from '../types';
import { AuthService } from '../services/authService';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentAffiliate: Affiliate | null;
  role: 'affiliate' | 'admin' | null;
  isLoading: boolean;
  login: (id: string, pass: string) => Promise<{ success: boolean; user?: UserProfile; affiliate?: Affiliate; error?: string }>;
  register: (data: any) => Promise<{ success: boolean; affiliate?: Affiliate; error?: string }>;
  logout: () => void;
  refreshAffiliate: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentAffiliate, setCurrentAffiliate] = useState<Affiliate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const reloadSession = () => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
    if (user && user.role === 'affiliate') {
      const aff = AuthService.getCurrentAffiliate();
      setCurrentAffiliate(aff);
    } else {
      setCurrentAffiliate(null);
    }
  };

  useEffect(() => {
    reloadSession();
    setIsLoading(false);

    // Listen for storage updates across tabs or windows
    const handleStorage = () => reloadSession();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = async (id: string, pass: string) => {
    setIsLoading(true);
    const result = await AuthService.login(id, pass);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      if (result.affiliate) {
        setCurrentAffiliate(result.affiliate);
      } else {
        setCurrentAffiliate(null);
      }
    }
    setIsLoading(false);
    return result;
  };

  const register = async (data: any) => {
    setIsLoading(true);
    const result = await AuthService.register(data);
    setIsLoading(false);
    return result;
  };

  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setCurrentAffiliate(null);
  };

  const refreshAffiliate = () => {
    reloadSession();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentAffiliate,
        role: currentUser?.role || null,
        isLoading,
        login,
        register,
        logout,
        refreshAffiliate
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
