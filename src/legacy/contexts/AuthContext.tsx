import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, SubscriptionTier } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, extra?: { name?: string; phone?: string }) => Promise<void>;
  logout: () => void;
  updateSubscription: (tier: SubscriptionTier) => void;
  isLoading: boolean;
  // RID-02: Trial gating neutralized — always active until finalized
  isTrialActive: boolean;
  trialStatusMessage: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('claimmanager_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('claimmanager_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, extra?: { name?: string; phone?: string }): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call - In production, replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes - In production, validate credentials with backend
      const mockUser: User = {
        id: `user_${Date.now()}`,
        email,
        name: extra?.name?.trim() || email.split('@')[0],
        subscriptionTier: email.includes('pro+') ? 'PRO_PLUS' : 
                         email.includes('pro') ? 'PRO' : 'FREE',
        createdAt: new Date().toISOString(),
        subscriptionExpiresAt: email.includes('pro') 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        ...(extra?.phone ? { phone: extra.phone } : {}),
      } as User;
      
      setUser(mockUser);
      localStorage.setItem('claimmanager_user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('خطا در ورود. لطفا دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('claimmanager_user');
    localStorage.removeItem('claimmanager_theme');
  };

  const updateSubscription = (tier: SubscriptionTier) => {
    if (user) {
      const updatedUser: User = {
        ...user,
        subscriptionTier: tier,
        subscriptionExpiresAt: tier !== 'FREE' 
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      };
      setUser(updatedUser);
      localStorage.setItem('claimmanager_user', JSON.stringify(updatedUser));
    }
  };

  // TODO [RID-02]: Implement trial period gating when finalized
  const isTrialActive = true;
  const trialStatusMessage = 'دوره آزمایشی با توجه به نسخه نهایی و قابل عرضه نرم‌افزار تعیین خواهد شد.';

  return (
    <AuthContext.Provider value={{ user, login, logout, updateSubscription, isLoading, isTrialActive, trialStatusMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

