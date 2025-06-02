// Firebase Cloud Messaging Service Worker
// This file handles background push notifications when the app is not in focus

// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

try {
  // Initialize Firebase in the service worker
  // Firebase configuration for FDMS project
  const firebaseConfig = {
    apiKey: "AIzaSyBt01LvtM44Q0iFWnKlAuYC9V-mycCb5go",
    authDomain: "fdms-e94f8.firebaseapp.com",
    projectId: "fdms-e94f8",
    storageBucket: "fdms-e94f8.firebasestorage.app",
    messagingSenderId: "103517737213",
    appId: "1:103517737213:web:d3e57cd8f8afb1421dee94",
    measurementId: "G-QNZ1WLDTWC"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  // Initialize Firebase Cloud Messaging and get a reference to the service
  const messaging = firebase.messaging();

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    try {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);
      
      // Customize notification here
      const notificationTitle = payload.notification?.title || 'FDMS Notification';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/logo.svg',
        badge: '/logo.svg',
        data: payload.data,
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/icons/view.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/dismiss.png'
          }
        ],
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: payload.data?.type || 'general'
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    } catch (error) {
      console.error('[firebase-messaging-sw.js] Error handling background message:', error);
    }
  });
}  catch (error) {
  console.error('[firebase-messaging-sw.js] Error initializing Firebase:', error);
}

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  try {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    
    event.notification.close();
    
    // Handle different actions
    if (event.action === 'view') {
      // Open the app to a specific page based on notification data
      const urlToOpen = event.notification.data?.url || '/dashboard';
      
      event.waitUntil(
        clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        }).then((clientList) => {
          // Check if there's already a window/tab open with the target URL
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          
          // If no window/tab is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
      );
    } else if (event.action === 'dismiss') {
      // Just close the notification (already handled above)
      console.log('Notification dismissed');
    } else {
      // Default action - open the app
      const urlToOpen = event.notification.data?.url || '/dashboard';
      
      event.waitUntil(
        clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        }).then((clientList) => {
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
      );
    }
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error handling notification click:', error);
  }
});
// Handle push events (for additional processing if needed)
self.addEventListener('push', (event) => {
  try {
    console.log('[firebase-messaging-sw.js] Push event received:', event);
    
    // The onBackgroundMessage handler above will handle showing the notification
    // This event listener is here for any additional processing you might need
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error handling push event:', error);
  }
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker installing...');
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service worker activating...');
  event.waitUntil(self.clients.claim());
});
