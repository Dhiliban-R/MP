'use client';

import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
import { Notification } from './types/notification.types';
import { useAppStore } from '@/store/store';

// Create a new notification
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
  try {
    const notificationData = {
      ...notification,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a specific user
export const getUserNotifications = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
      // Note: orderBy removed to avoid index requirement in demo mode
    );

    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        read: data.read,
        createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
        link: data.link,
        relatedEntityId: data.relatedEntityId,
        relatedEntityType: data.relatedEntityType,
      });
    });

    // Sort notifications by createdAt in JavaScript
    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    // Return empty array as fallback instead of throwing
    return [];
  }
};

// Subscribe to real-time notifications for a user
export const subscribeToUserNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
      // Note: orderBy removed to avoid index requirement in demo mode
      // In production, create the required Firestore index for better performance
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notifications: Notification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          read: data.read,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          link: data.link,
          relatedEntityId: data.relatedEntityId,
          relatedEntityType: data.relatedEntityType,
        });
      });

      // Sort notifications by createdAt in JavaScript since we can't use orderBy
      notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      callback(notifications);
    }, (error) => {
      console.error('Error in notification subscription:', error);
      // Provide empty array as fallback
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const batch: any[] = [];

    querySnapshot.forEach((document) => {
      const notificationRef = doc(db, 'notifications', document.id);
      batch.push(updateDoc(notificationRef, { read: true }));
    });

    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string) => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Create notification for donation status change
export const createDonationStatusNotification = async (
  donationId: string,
  donationTitle: string,
  donorId: string,
  recipientId: string | undefined,
  status: string,
  recipientName?: string
) => {
  try {
    // Notification for donor
    let donorNotification: Omit<Notification, 'id' | 'createdAt'> = {
      userId: donorId,
      title: '',
      message: '',
      type: 'info',
      read: false,
      link: `/donor/donations/${donationId}`,
      relatedEntityId: donationId,
      relatedEntityType: 'donation'
    };

    // Notification for recipient (if applicable)
    let recipientNotification: Omit<Notification, 'id' | 'createdAt'> | null = null;

    switch (status) {
      case 'reserved':
        donorNotification.title = 'Donation Reserved';
        donorNotification.message = `Your donation "${donationTitle}" has been reserved by ${recipientName || 'a recipient'}.`;
        donorNotification.type = 'success';
        
        if (recipientId) {
          recipientNotification = {
            userId: recipientId,
            title: 'Reservation Confirmed',
            message: `You have successfully reserved "${donationTitle}". Please arrange pickup soon.`,
            type: 'success',
            read: false,
            link: `/recipient/donations/${donationId}`,
            relatedEntityId: donationId,
            relatedEntityType: 'donation'
          };
        }
        break;
        
      case 'completed':
        donorNotification.title = 'Donation Completed';
        donorNotification.message = `Your donation "${donationTitle}" has been successfully picked up.`;
        donorNotification.type = 'success';
        
        if (recipientId) {
          recipientNotification = {
            userId: recipientId,
            title: 'Pickup Completed',
            message: `You have successfully picked up "${donationTitle}". Thank you!`,
            type: 'success',
            read: false,
            link: `/recipient/donations/history`,
            relatedEntityId: donationId,
            relatedEntityType: 'donation'
          };
        }
        break;
        
      case 'cancelled':
        donorNotification.title = 'Donation Cancelled';
        donorNotification.message = `Your donation "${donationTitle}" has been cancelled.`;
        donorNotification.type = 'warning';
        
        if (recipientId) {
          recipientNotification = {
            userId: recipientId,
            title: 'Reservation Cancelled',
            message: `The reservation for "${donationTitle}" has been cancelled by the donor.`,
            type: 'warning',
            read: false,
            link: `/recipient/donations/available`,
            relatedEntityId: donationId,
            relatedEntityType: 'donation'
          };
        }
        break;
        
      case 'expired':
        donorNotification.title = 'Donation Expired';
        donorNotification.message = `Your donation "${donationTitle}" has expired.`;
        donorNotification.type = 'warning';
        break;
    }

    // Create notifications
    await createNotification(donorNotification);
    if (recipientNotification) {
      await createNotification(recipientNotification);
    }
  } catch (error) {
    console.error('Error creating donation status notification:', error);
    throw error;
  }
};

// Subscribe to real-time updates for donations
export const subscribeToDonations = (callback: (donations: any[]) => void) => {
  const q = query(collection(db, 'donations'), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const donations: any[] = [];
    querySnapshot.forEach((doc) => {
      donations.push({ id: doc.id, ...doc.data() });
    });
    callback(donations);
  });

  return unsubscribe;
};