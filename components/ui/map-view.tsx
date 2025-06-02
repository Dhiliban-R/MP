'use client';

import { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer, DirectionsService } from '@react-google-maps/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Donation, DonationStatus } from '@/lib/types';
import { useAppStore } from '@/store/store';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Package, Users, User, Navigation, Clock } from 'lucide-react';
import { toast as toastSonner } from 'sonner';

interface MapViewProps {
  donations?: Donation[];
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  height?: string;
  showUserLocation?: boolean;
  markerType?: 'donation' | 'recipient' | 'donor';
  onMarkerClick?: (donation: Donation) => void;
  latitude?: number;
  longitude?: number;
}

  // Enhanced with live location tracking and navigation
interface CustomMarkerProps {
  position: { lat: number; lng: number };
  markerType?: 'donation' | 'recipient' | 'donor' | 'user';
  onClick?: () => void;
  children?: ReactNode;
}

interface RouteInfo {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  travelMode?: string;
  waypoints?: any[];
}

// Use environment variables for API key
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Static libraries array to prevent unnecessary reloads
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: 'var(--radius)',
};

const defaultCenter = {
  lat: 40.730610,
  lng: -73.935242, // New York as default
};

const CustomMarker = ({ position, markerType = 'donation', onClick, children }: CustomMarkerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Any logic that depends on 'window' can be safely executed here
    }
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
    if (onClick) onClick();
  }, [onClick]);

  // Use different marker colors based on type
  let markerColor = 'hsl(var(--primary))';
  let Icon = Package;
  
  if (markerType === 'recipient') {
    markerColor = 'hsl(var(--secondary))';
    Icon = Users;
  } else if (markerType === 'donor') {
    markerColor = 'hsl(var(--orange))';
    Icon = User;
  } else if (markerType === 'user') {
    markerColor = 'hsl(var(--teal))';
    Icon = MapPin;
  }

  // Only render if google is defined and we're in browser
  if (typeof window === 'undefined' || typeof google === 'undefined') {
    return null;
  }
  
  // Validate position
  if (!position || typeof position.lat !== 'number' || typeof position.lng !== 'number' ||
      isNaN(position.lat) || isNaN(position.lng)) {
    console.error('Invalid marker position:', position);
    return null;
  }

  try {
    return (
      <Marker
        position={position}
        onClick={toggleOpen}
        icon={{
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#ffffff',
          scale: 10,
        }}
      >
        {isOpen && children && (
          <InfoWindow onCloseClick={() => setIsOpen(false)}>
            <div>{children}</div>
          </InfoWindow>
        )}
      </Marker>
    );
  } catch (error) {
    console.error('Error rendering marker:', error);
    return null;
  }
};

