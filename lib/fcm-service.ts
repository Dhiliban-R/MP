import { getMessaging, getToken, onMessage, isSupported, deleteToken } from 'firebase/messaging';
import { app, db } from './firebase';
import { doc, updateDoc, getDoc, serverTimestamp, collection, addDoc, query, where, getDocs, deleteDoc, deleteField } from 'firebase/firestore';
import { User } from './types/user.types';
import { createNotification } from './notification-service';

// Initialize Firebase Cloud Messaging
let messaging: any;

// Dynamically initialize messaging only in browser environments
const initializeMessaging = async () => {
  if (typeof window !== 'undefined') {
    try {
      const isMessagingSupported = await isSupported();
      if (isMessagingSupported) {
        messaging = getMessaging(app);
        return true;
      } else {
        console.warn('Firebase messaging is not supported in this browser');
        return false;
      }
    } catch (error) {
      console.error('Error initializing Firebase messaging:', error);
      return false;
    }
  }
  return false;
};

// Request permission to send notifications
export const requestNotificationPermission = async () => {
  try {
    // Initialize messaging first
    const isInitialized = await initializeMessaging();
    if (!isInitialized) return false;
    
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      return true;
    } else {
      console.warn('Notification permission denied.');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Get FCM token with enhanced error handling
export const getFcmToken = async () => {
  try {
    // Initialize messaging first
    const isInitialized = await initializeMessaging();
    if (!isInitialized) {
      console.warn('FCM messaging not initialized - skipping token generation');
      return null;
    }

    // Check if permission is granted
    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted - skipping token generation');
      return null;
    }

    // Get VAPID key from environment variables
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn('VAPID key not configured - FCM will be disabled. Set NEXT_PUBLIC_FIREBASE_VAPID_KEY for push notifications.');
      return null;
    }

    // Check if we're in development and skip FCM if there are auth issues
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Attempting FCM token generation...');
    }

    const token = await getToken(messaging, { vapidKey });
    if (token) {
      console.log('FCM Token obtained successfully');
      return token;
    } else {
      console.warn('No registration token available - this is normal in development environments');
      return null;
    }
  } catch (error: any) {
    // In development, log the error but don't treat it as critical
    if (process.env.NODE_ENV === 'development') {
      console.warn('FCM token generation failed in development environment:', error.message);
      console.warn('This is normal and won\'t affect core functionality. FCM will work in production.');
    } else {
      console.error('Error getting FCM token:', error);
    }

    // Handle specific FCM errors gracefully
    if (error.code === 'messaging/token-subscribe-failed') {
      console.warn('FCM token subscription failed. This is common in development environments.');
    } else if (error.code === 'messaging/permission-blocked') {
      console.warn('Notification permission is blocked by the user.');
    } else if (error.code === 'messaging/unsupported-browser') {
      console.warn('FCM is not supported in this browser.');
    } else if (error.code === 'messaging/invalid-vapid-key') {
      console.warn('Invalid VAPID key provided.');
    }

    return null;
  }
};

// Save FCM token to user document and dedicated tokens collection
export const saveFcmToken = async (userId: string, token: string) => {
  try {
    // Save to user document
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Get user data for role information
      const userData = userDoc.data();
      
      // Update existing user document with token
      await updateDoc(userRef, {
        fcmTokens: { [token]: true },
        lastTokenUpdate: serverTimestamp()
      });
      
      // Also save to dedicated fcmTokens collection for easier querying
      const tokenData = {
        token,
        userId,
        userRole: userData.role || 'unknown',
        device: getBrowserInfo(),
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      };
      
      // Check if token already exists
      const tokenQuery = query(
        collection(db, 'fcmTokens'),
        where('token', '==', token)
      );
      
      const tokenSnapshot = await getDocs(tokenQuery);
      
      if (tokenSnapshot.empty) {
        // Token doesn't exist, create new document
        await addDoc(collection(db, 'fcmTokens'), tokenData);
      } else {
        // Token exists, update it
        const tokenDoc = tokenSnapshot.docs[0];
        await updateDoc(doc(db, 'fcmTokens', tokenDoc.id), {
          userId, // Update in case token is being transferred to a new user
          userRole: userData.role || 'unknown',
          lastActive: serverTimestamp()
        });
      }
    } else {
      console.error('User document not found when saving FCM token');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return false;
  }
};

