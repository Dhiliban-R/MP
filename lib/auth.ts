import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification,
  User as FirebaseUser,
 GoogleAuthProvider,
 signInWithPopup,
 signInWithRedirect,
 getRedirectResult
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, UserRole } from './types/user.types';

// Helper function to create a User object with all required methods
const createUserObject = (uid: string, userData: Omit<User, 'uid' | 'getIdToken'>): User => {
  return {
    uid,
    ...userData,
    getIdToken: async () => {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== uid) {
        throw new Error('User not authenticated');
      }
      return await currentUser.getIdToken();
    }
  };
};

// Register a new user
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  organizationName?: string
): Promise<User> => {
  try {
    // Create user in Firebase Auth
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Firebase Auth error during registration:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password authentication is not enabled. Please contact support or enable it in Firebase Console.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email is already in use. Please use a different email or try logging in.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address. Please check and try again.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use a stronger password.');
      } else {
        throw new Error(`Registration failed: ${error.message}`);
      }
    }
    
    const user = userCredential.user;

    // Update profile with display name
    try {
      await updateProfile(user, { displayName });
    } catch (error) {
      console.error('Error updating profile:', error);
      // Continue despite profile update error
    }

    // Send email verification
    try {
      await sendEmailVerification(user);
    } catch (error) {
      console.error('Error sending email verification:', error);
      // Continue despite email verification error
    }

    // Create user document in Firestore
    const userData: Omit<User, 'uid' | 'getIdToken'> = {
      email: user.email || '', // Firebase Auth guarantees email for email/password sign-up
      emailVerified: user.emailVerified,
      displayName,
      role,
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    if (organizationName) {
      userData.organizationName = organizationName;
    }

    // Add the user to Firestore
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
    } catch (error) {
      console.error('Error writing user document to Firestore:', error);
      throw error;
    }

    return createUserObject(user.uid, userData);
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Sign in existing user
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Firebase Auth error during sign in:', error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Email/password authentication is not enabled. Please contact support or enable it in Firebase Console.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address. Please check and try again.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('User not found. Please check your email or register for an account.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        throw new Error(`Login failed: ${error.message}`);
      }
    }
    
    const user = userCredential.user;

    // Update last login timestamp
    try {
      await setDoc(doc(db, 'users', user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating last login timestamp in Firestore:', error);
      throw error;
    }

    // Get user data from Firestore
    let userDoc;
    try {
      userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }
    } catch (error) {
      console.error('Error getting user document from Firestore:', error);
      throw error;
    }

    const userData = userDoc.data() as Omit<User, 'uid' | 'getIdToken'>;
    return createUserObject(user.uid, userData);
  } catch (error: any) {
    console.error('Error signing in:', error);
    
    // If the error is already a formatted Error object from our try/catch blocks, just rethrow it
    if (error instanceof Error) {
      throw error;
    }
    
    // Otherwise, this is an unexpected error
    throw new Error('An unexpected error occurred during sign in. Please try again later.');
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    // Get current user before signing out
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      // Import cleanupFcm dynamically to avoid circular dependencies
      const { cleanupFcm } = await import('./fcm-service');
      
      try {
        // Get user data to get role
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Clean up FCM tokens
          await cleanupFcm(currentUser.uid, userData.role);
        } else {
          // If user doc doesn't exist, just clean up without role
          await cleanupFcm(currentUser.uid);
        }
      } catch (fcmError) {
        // Log but don't block sign out if FCM cleanup fails
        console.error('Error cleaning up FCM tokens:', fcmError);
      }
    }
    
    // Sign out from Firebase
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