export function MapView({
  donations = [],
  initialCenter,
  initialZoom = 13,
  height = '400px',
  showUserLocation = true,
  markerType = 'donation',
  onMarkerClick
}: MapViewProps) {
  // Check if API key is available
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Card className="w-full" style={{ height }}>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Map Unavailable</h3>
            <p className="text-sm text-gray-600 mb-4">
              Google Maps API key is not configured. Map functionality is currently disabled.
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p>To enable maps:</p>
              <p>1. Get a Google Maps API key from Google Cloud Console</p>
              <p>2. Add it to your .env.local file as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<any | null>(null);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [directions, setDirections] = useState<any | null>(null);
  const [travelMode, setTravelMode] = useState<string>('DRIVING');
  
  const getTravelMode = useCallback((): google.maps.TravelMode => {
    if (!isLoaded || typeof google === 'undefined') {
      return google.maps.TravelMode?.DRIVING || 'DRIVING' as any;
    }

    switch (travelMode) {
      case 'WALKING':
        return google.maps.TravelMode.WALKING;
      case 'BICYCLING':
        return google.maps.TravelMode.BICYCLING;
      case 'TRANSIT':
        return google.maps.TravelMode.TRANSIT;
      case 'DRIVING':
      default:
        return google.maps.TravelMode.DRIVING;
    }
  }, [travelMode, isLoaded]);

  const [estimatedTime, setEstimatedTime] = useState<string | null>(null);
  const [estimatedDistance, setEstimatedDistance] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { mapCenter, setMapCenter } = useAppStore();
  const router = useRouter();
  const directionsCallback = useRef<((result: any | null, status: string) => void) | null>(null);

  // Get user's current location with performance optimization
  useEffect(() => {
    // Only attempt to get location if showUserLocation is true and we're in a browser environment
    if (!showUserLocation || typeof window === 'undefined' || typeof navigator === 'undefined') {
      // If geolocation is not requested or not in browser, use default center
      if (!initialCenter && !mapCenter) {
        setMapCenter(defaultCenter);
      }
      return;
    }
    
    // Check if geolocation is available in this browser
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      try {
        toastSonner.warning('Location services are not supported by your browser');
      } catch (e) {
        console.error('Toast error:', e);
      }

      // Use default center if no location is available
      if (!initialCenter && !mapCenter) {
        setMapCenter(defaultCenter);
      }
      return;
    }
    
    // Set a timeout to handle cases where geolocation hangs
    const timeoutId = setTimeout(() => {
      console.warn('Geolocation request timed out');
      try {
        toastSonner.warning('Location request timed out. Using default location instead.');
      } catch (e) {
        console.error('Toast error:', e);
      }

      // Use default center if timeout occurs
      if (!initialCenter && !mapCenter) {
        setMapCenter(defaultCenter);
      }
    }, 10000);
    
    // Define success handler
    const handleSuccess = (position: GeolocationPosition) => {
      clearTimeout(timeoutId);
      
      try {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Update user location state
        setUserLocation(pos);
        
        // Update map center if no initial center or map center is set
        if (!initialCenter && !mapCenter) {
          setMapCenter(pos);
        }
      } catch (error) {
        console.error('Error processing geolocation data:', error);
        
        // Use default center if error occurs
        if (!initialCenter && !mapCenter) {
          setMapCenter(defaultCenter);
        }
      }
    };
    
    // Define error handler
    const handleError = (error: GeolocationPositionError) => {
      clearTimeout(timeoutId);
      console.error('Error getting location:', error.message);
      
      try {
        // Provide specific error messages based on the error code
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toastSonner.error('Location access was denied', {
              description: 'Please enable location services in your browser settings to see your position on the map.'
            });
            break;
          case error.POSITION_UNAVAILABLE:
            toastSonner.error('Location information is unavailable', {
              description: 'Your device could not determine your current location. Using default location instead.'
            });
            break;
          case error.TIMEOUT:
            toastSonner.error('Location request timed out', {
              description: 'It took too long to get your location. Using default location instead.'
            });
            break;
          default:
            toastSonner.error('Could not get your location', {
              description: 'An unknown error occurred. Using default location instead.'
            });
        }
      } catch (e) {
        console.error('Toast error:', e);
      }
      
      // Use default center if error occurs
      if (!initialCenter && !mapCenter) {
        setMapCenter(defaultCenter);
      }
    };
    
    // Options for geolocation request
    const options = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0 // Don't use cached positions
    };
    
    // Request user's position
    try {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      );
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Exception getting user location:', error);
      try {
        toastSonner.error('An error occurred while trying to get your location');
      } catch (e) {
        console.error('Toast error:', e);
      }
      
      // Use default center if exception occurs
      if (!initialCenter && !mapCenter) {
        setMapCenter(defaultCenter);
      }
    }
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, [initialCenter, mapCenter, setMapCenter, showUserLocation, toastSonner]);
  
  // Calculate route between two points
  const calculateRoute = useCallback((origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
    if (!isLoaded || typeof google === 'undefined') {
      console.warn('Google Maps not loaded yet');
      return null;
    }
    
    try {
      // Create a DirectionsService object directly
      const directionsService = new google.maps.DirectionsService();
      
      // Request directions
      directionsService.route(
        {
          origin,
          destination,
          travelMode: getTravelMode(),
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
            
            // Extract and format estimated time and distance
            const route = result.routes[0];
            if (route && route.legs.length > 0) {
              const leg = route.legs[0];
              setEstimatedTime(leg.duration?.text || null);
              setEstimatedDistance(leg.distance?.text || null);
            }
          } else {
            console.error('Directions request failed:', status);
            setEstimatedTime('Unable to calculate');
            setEstimatedDistance('Unable to calculate');
            toastSonner.error('Could not calculate directions', {
              description: 'Please try again or use a different travel mode.'
            });
          }
        }
      );
      
      // For compatibility with the DirectionsService component
      directionsCallback.current = (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          // Extract and format estimated time and distance
          const route = result.routes[0];
          if (route && route.legs.length > 0) {
            const leg = route.legs[0];
            setEstimatedTime(leg.duration?.text || null);
            setEstimatedDistance(leg.distance?.text || null);
          }
        } else {
          console.error('DirectionsService callback failed:', status);
        }
      };
      
      // Return the request for the DirectionsService component
      return {
        origin,
        destination,
        travelMode: getTravelMode(),
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      toastSonner.error('Error calculating route', {
        description: 'An unexpected error occurred. Please try again.'
      });
      return null;
    }
  }, [isLoaded, getTravelMode, toastSonner]);

  // Start real-time location tracking
  const startTracking = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        setIsTracking(true);
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const newPos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(newPos);
            
            // If we have a selected donation and directions, recalculate route
            if (selectedDonation && 
                selectedDonation.pickupAddress && 
                selectedDonation.pickupAddress.latitude && 
                selectedDonation.pickupAddress.longitude) {
              calculateRoute(newPos, {
                lat: selectedDonation.pickupAddress.latitude,
                lng: selectedDonation.pickupAddress.longitude
              });
            }
          },
          (error) => {
            console.error('Error tracking location:', error);
            toastSonner.error('Location tracking error', {
              description: error.message || 'Could not track your location. Please check your device settings.'
            });
            setIsTracking(false);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
          }
        );
        setWatchId(id);
        
        // Show success message
        toastSonner.success('Location tracking started', {
          description: 'Your location is now being tracked in real-time.'
        });
      } catch (error: any) {
        console.error('Failed to start location tracking:', error);
        toastSonner.error('Could not start tracking', {
          description: 'Please check your browser permissions and try again.'
        });
        setIsTracking(false);
      }
    } else {
      toastSonner.error('Geolocation not supported', {
        description: 'Your browser does not support location tracking.'
      });
    }
  }, [selectedDonation, calculateRoute, setUserLocation, toastSonner]);
  
  // Stop real-time location tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
        setIsTracking(false);
        
        // Show success message
        toastSonner.success('Location tracking stopped', {
          description: 'Your location is no longer being tracked.'
        });
      } catch (error) {
        console.error('Error stopping location tracking:', error);
      }
    }
  }, [watchId]);
  
  // Clean up tracking on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const onLoad = useCallback((map: any) => {
    setMap(map);
    if (initialCenter) {
      map.setCenter(initialCenter);
    }
  }, [initialCenter]);

  const onUnmount = useCallback(() => {
    setMap(null);
    stopTracking();
  }, [stopTracking]);

  const handleMarkerClick = (donation: Donation) => {
    setSelectedDonation(donation);
    
    // Calculate route to this donation if we have user location
    if (userLocation && donation.pickupAddress && donation.pickupAddress.latitude && donation.pickupAddress.longitude) {
      calculateRoute(userLocation, {
        lat: donation.pickupAddress.latitude,
        lng: donation.pickupAddress.longitude
      });
    }
    
    if (onMarkerClick) {
      onMarkerClick(donation);
    }
  };

  // For demo purposes, generate mock donation markers if none provided
  const displayDonations = donations.length > 0 ? donations : [
    // Mock donations for demo
    {
      id: 'm1',
      donorId: 'd1',
      donorName: 'Green Valley Farms',
      title: 'Fresh vegetables',
      description: 'Variety of fresh vegetables including lettuce, carrots, and tomatoes',
      category: 'Fresh Produce',
      quantity: 20,
      quantityUnit: 'kg',
      imageUrls: [],
      pickupAddress: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        latitude: 40.730610 + 0.01,
        longitude: -73.935242 - 0.01
      },
      expiryDate: new Date('2025-05-30'),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: DonationStatus.ACTIVE
    },
    {
      id: 'm2',
      donorId: 'd2',
      donorName: 'Metro Grocery',
      title: 'Bread and pastries',
      description: 'Day-old bread and pastries still fresh for consumption',
      category: 'Bakery Items',
      quantity: 15,
      quantityUnit: 'items',
      imageUrls: [],
      pickupAddress: {
        street: '456 Broadway',
        city: 'New York',
        state: 'NY',
        postalCode: '10002',
        country: 'USA',
        latitude: 40.730610 - 0.01,
        longitude: -73.935242 + 0.005
      },
      expiryDate: new Date('2025-05-28'),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: DonationStatus.ACTIVE
    },
    {
      id: 'm3',
      donorId: 'd3',
      donorName: 'Community Kitchen',
      title: 'Prepared meals',
      description: 'Prepared meals ready for pickup and distribution',
      category: 'Prepared Meals',
      quantity: 30,
      quantityUnit: 'meals',
      imageUrls: [],
      pickupAddress: {
        street: '789 Park Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10003',
        country: 'USA',
        latitude: 40.730610 + 0.005,
        longitude: -73.935242 + 0.01
      },
      expiryDate: new Date('2025-05-26'),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: DonationStatus.ACTIVE
    }
  ];

  // Determine center of map
  const center = initialCenter || mapCenter || (
    userLocation ? userLocation : defaultCenter
  );

  if (loadError) {
    return (
      <Card className="w-full" style={{ height }}>
        <CardContent className="p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive">Error loading Google Maps</p>
            <p className="text-sm text-muted-foreground mt-2">
              {loadError.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card className="w-full" style={{ height }}>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading Map...</span>
        </CardContent>
      </Card>
    );
  }

  // Prepare directions request if we have selected donation and user location
  const directionsRequest = isLoaded && typeof google !== 'undefined' && selectedDonation && userLocation && 
    selectedDonation.pickupAddress && selectedDonation.pickupAddress.latitude && selectedDonation.pickupAddress.longitude
    ? {
        origin: userLocation,
        destination: {
          lat: selectedDonation.pickupAddress.latitude,
          lng: selectedDonation.pickupAddress.longitude
        },
        travelMode: getTravelMode()
      }
    : null;

  return (
    <div className="flex flex-col w-full" style={{ height }}>
      {/* Map controls */}
      {selectedDonation && userLocation && (
        <div className="bg-card p-3 rounded-t-md border-x border-t shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant={isTracking ? "destructive" : "default"}
                onClick={isTracking ? stopTracking : startTracking}
              >
                {isTracking ? "Stop Tracking" : "Start Live Tracking"}
                <Navigation className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="flex flex-col">
                <div className="flex items-center text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{estimatedTime || 'Calculating...'}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {estimatedDistance || 'Calculating distance...'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTravelMode('DRIVING')}
                className={travelMode === 'DRIVING' ? "bg-primary text-primary-foreground" : ""}
              >
                Driving
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTravelMode('WALKING')}
                className={travelMode === 'WALKING' ? "bg-primary text-primary-foreground" : ""}
              >
                Walking
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <GoogleMap
        mapContainerStyle={{
          ...mapContainerStyle,
          height: selectedDonation ? 'calc(100% - 56px)' : '100%',
          borderTopLeftRadius: selectedDonation ? 0 : 'var(--radius)',
          borderTopRightRadius: selectedDonation ? 0 : 'var(--radius)',
        }}
        center={center}
        zoom={initialZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
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
        {userLocation && (
          <CustomMarker
            position={userLocation}
            markerType="user"
          />
        )}

        {/* Donation markers */}
        {displayDonations.map((donation) => {
          // Check if pickupAddress and coordinates exist
          if (!donation.pickupAddress || 
              typeof donation.pickupAddress.latitude !== 'number' || 
              typeof donation.pickupAddress.longitude !== 'number') {
            console.warn(`Donation ${donation.id} has invalid coordinates`, donation.pickupAddress);
            return null; // Skip this marker
          }
          
          const position = {
            lat: donation.pickupAddress.latitude,
            lng: donation.pickupAddress.longitude
          };

          return (
            <CustomMarker
              key={donation.id}
              position={position}
              markerType={markerType}
              onClick={() => handleMarkerClick(donation)}
            >
              <div className="p-2 max-w-[250px]">
                <h3 className="font-medium text-sm">{donation.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{donation.donorName}</p>
                <p className="text-xs mt-1">
                  <span className="font-medium">Quantity:</span> {donation.quantity} {donation.quantityUnit}
                </p>
                <p className="text-xs mt-1">
                  <span className="font-medium">Expiry:</span> {donation.expiryDate instanceof Date ? 
                    donation.expiryDate.toLocaleDateString() : 
                    new Date(donation.expiryDate).toLocaleDateString()}
                </p>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    size="sm" 
                    className="flex-1 text-xs" 
                    onClick={(e) => {
                      e.stopPropagation();
                      try {
                        router.push(`/recipient/donations/${donation.id}`);
                      } catch (error) {
                        console.error('Navigation error:', error);
                        window.location.href = `/recipient/donations/${donation.id}`;
                      }
                    }}
                  >
                    View Details
                  </Button>
                  {userLocation && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (userLocation && donation.pickupAddress.latitude && donation.pickupAddress.longitude) {
                          calculateRoute(userLocation, {
                            lat: donation.pickupAddress.latitude,
                            lng: donation.pickupAddress.longitude
                          });
                          setSelectedDonation(donation);
                        }
                      }}
                    >
                      <Navigation className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CustomMarker>
          );
        })}
        
        {/* Render directions if available */}
        {directions && isLoaded && typeof google !== 'undefined' && (
          <DirectionsRenderer
            options={{
              directions: directions,
              suppressMarkers: true, // We'll use our custom markers
              polylineOptions: {
                strokeColor: 'hsl(var(--primary))',
                strokeWeight: 5,
                strokeOpacity: 0.7
              }
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
}
