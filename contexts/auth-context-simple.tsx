'use client';

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  registerUser: (email: string, password: string, displayName: string, userType: 'donor' | 'recipient') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Simple auth state listener
    const initAuth = async () => {
      try {
        // Import Firebase auth dynamically to prevent SSR issues
        const { onAuthStateChanged, getAuth } = await import('firebase/auth');
        const { app } = await import('@/lib/firebase-simple');
        
        const auth = getAuth(app);
        
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
          
          // Set auth cookies for middleware (only on client side)
          if (typeof window !== 'undefined') {
            if (firebaseUser) {
              // Set auth token cookie
              document.cookie = `auth_token=${firebaseUser.uid}; path=/; max-age=86400; SameSite=Lax`;
              // Set email verification status
              document.cookie = `email_verified=${firebaseUser.emailVerified}; path=/; max-age=86400; SameSite=Lax`;
              // Set account creation time if available
              if (firebaseUser.metadata.creationTime) {
                document.cookie = `account_creation_time=${firebaseUser.metadata.creationTime}; path=/; max-age=86400; SameSite=Lax`;
              }
            } else {
              // Clear auth cookies when user signs out
              document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'email_verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'account_creation_time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            }
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { signInWithEmailAndPassword, getAuth } = await import('firebase/auth');
      const { app } = await import('@/lib/firebase-simple');
      
      const auth = getAuth(app);
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      setUser(result.user);
      
      // Get user role from Firestore and redirect to appropriate dashboard
      const { doc, getDoc, getFirestore } = await import('firebase/firestore');
      const db = getFirestore(app);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userType = userData.userType;
        const dashboardUrl = userType === 'donor' ? '/donor/dashboard' : '/recipient/dashboard';
        window.location.href = dashboardUrl;
      } else {
        // Fallback to generic dashboard if no user data found
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { signOut: firebaseSignOut, getAuth } = await import('firebase/auth');
      const { app } = await import('@/lib/firebase-simple');
      
      const auth = getAuth(app);
      await firebaseSignOut(auth);
      
      // Clear auth cookies (only on client side)
      if (typeof window !== 'undefined') {
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'email_verified=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'account_creation_time=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      
      setUser(null);
      router.push('/auth/login');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const registerUser = async (email: string, password: string, displayName: string, userType: 'donor' | 'recipient') => {
    try {
      setLoading(true);
      const { createUserWithEmailAndPassword, updateProfile, getAuth } = await import('firebase/auth');
      const { doc, setDoc, getFirestore } = await import('firebase/firestore');
      const { app } = await import('@/lib/firebase-simple');
      
      const auth = getAuth(app);
      const db = getFirestore(app);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(result.user, { displayName });
      
      // Store user role in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        displayName,
        userType,
        createdAt: new Date(),
        emailVerified: false
      });
      
      setUser(result.user);
      
      // Redirect to appropriate dashboard based on user type
      const dashboardUrl = userType === 'donor' ? '/donor/dashboard' : '/recipient/dashboard';
      window.location.href = dashboardUrl;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    registerUser,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider value={{ user: null, loading: true, signIn, signOut, registerUser }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};