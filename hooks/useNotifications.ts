'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/store';
import { useAuth } from './useAuth';
import { 
  subscribeToUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead as markAllRead,
  deleteNotification,
  createNotification
} from '@/lib/notification-service';
import { Notification } from '@/lib/types/notification.types';
import { useToast } from './use-toast';

export function useNotifications() {
  const authContext = useAuth();
  const user = authContext?.user;
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { 
    notifications, 
    addNotification,
    removeNotification, 
    markNotificationAsRead: markAsRead, 
    markAllNotificationsAsRead: markAllAsRead,
    unreadNotificationsCount,
    setNotifications
  } = useAppStore();

  // Subscribe to notifications from Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToUserNotifications(user.uid, (notificationsData) => {
      try {
        // Replace all notifications in the store with the latest from Firestore
        // This ensures we're always in sync with the database
        setNotifications(notificationsData);
        setLoading(false);
      } catch (err) {
        console.error('Error processing notifications:', err);
        setError('Failed to load notifications');
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, setNotifications]);

  // Handle marking a notification as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      // Update in Firestore
      await markNotificationAsRead(notificationId);
      // Update in local state
      markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive"
      });
    }
  }, [user, markAsRead, toast]);

  // Handle marking all notifications as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      // Update in Firestore
      await markAllRead(user.uid);
      // Update in local state
      markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive"
      });
    }
  }, [user, markAllAsRead, toast]);

  // Handle deleting a notification
  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      // Delete from Firestore
      await deleteNotification(notificationId);
      // Remove from local state
      removeNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive"
      });
    }
  }, [removeNotification, toast]);

  // Create a new notification
  const handleCreateNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      // Create in Firestore
      const notificationId = await createNotification(notification);
      // The real-time listener will update the store
      return notificationId;
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive"
      });
      return null;
    }
  }, [toast]);

  // Filter notifications
  const getFilteredNotifications = useCallback((filter: 'all' | 'unread' | 'read') => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      case 'all':
      default:
        return notifications;
    }
  }, [notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: 'info' | 'success' | 'warning' | 'error') => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  return {
    notifications,
    unreadNotificationsCount,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    createNotification: handleCreateNotification,
    getFilteredNotifications,
    getNotificationsByType
  };
}