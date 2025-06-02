'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          console.log('Registering service worker...');

          // Check if service worker file exists first
          const swResponse = await fetch('/firebase-messaging-sw.js', {
            method: 'HEAD',
            cache: 'no-cache'
          });

          if (!swResponse.ok) {
            console.warn('Service worker file not found, skipping registration');
            return;
          }

          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
            updateViaCache: 'none', // Prevent caching issues
            type: 'classic', // Explicitly set the type
          });

          console.log('Service Worker registered successfully:', registration);

          // Check if there's an update available
          registration.addEventListener('updatefound', () => {
            console.log('Service Worker update found');
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker installed, page refresh may be needed');
                  // Optionally show a notification to the user
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('App Updated', {
                      body: 'A new version is available. Please refresh the page.',
                      icon: '/logo.svg'
                    });
                  }
                }
              });
            }
          });

          // Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('Message from service worker:', event.data);
          });

          // Handle service worker errors
          registration.addEventListener('error', (error) => {
            console.error('Service Worker error:', error);
          });

        } catch (error) {
          console.error('Service Worker registration failed:', error);
          // Don't throw the error, just log it to prevent app crashes
        }
      };

      // Add a small delay to ensure the page is fully loaded
      const timeoutId = setTimeout(() => {
        registerServiceWorker();
      }, 1000);

      // Clean up function
      return () => {
        clearTimeout(timeoutId);
      };
    } else {
      console.warn('Service Workers are not supported in this browser');
    }
  }, []);

  return null; // This component doesn't render anything
}
