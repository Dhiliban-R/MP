'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface Location {
  lat: number;
  lng: number;
}

interface LocationContextType {
  location: Location | null;
  setLocation: (location: Location) => void;
  getUserLocation: () => Promise<Location | null>;
  isLoading: boolean;
  error: string | null;
}

const defaultLocation = {
  lat: 40.7128, // New York
  lng: -74.0060,
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Try to get user's location on initial load
  useEffect(() => {
    const initializeLocation = async () => {
      if (!location) {
        try {
          const userLocation = await getUserLocation();
          if (userLocation) {
            setLocation(userLocation);
          }
        } catch (err) {
          // Silently fail on initial load - we'll use default location
          console.warn('Could not get initial location:', err);
        }
      }
    };

    initializeLocation();
  }, []);

  // Function to get user's current location
  const getUserLocation = async (): Promise<Location | null> => {
    // Set loading state and clear any previous errors
    setIsLoading(true);
    setError(null);

    try {
      // Check if we're in a browser environment and if geolocation is supported
      if (typeof navigator === 'undefined') {
        throw new Error('Not in browser environment');
      }
      
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // Create a promise to handle the async geolocation request
      return new Promise((resolve) => {
        // Set a timeout to handle cases where geolocation hangs
        const timeoutId = setTimeout(() => {
          // Fallback if geolocation takes too long
          setIsLoading(false);
          const timeoutError = 'Location request timed out. Using default location.';
          setError(timeoutError);
          console.warn('Geolocation timeout - using default location');
          toast.warning(timeoutError);
          resolve(defaultLocation);
        }, 15000); // 15 seconds timeout as fallback

        // Success handler for geolocation request
        const handleSuccess = (position: GeolocationPosition) => {
          clearTimeout(timeoutId);
          
          try {
            // Create location object from position coordinates
            const userLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            
            // Update state and resolve promise
            setIsLoading(false);
            setLocation(userLocation); // Update the context state
            resolve(userLocation);
          } catch (processError) {
            // Handle any errors in processing the position data
            console.error('Error processing position data:', processError);
            setIsLoading(false);
            setError('Error processing location data');
            resolve(defaultLocation);
          }
        };

        // Error handler for geolocation request
        const handleError = (err: GeolocationPositionError) => {
          clearTimeout(timeoutId);
          let errorMessage = 'Failed to get your location';
          
          // Provide specific error messages based on the error code
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location access was denied. Please enable location services in your browser settings.';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Your device could not determine your current location.';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out. It took too long to get your location.';
              break;
            default:
              errorMessage = `Failed to get your location: ${err.message}`;
          }
          
          // Update state and resolve promise
          setError(errorMessage);
          setIsLoading(false);
          console.error('Geolocation error:', err);
          toast.error(errorMessage);
          resolve(defaultLocation); // Resolve with default location on error
        };

        // Options for geolocation request
        const options = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // Don't use cached positions to ensure fresh location data
        };

        try {
          // Make the geolocation request
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            options
          );
        } catch (geoError) {
          // Handle any synchronous errors in getCurrentPosition
          clearTimeout(timeoutId);
          console.error('Error in getCurrentPosition:', geoError);
          setIsLoading(false);
          setError('Failed to access location services');
          toast.error('Failed to access location services. Using default location.');
          resolve(defaultLocation);
        }
      });
    } catch (err) {
      // Handle any exceptions thrown during the geolocation process
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setIsLoading(false);
      console.error('Location error:', err);
      toast.error(errorMessage);
      return defaultLocation; // Return default location on error
    }
  };

  return (
    <LocationContext.Provider 
      value={{ 
        location, 
        setLocation, 
        getUserLocation,
        isLoading,
        error
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocationContext must be used within a LocationProvider');
  return context;
};