// Get browser/device information for token management
const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browserName = "Unknown";
  let deviceType = "desktop";
  
  // Detect browser
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "Chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "Firefox";
  } else if (userAgent.match(/safari/i)) {
    browserName = "Safari";
  } else if (userAgent.match(/opr\//i)) {
    browserName = "Opera";
  } else if (userAgent.match(/edg/i)) {
    browserName = "Edge";
  }
  
  // Detect device type
  if (/Mobi|Android/i.test(userAgent)) {
    deviceType = "mobile";
  } else if (/iPad|Tablet/i.test(userAgent)) {
    deviceType = "tablet";
  }
  
  return {
    browser: browserName,
    deviceType,
    os: navigator.platform,
    userAgent: userAgent.substring(0, 100) // Truncate to avoid large strings
  };
};

// Subscribe to topic for role-based notifications
export const subscribeToTopic = async (token: string, topic: string) => {
  try {
    // This would typically be handled by a Cloud Function
    // Create a document in the subscriptions collection to track this
    await addDoc(collection(db, 'topicSubscriptions'), {
      token,
      topic,
      subscribedAt: serverTimestamp()
    });
    
    console.log(`Subscribing token to topic: ${topic}`);
    return true;
  } catch (error) {
    console.error(`Error subscribing to topic ${topic}:`, error);
    return false;
  }
};

// Unsubscribe from a topic
export const unsubscribeFromTopic = async (token: string, topic: string) => {
  try {
    // Find the subscription document
    const q = query(
      collection(db, 'topicSubscriptions'),
      where('token', '==', token),
      where('topic', '==', topic)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Delete all matching subscription documents
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    console.log(`Unsubscribed token from topic: ${topic}`);
    return true;
  } catch (error) {
    console.error(`Error unsubscribing from topic ${topic}:`, error);
    return false;
  }
};

// Listen for incoming messages when the app is in the foreground
export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (!messaging) {
      resolve(null);
      return;
    }
    
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Create a browser notification if the payload contains notification data
      if (payload.notification) {
        const { title, body } = payload.notification;
        
        // Display browser notification
        if (Notification.permission === 'granted') {
          const notificationOptions = {
            body,
            icon: '/logo.svg',
            badge: '/logo.svg',
            data: payload.data,
            vibrate: [200, 100, 200]
          };
          
          try {
            const notification = new Notification(title as string, notificationOptions);
            
            // Handle notification click
            notification.onclick = () => {
              // Focus on the window if it's not in focus
              window.focus();
              
              // Navigate to the link if provided in the data
              if (payload.data && payload.data.link) {
                window.location.href = payload.data.link;
              }
              
              // Close the notification
              notification.close();
            };
            
            // Also create an in-app notification if user ID is in the data
            if (payload.data && payload.data.userId) {
              createNotification({
                userId: payload.data.userId,
                title: title as string,
                message: body as string,
 type: (payload.data.type as 'info' | 'success' | 'warning' | 'error') || 'info',
                read: false,
                link: payload.data.link,
                relatedEntityId: payload.data.relatedEntityId,
 relatedEntityType: payload.data.relatedEntityType as 'donation' | 'reservation' | 'user' | undefined
              });
            }
          } catch (error) {
            console.error('Error creating notification:', error);
          }
        }
      }
      
      resolve(payload);
    });
  });
};

