import React, { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useLocationContext } from '@/contexts/location-context';
import { toast } from 'sonner';

interface GoogleMapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: { lat: number; lng: number; title?: string; content?: React.ReactNode }[];
  onMapClick?: (lat: number, lng: number) => void;
  containerStyle?: React.CSSProperties;
  onMapLoad?: (map: google.maps.Map) => void;
  showUserLocation?: boolean;
}

const defaultContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 40.7128, // Default to New York
  lng: -74.0060,
};

// Get API key from environment variable
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Static libraries array to prevent unnecessary reloads
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ['places'];

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  center = defaultCenter,
  zoom = 10,
  markers = [],
  onMapClick,
  containerStyle = defaultContainerStyle,
  onMapLoad,
  showUserLocation = false,
}) => {
  // Check if API key is available
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'demo_google_maps_api_key') {
    return (
      <div
        style={containerStyle}
        className="flex flex-col items-center justify-center bg-gray-100 border border-gray-300 rounded-md"
      >
        <p className="text-amber-600 font-medium">Google Maps API Key Required</p>
        <p className="text-sm text-gray-600 mt-2 text-center px-4">
          Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables to enable map functionality.
        </p>
        <div className="mt-4 p-4 bg-gray-50 rounded border text-xs text-gray-500">
          <p>For development: Add your API key to .env.local</p>
          <p>For production: Configure in your deployment environment</p>
        </div>
      </div>
    );
  }

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { location, setLocation } = useLocationContext();

  // Update map center when prop changes
  useEffect(() => {
    if (center && map) {
      map.panTo(center);
    }
    setMapCenter(center);
  }, [center, map]);

  // Get user's location if showUserLocation is true
  useEffect(() => {
    // Only run on client-side and if showUserLocation is enabled
    if (!showUserLocation || typeof navigator === 'undefined') {
      return;
    }
    
    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      toast.warning('Location services are not supported by your browser. Using default location instead.');
      return;
    }
    
    // Set a timeout to handle cases where geolocation hangs
    const timeoutId = setTimeout(() => {
      console.log('Geolocation request timed out');
      // Don't show toast for timeout in demo mode to reduce noise
    }, 8000);
    
    // Define success handler
    const handleSuccess = (position: GeolocationPosition) => {
      clearTimeout(timeoutId);
      
      try {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        // Update user location state
        setUserLocation(userPos);
        
        // Update location context if available
        if (setLocation) {
          setLocation(userPos);
        }
        
        // If no center is provided, use user's location for map center
        if ((!center || (center.lat === defaultCenter.lat && center.lng === defaultCenter.lng)) && map) {
          map.panTo(userPos);
          setMapCenter(userPos);
        }
      } catch (error) {
        console.error('Error processing geolocation data:', error);
      }
    };
    
    // Define error handler
    const handleError = (error: GeolocationPositionError) => {
      clearTimeout(timeoutId);
      console.log('Error getting location:', error.message);

      // In demo mode, don't show error toasts to reduce noise
      // Just log the error for debugging
    };
    
    // Options for geolocation request
    const options = {
      enableHighAccuracy: false, // Use less accurate but faster location
      timeout: 5000, // Shorter timeout
      maximumAge: 300000, // Use cached positions up to 5 minutes old
    };
    
    // Request user's position
    try {
      const watchId = navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );
      
      // Cleanup function
      return () => {
        clearTimeout(timeoutId);
        // If watchId is a number (some browsers return a number for getCurrentPosition),
        // we should clear it to prevent memory leaks
        if (typeof watchId === 'number') {
          navigator.geolocation.clearWatch(watchId);
        }
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.log('Exception getting user location:', error);
      // In demo mode, don't show error toasts

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [showUserLocation, center, map, setLocation, toast]);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    mapRef.current = map;
    setMap(map);
    
    // Call the onMapLoad callback if provided
    if (onMapLoad) {
      onMapLoad(map);
    }
  }, [onMapLoad]);

  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
    setMap(null);
  }, []);

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      // Close any open info windows when clicking on the map
      setSelectedMarker(null);
      
      if (onMapClick && event.latLng) {
        onMapClick(event.latLng.lat(), event.latLng.lng());
      }
    },
    [onMapClick]
  );

  // Handle load error
  if (loadError) {
    return (
      <div 
        style={containerStyle} 
        className="flex flex-col items-center justify-center bg-gray-100 border border-gray-300 rounded-md"
      >
        <p className="text-red-500 font-medium">Error loading Google Maps</p>
        <p className="text-sm text-gray-600 mt-2">
          {loadError.message || 'Please check your API key and internet connection'}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div 
        style={containerStyle} 
        className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded-md"
      >
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-700">Loading Map...</span>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={mapCenter}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        zoomControl: true,
        gestureHandling: 'cooperative',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      }}
    >
      {/* User location marker */}
      {showUserLocation && userLocation && isLoaded && (
        <Marker
          position={userLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
            scale: 8,
          }}
          title="Your Location"
        />
      )}

      {/* Custom markers */}
      {isLoaded && markers.map((marker, index) => (
        <React.Fragment key={index}>
          <Marker
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.title}
            animation={google.maps.Animation.DROP}
            onClick={() => setSelectedMarker(index)}
          />
          
          {selectedMarker === index && marker.content && (
            <InfoWindow
              position={{ lat: marker.lat, lng: marker.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div>
                {marker.content || <div>{marker.title}</div>}
              </div>
            </InfoWindow>
          )}
        </React.Fragment>
      ))}
    </GoogleMap>
  );
};

export default GoogleMapComponent;
