'use client';

import { db, functions } from './firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, orderBy, limit, getDocs, startAfter, GeoPoint, DocumentData, QueryDocumentSnapshot, QuerySnapshot } from 'firebase/firestore';
import { Donation, DonationStatus, DonationWithDistance } from './types/donation.types';
import * as geofire from 'geofire-common';

// Interface for location coordinates
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Interface for geocoding response data
export interface GeocodeResponseData {
  latitude: number;
  longitude: number;
}

// Get donations near a specific location
export const getDonationsNearLocation = async (
  center: Coordinates,
  radiusInKm: number = 10,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  limitCount: number = 20
): Promise<{ donations: Donation[], lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    // Calculate the bounds of the geohash query
    const bounds = geofire.geohashQueryBounds(
      [center.latitude, center.longitude],
      radiusInKm * 1000 // Convert km to meters
    );
    
    // Create a base query for active donations
    let baseQuery = query(
      collection(db, 'donations'),
      where('status', '==', DonationStatus.ACTIVE)
    );
    
    if (lastDoc) {
      baseQuery = query(baseQuery, startAfter(lastDoc));
    }
    
    if (limitCount) {
      baseQuery = query(baseQuery, limit(limitCount));
    }
    
    // Create a query for each geohash range
    const promises = bounds.map(async ([startHash, endHash]: string[]) => {
      // Create a query for this specific geohash range
      const rangeQuery = query(
        baseQuery,
        where('geohash', '>=', startHash),
        where('geohash', '<=', endHash)
      );
      
      return getDocs(rangeQuery);
    });
    
    // Execute all queries
    const snapshots = await Promise.all(promises);
    
    // Combine results from all queries
    const matchingDocs: QueryDocumentSnapshot<DocumentData>[] = [];
    
    snapshots.forEach((snap: QuerySnapshot<DocumentData>) => {
 snap.docs.forEach((doc: QueryDocumentSnapshot<DocumentData, DocumentData>) => {
        matchingDocs.push(doc);
      });
    });
    
    // Filter out donations that are outside the specified radius
    const filteredDocs = matchingDocs.filter(doc => {
      const data = doc.data();
      
      // Skip if no geopoint
      if (!data.geopoint) return false;
      
      // Calculate distance
      const lat = data.geopoint.latitude;
      const lng = data.geopoint.longitude;
      
      const distanceInKm = geofire.distanceBetween(
        [center.latitude, center.longitude],
        [lat, lng]
      ) / 1000; // Convert meters to km
      
      return distanceInKm <= radiusInKm;
    });
    
    // Sort by distance
    filteredDocs.sort((a, b) => {
      const dataA = a.data();
      const dataB = b.data();
      
      const distanceA = geofire.distanceBetween(
        [center.latitude, center.longitude],
        [dataA.geopoint.latitude, dataA.geopoint.longitude]
      );
      
      const distanceB = geofire.distanceBetween(
        [center.latitude, center.longitude],
        [dataB.geopoint.latitude, dataB.geopoint.longitude]
      );
      
      return distanceA - distanceB;
    });
    
    // Limit to requested count
    const limitedDocs = filteredDocs.slice(0, limitCount);
    
    // Convert to Donation objects
    const donations: DonationWithDistance[] = limitedDocs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        expiryDate: data.expiryDate?.toDate() || new Date(),
        reservedAt: data.reservedAt?.toDate() || null,
        completedAt: data.completedAt?.toDate() || null,
        // Calculate distance from center
        distance: geofire.distanceBetween(
          [center.latitude, center.longitude],
          [data.geopoint.latitude, data.geopoint.longitude]
        ) / 1000 // Convert meters to km
      } as DonationWithDistance;
    });
    
    // Get the last visible document for pagination
    const lastVisible = limitedDocs.length > 0 ? limitedDocs[limitedDocs.length - 1] : null;
    
    return { donations, lastVisible };
  } catch (error) {
    console.error('Error getting donations near location:', error);
    throw error;
  }
};

// Geocode an address to get coordinates
export const geocodeAddress = async (address: string): Promise<Coordinates | null> => {
  try {
    // Call the geocoding Cloud Function
    const geocodeFunction = httpsCallable<any, GeocodeResponseData>(functions, 'geocodeAddress');
    const result = await geocodeFunction({ address });
    
    if (result.data) {
      return {
        latitude: result.data.latitude,
        longitude: result.data.longitude
      };
    }
    
    return null; // Geocoding failed
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

// Get user's current location
export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        console.error('Error getting current location:', error);
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};