// Initialize FCM for a specific user with graceful error handling
export const initializeFcmForUser = async (user: User) => {
  try {
    console.log('Initializing FCM for user:', user.uid);

    // Skip FCM in development if explicitly disabled
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DISABLE_FCM_DEV === 'true') {
      console.log('FCM disabled in development environment');
      return false;
    }

    // Request notification permission
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      console.log('FCM initialization skipped: notification permission not granted');
      return false;
    }

    // Try to get FCM token
    const token = await getFcmToken();
    if (!token) {
      console.log('FCM initialization completed without token (normal in development)');
      // Still set up message listener even without token
      onMessageListener().then((payload) => {
        console.log('FCM message handler initialized (no token)');
      }).catch(() => {
        // Silently handle message listener setup failure
      });
      return false;
    }

    // Save token to user's document and tokens collection
    const tokenSaved = await saveFcmToken(user.uid, token);
    if (!tokenSaved) {
      console.warn('Failed to save FCM token, but continuing...');
    }

    // Subscribe to role-specific topics (non-blocking)
    subscribeToTopic(token, `role-${user.role}`).catch((error) => {
      console.warn('Failed to subscribe to role topic:', error.message);
    });

    // Subscribe to user-specific topic (non-blocking)
    subscribeToTopic(token, `user-${user.uid}`).catch((error) => {
      console.warn('Failed to subscribe to user topic:', error.message);
    });

    // Set up foreground message handler
    onMessageListener().then((payload) => {
      console.log('FCM message handler initialized successfully');
    }).catch((error) => {
      console.warn('FCM message handler setup failed:', error.message);
    });

    console.log('FCM initialization completed successfully');
    return true;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('FCM initialization failed in development environment:', error.message);
      console.warn('This is normal and won\'t affect core functionality.');
    } else {
      console.error('Error initializing FCM for user:', error);
    }
    return false;
  }
};

// Clean up FCM when user logs out
export const cleanupFcm = async (userId: string, userRole?: string) => {
  try {
    console.log('Starting FCM cleanup for user:', userId);

    // Try to get the current token, but don't fail if it's not available
    let token: string | null = null;
    try {
      token = await getFcmToken();
    } catch (tokenError) {
      console.warn('Could not get FCM token during cleanup, continuing with cleanup anyway:', tokenError);
    }

    if (!token) {
      console.log('No FCM token available for cleanup, skipping token-specific cleanup');
      return true; // Return true since this is not a critical failure
    }

    // Unsubscribe from topics (non-blocking)
    try {
      if (userRole) {
        await unsubscribeFromTopic(token, `role-${userRole}`);
      }
      await unsubscribeFromTopic(token, `user-${userId}`);
    } catch (topicError) {
      console.warn('Error unsubscribing from topics during cleanup:', topicError);
      // Continue with cleanup
    }

    // Remove token from user document (non-blocking)
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`fcmTokens.${token}`]: deleteField()
      });
    } catch (userDocError) {
      console.warn('Error removing token from user document:', userDocError);
      // Continue with cleanup
    }

    // Update token status in tokens collection (non-blocking)
    try {
      const tokenQuery = query(
        collection(db, 'fcmTokens'),
        where('token', '==', token),
        where('userId', '==', userId)
      );

      const tokenSnapshot = await getDocs(tokenQuery);
      if (!tokenSnapshot.empty) {
        const tokenDoc = tokenSnapshot.docs[0];
        await updateDoc(doc(db, 'fcmTokens', tokenDoc.id), {
          active: false,
          loggedOut: serverTimestamp()
        });
      }
    } catch (tokenCollectionError) {
      console.warn('Error updating token collection during cleanup:', tokenCollectionError);
      // Continue with cleanup
    }

    // Delete the token from the browser (non-blocking)
    try {
      if (messaging) {
        await deleteToken(messaging);
      }
    } catch (deleteTokenError) {
      console.warn('Error deleting token from browser:', deleteTokenError);
      // This is not critical for sign-out
    }

    console.log('FCM cleanup completed for user:', userId);
    return true;
  } catch (error) {
    console.error('Error during FCM cleanup (non-critical):', error);
    // Return true to not block sign-out process
    return true;
  }
};

// Send a test notification to the current device
export const sendTestNotification = async (userId: string) => {
  try {
    // Create a notification in Firestore to trigger the Cloud Function
    await addDoc(collection(db, 'notifications'), {
      userId,
      title: 'Test Notification',
      message: 'This is a test notification to verify your push notification setup is working.',
      type: 'info',
      read: false,
      createdAt: serverTimestamp(),
      isTest: true
    });
    
    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};
