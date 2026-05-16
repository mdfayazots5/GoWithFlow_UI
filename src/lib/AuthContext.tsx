import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types';
import { isDemo } from './demoService';
import { DUMMY_USERS } from '@/data/dummy/user.dummy';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isDemo: boolean;
  requestOtp: (mobileNumber: string) => Promise<{ sent: boolean; expiresIn: number }>;
  verifyOtp: (mobileNumber: string, otp: string) => Promise<{ token: string; userId: string; role: 'ADMIN' | 'USER'; user: User }>;
  register: (payload: Partial<User>) => Promise<User>;
  loginWithDummy: (user: User) => void;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isLoggedIn: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for demo user
    const savedUser = localStorage.getItem('gowithflow_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      if (!isDemo) {
        setFirebaseUser(fUser);
        if (fUser) {
          const userDoc = await getDoc(doc(db, 'users', fUser.uid));
          if (userDoc.exists()) {
            const userData = { id: fUser.uid, ...userDoc.data() } as User;
            setUser(userData);
            localStorage.setItem('gowithflow_user', JSON.stringify(userData));
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const requestOtp = async (mobileNumber: string) => {
    if (isDemo) {
      return { sent: true, expiresIn: 300 };
    }
    // Real implementation would go here
    return { sent: true, expiresIn: 300 };
  };

  const verifyOtp = async (mobileNumber: string, otp: string) => {
    if (isDemo) {
      const dummy = DUMMY_USERS.find(u => u.mobileNumber === mobileNumber) || DUMMY_USERS[1];
      setUser(dummy);
      localStorage.setItem('gowithflow_user', JSON.stringify(dummy));
      return { token: 'demo-token', userId: dummy.id, role: dummy.role, user: dummy };
    }
    // Real implementation would go here
    throw new Error('Real OTP verification not implemented');
  };

  const register = async (payload: Partial<User>) => {
    if (isDemo) {
      const newUser: User = {
        id: `U${Math.floor(Math.random() * 1000)}`,
        fullName: payload.fullName || 'New User',
        mobileNumber: payload.mobileNumber || '',
        email: payload.email,
        ageGroup: payload.ageGroup || 'Adult (18+)',
        preferredHintLanguage: payload.preferredHintLanguage || 'Telugu',
        avatar: payload.avatar || DUMMY_USERS[1].avatar,
        role: 'USER',
        dailyStreakCount: 0,
        totalSessionsPlayed: 0,
        totalPracticeHours: 0,
        active: true,
        registrationDate: new Date().toISOString(),
      };
      return newUser;
    }
    // Real implementation would go here
    const newUser = { ...payload } as User;
    return newUser;
  };

  const loginWithDummy = (dummyUser: User) => {
    setUser(dummyUser);
    localStorage.setItem('gowithflow_user', JSON.stringify(dummyUser));
  };

  const logout = async () => {
    if (!isDemo) {
      await signOut(auth);
    }
    setUser(null);
    localStorage.removeItem('gowithflow_user');
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isLoggedIn = () => user !== null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser, 
      loading, 
      isDemo, 
      requestOtp, 
      verifyOtp, 
      register, 
      loginWithDummy,
      logout,
      isAdmin,
      isLoggedIn
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
