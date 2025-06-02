import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DonationStatus } from './types/donation.types';
import { Address } from './types/user.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to a readable string
export function formatDate(date: Date | null | undefined): string {
  if (!date) return 'N/A';
  
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Format date with time
export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return 'N/A';
  
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Calculate time remaining until expiry
export function getTimeRemaining(expiryDate: Date | null | undefined): string {
  if (!expiryDate) return 'Unknown';
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  
  if (now > expiry) return 'Expired';
  
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ${diffHours} hr${diffHours !== 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else {
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  }
}

// Format address to a readable string
export function formatAddress(address: Address | null | undefined): string {
  if (!address) return 'No address provided';
  
  const { street, city, state, postalCode, country } = address;
  
  return [
    street,
    city,
    state,
    postalCode,
    country !== 'USA' ? country : ''
  ].filter(Boolean).join(', ');
}

// Get status color based on donation status
export function getStatusColor(status: DonationStatus): string {
  switch (status) {
    case DonationStatus.ACTIVE:
      return 'bg-green-100 text-green-800';
    case DonationStatus.RESERVED:
      return 'bg-blue-100 text-blue-800';
    case DonationStatus.COMPLETED:
      return 'bg-purple-100 text-purple-800';
    case DonationStatus.EXPIRED:
      return 'bg-orange-100 text-orange-800';
    case DonationStatus.CANCELLED:
      return 'bg-red-100 text-red-800';
    case DonationStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Calculate distance between two coordinates (in kilometers)
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(1));
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Generate a random color based on a string (for user avatars, etc.)
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}