// Get current user data
export const getCurrentUser = async (): Promise<User | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data() as Omit<User, 'uid' | 'getIdToken'>;
    return createUserObject(currentUser.uid, userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Auth state change listener
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        console.warn('User document not found in Firestore for authenticated user:', firebaseUser.uid);
        
        // Create a basic user document if it doesn't exist
        try {
          const basicUserData: Omit<User, 'uid' | 'getIdToken'> = {
            email: firebaseUser.email || '',
            emailVerified: firebaseUser.emailVerified,
            displayName: firebaseUser.displayName || 'User',
            role: 'recipient', // Default role
            createdAt: new Date(),
            lastLogin: new Date(),
          };

          await setDoc(doc(db, 'users', firebaseUser.uid), {
            ...basicUserData,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp()
          });

          callback(createUserObject(firebaseUser.uid, basicUserData));
          
        } catch (createError) {
          console.error('Error creating missing user document:', createError);
          callback(null);
        }
        return;
      }

      // User document exists, proceed normally
      const userData = userDoc.data() as Omit<User, 'uid' | 'getIdToken'>;

      // Update last login timestamp
      try {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          lastLogin: serverTimestamp()
        }, { merge: true });
      } catch (updateError) {
        console.error('Error updating last login timestamp:', updateError);
        // Continue despite error
      }

      callback(createUserObject(firebaseUser.uid, userData));
    } catch (error) {
      console.error('Error in auth state change:', error);
      callback(null);
    }
  });
};
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();

    // Add additional scopes for better user experience
    provider.addScope('email');
    provider.addScope('profile');

    // Set custom parameters for better UX and popup handling
    provider.setCustomParameters({
      prompt: 'select_account',
      access_type: 'online',
      include_granted_scopes: 'true'
    });

    let userCredential;
    let user;

    try {
      // Try popup first
      userCredential = await signInWithPopup(auth, provider);
      user = userCredential.user;
    } catch (popupError: any) {
      // If popup fails due to blocking, try redirect as fallback
      if (popupError.code === 'auth/popup-blocked' ||
          popupError.code === 'auth/popup-closed-by-user') {
        console.log('Popup blocked or closed, falling back to redirect...');

        // Use redirect as fallback
        await signInWithRedirect(auth, provider);

        // The redirect will handle the rest, so we return here
        // The actual sign-in completion will be handled by getRedirectResult
        throw new Error('Redirecting to Google sign-in...');
      } else {
        // Re-throw other popup errors
        throw popupError;
      }
    }

    if (!user.email) {
      throw new Error('Google sign-in did not provide an email address.');
    }

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // Create user document in Firestore for new users
      const userData: Omit<User, 'uid' | 'getIdToken'> = {
        emailVerified: user.emailVerified,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: 'donor', // Default role for Google sign-in users
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      try {
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } catch (error) {
        console.error('Error creating user document in Firestore:', error);
        throw new Error('Failed to create user account. Please try again.');
      }
    } else {
      // Update last login timestamp for existing users
      try {
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating last login timestamp:', error);
        // Continue despite error - not critical
      }
    }

    // Get updated user data from Firestore
    try {
      const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (!updatedUserDoc.exists()) {
        throw new Error('User document not found after creation.');
      }

      const updatedUserData = updatedUserDoc.data() as Omit<User, 'uid' | 'getIdToken'>;
      return createUserObject(user.uid, updatedUserData);
    } catch (error) {
      console.error('Error retrieving user document from Firestore:', error);
      throw new Error('Failed to retrieve user data. Please try again.');
    }
  } catch (error: any) {
    console.error('Error signing in with Google:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in cancelled. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup blocked by browser. Please allow popups for this site and try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Multiple sign-in attempts detected. Please try again.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled. Please contact support.');
    } else if (error.code === 'auth/invalid-api-key') {
      throw new Error('Invalid API configuration. Please contact support.');
    } else if (error.message && !error.code) {
      // Re-throw our custom error messages
      throw error;
    } else {
      throw new Error('Failed to sign in with Google. Please try again or use email/password sign-in.');
    }
  }
};
// Check if email is verified
export const checkEmailVerification = async (user: FirebaseUser): Promise<boolean> => {
  try {
    // Reload the user to get the latest email verification status
    await user.reload();
    return user.emailVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
};

// Send email verification
export const sendVerificationEmail = async (user: FirebaseUser): Promise<void> => {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Handle Google Sign-In redirect result
export const handleGoogleRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);

    if (!result) {
      // No redirect result available
      return null;
    }

    const user = result.user;

    if (!user.email) {
      throw new Error('Google sign-in did not provide an email address.');
    }

    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // Create user document in Firestore for new users
      const userData: Omit<User, 'uid' | 'getIdToken'> = {
        emailVerified: user.emailVerified,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        role: 'donor', // Default role for Google sign-in users
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      try {
        await setDoc(doc(db, 'users', user.uid), {
          ...userData,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } catch (error) {
        console.error('Error creating user document in Firestore:', error);
        throw new Error('Failed to create user account. Please try again.');
      }
    } else {
      // Update last login timestamp for existing users
      try {
        await setDoc(doc(db, 'users', user.uid), {
          lastLogin: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating last login timestamp:', error);
        // Continue despite error - not critical
      }
    }

    // Get updated user data from Firestore
    try {
      const updatedUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (!updatedUserDoc.exists()) {
        throw new Error('User document not found after creation.');
      }

      const updatedUserData = updatedUserDoc.data() as Omit<User, 'uid' | 'getIdToken'>;
      return createUserObject(user.uid, updatedUserData);
    } catch (error) {
      console.error('Error retrieving user document from Firestore:', error);
      throw new Error('Failed to retrieve user data. Please try again.');
    }
  } catch (error: any) {
    console.error('Error handling Google redirect result:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your internet connection and try again.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled. Please contact support.');
    } else if (error.message && !error.code) {
      // Re-throw our custom error messages
      throw error;
    } else {
      throw new Error('Failed to complete Google sign-in. Please try again.');
    }
  }
};

export { sendEmailVerification };
