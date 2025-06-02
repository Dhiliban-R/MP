'use client';

import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  Timestamp,
  doc,
  getDoc,
  writeBatch,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';

export interface BackupOptions {
  includeUsers?: boolean;
  includeDonations?: boolean;
  includeReservations?: boolean;
  includeNotifications?: boolean;
  includeAnalytics?: boolean;
  includeChats?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  format: 'json' | 'csv';
  compression?: boolean;
}

export interface BackupMetadata {
  id: string;
  createdAt: Date;
  createdBy: string;
  size: number;
  recordCount: number;
  collections: string[];
  format: 'json' | 'csv';
  compressed: boolean;
  status: 'pending' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
}

export interface RestoreOptions {
  backupId: string;
  collections: string[];
  overwriteExisting: boolean;
  validateData: boolean;
}

/**
 * Create a comprehensive backup of the system data
 */
export const createBackup = async (
  options: BackupOptions,
  userId: string
): Promise<string> => {
  try {
    const backupData: any = {
      metadata: {
        createdAt: new Date().toISOString(),
        createdBy: userId,
        version: '1.0',
        options
      }
    };

    let totalRecords = 0;
    const collections: string[] = [];

    // Backup Users
    if (options.includeUsers) {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      backupData.users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert timestamps to ISO strings for JSON compatibility
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        lastLogin: doc.data().lastLogin?.toDate?.()?.toISOString() || doc.data().lastLogin
      }));
      totalRecords += backupData.users.length;
      collections.push('users');
    }

    // Backup Donations
    if (options.includeDonations) {
      let donationsQuery = query(collection(db, 'donations'), orderBy('createdAt', 'desc'));
      
      if (options.dateRange) {
        donationsQuery = query(
          donationsQuery,
          where('createdAt', '>=', Timestamp.fromDate(options.dateRange.start)),
          where('createdAt', '<=', Timestamp.fromDate(options.dateRange.end))
        );
      }

      const donationsSnapshot = await getDocs(donationsQuery);
      backupData.donations = donationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
        expiryDate: doc.data().expiryDate?.toDate?.()?.toISOString() || doc.data().expiryDate,
        reservedAt: doc.data().reservedAt?.toDate?.()?.toISOString() || doc.data().reservedAt,
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt
      }));
      totalRecords += backupData.donations.length;
      collections.push('donations');
    }

    // Backup Reservations
    if (options.includeReservations) {
      let reservationsQuery = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
      
      if (options.dateRange) {
        reservationsQuery = query(
          reservationsQuery,
          where('createdAt', '>=', Timestamp.fromDate(options.dateRange.start)),
          where('createdAt', '<=', Timestamp.fromDate(options.dateRange.end))
        );
      }

      const reservationsSnapshot = await getDocs(reservationsQuery);
      backupData.reservations = reservationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        pickupTime: doc.data().pickupTime?.toDate?.()?.toISOString() || doc.data().pickupTime,
        completedAt: doc.data().completedAt?.toDate?.()?.toISOString() || doc.data().completedAt
      }));
      totalRecords += backupData.reservations.length;
      collections.push('reservations');
    }

    // Backup Notifications
    if (options.includeNotifications) {
      let notificationsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      
      if (options.dateRange) {
        notificationsQuery = query(
          notificationsQuery,
          where('createdAt', '>=', Timestamp.fromDate(options.dateRange.start)),
          where('createdAt', '<=', Timestamp.fromDate(options.dateRange.end))
        );
      }

      const notificationsSnapshot = await getDocs(notificationsQuery);
      backupData.notifications = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
      }));
      totalRecords += backupData.notifications.length;
      collections.push('notifications');
    }

    // Backup Analytics
    if (options.includeAnalytics) {
      const analyticsSnapshot = await getDocs(collection(db, 'analytics'));
      backupData.analytics = analyticsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      totalRecords += backupData.analytics.length;
      collections.push('analytics');
    }

    // Backup Chat Messages
    if (options.includeChats) {
      const chatsSnapshot = await getDocs(collection(db, 'chatRooms'));
      backupData.chatRooms = chatsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      }));

      // Get messages for each chat room
      backupData.messages = [];
      for (const chatRoom of backupData.chatRooms) {
        const messagesSnapshot = await getDocs(
          collection(db, 'chatRooms', chatRoom.id, 'messages')
        );
        const roomMessages = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          chatRoomId: chatRoom.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
        }));
        backupData.messages.push(...roomMessages);
      }
      
      totalRecords += backupData.chatRooms.length + backupData.messages.length;
      collections.push('chatRooms', 'messages');
    }

    // Convert to requested format
    let backupContent: string;
    let mimeType: string;
    let fileExtension: string;

    if (options.format === 'json') {
      backupContent = JSON.stringify(backupData, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
    } else {
      backupContent = convertToCSV(backupData);
      mimeType = 'text/csv';
      fileExtension = 'csv';
    }

    // Create backup metadata record
    const backupMetadata: Omit<BackupMetadata, 'id'> = {
      createdAt: new Date(),
      createdBy: userId,
      size: new Blob([backupContent]).size,
      recordCount: totalRecords,
      collections,
      format: options.format,
      compressed: options.compression || false,
      status: 'completed'
    };

    const backupRef = await addDoc(collection(db, 'backups'), {
      ...backupMetadata,
      createdAt: serverTimestamp()
    });

    // Download the backup file
    const blob = new Blob([backupContent], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fdms-backup-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.${fileExtension}`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success(`Backup created successfully with ${totalRecords} records`);
    return backupRef.id;

  } catch (error) {
    console.error('Error creating backup:', error);
    toast.error('Failed to create backup');
    throw error;
  }
};

/**
 * Convert backup data to CSV format
 */
const convertToCSV = (data: any): string => {
  const csvSections: string[] = [];

  // Convert each collection to CSV
  Object.keys(data).forEach(key => {
    if (key === 'metadata') return;
    
    const collection = data[key];
    if (Array.isArray(collection) && collection.length > 0) {
      csvSections.push(`\n# ${key.toUpperCase()}\n`);
      
      // Get headers from first object
      const headers = Object.keys(collection[0]);
      csvSections.push(headers.join(','));
      
      // Add data rows
      collection.forEach(item => {
        const row = headers.map(header => {
          const value = item[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        csvSections.push(row.join(','));
      });
    }
  });

  return csvSections.join('\n');
};

/**
 * Get list of available backups
 */
export const getBackupHistory = async (): Promise<BackupMetadata[]> => {
  try {
    const backupsSnapshot = await getDocs(
      query(collection(db, 'backups'), orderBy('createdAt', 'desc'))
    );
    
    return backupsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as BackupMetadata[];
  } catch (error) {
    console.error('Error getting backup history:', error);
    throw error;
  }
};

/**
 * Delete a backup record
 */
export const deleteBackup = async (backupId: string): Promise<void> => {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'backups', backupId));
    await batch.commit();
    
    toast.success('Backup deleted successfully');
  } catch (error) {
    console.error('Error deleting backup:', error);
    toast.error('Failed to delete backup');
    throw error;
  }
};

/**
 * Validate backup data integrity
 */
export const validateBackupData = (backupData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check metadata
  if (!backupData.metadata) {
    errors.push('Missing backup metadata');
  }

  // Validate each collection
  if (backupData.users) {
    backupData.users.forEach((user: any, index: number) => {
      if (!user.id || !user.email) {
        errors.push(`Invalid user data at index ${index}`);
      }
    });
  }

  if (backupData.donations) {
    backupData.donations.forEach((donation: any, index: number) => {
      if (!donation.id || !donation.title || !donation.donorId) {
        errors.push(`Invalid donation data at index ${index}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  createBackup,
  getBackupHistory,
  deleteBackup,
  validateBackupData
};
