'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';
import { Notification } from '@/lib/types/notification.types';

interface AppState {
  notifications: Notification[];
  user: User | null;
  unreadNotificationsCount: number;
  sidebarOpen: boolean;
  mapCenter: { lat: number; lng: number } | null;
  addNotification: (notification: Notification) => void;
  setNotifications: (notifications: Notification[]) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setUser: (user: User | null) => void;
  setMapCenter: (center: { lat: number; lng: number } | null) => void;
}

import type { StateCreator } from 'zustand';

export const useAppStore = create<AppState>()(
  persist<AppState>(
    (set) => ({
      notifications: [],
      unreadNotificationsCount: 0,
      user: null,
      sidebarOpen: true,
      mapCenter: null,

      addNotification: (notification: Notification) => {
        set((state: AppState) => {
          // Check if notification already exists to prevent duplicates
          if (state.notifications.some(n => n.id === notification.id)) {
            return state;
          }
          
          // Add new notification at the beginning of the array
          const newNotifications = [notification, ...state.notifications];
          
          // Update unread count if the notification is unread
          const newUnreadCount = notification.read 
            ? state.unreadNotificationsCount 
            : state.unreadNotificationsCount + 1;
          
          return {
            notifications: newNotifications,
            unreadNotificationsCount: newUnreadCount
          };
        });
      },
      
      // Set all notifications (used when syncing with Firestore)
      setNotifications: (notifications: Notification[]) => {
        set({
          notifications,
          unreadNotificationsCount: notifications.filter(n => !n.read).length
        });
      },
      
      // Remove a notification by ID
      removeNotification: (id: string) => {
        set((state: AppState) => {
          const notification = state.notifications.find(n => n.id === id);
          const updatedNotifications = state.notifications.filter(n => n.id !== id);
          
          // Update unread count if the removed notification was unread
          const newUnreadCount = notification && !notification.read
            ? state.unreadNotificationsCount - 1
            : state.unreadNotificationsCount;
          
          return {
            notifications: updatedNotifications,
            unreadNotificationsCount: newUnreadCount
          };
        });
      },

      markNotificationAsRead: (id: string) => {
        set((state: AppState) => {
          const updatedNotifications = state.notifications.map((notification: Notification) =>
            notification.id === id ? { ...notification, read: true } : notification
          );

          const unreadCount = updatedNotifications.filter((n: Notification) => !n.read).length;

          return {
            notifications: updatedNotifications,
            unreadNotificationsCount: unreadCount
          };
        });
      },

      markAllNotificationsAsRead: () => {
        set((state: AppState) => ({
          notifications: state.notifications.map((notification: Notification) => ({ ...notification, read: true })),
          unreadNotificationsCount: 0
        }));
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setUser: (user: User | null) => {
        set({ user });
      },

      setMapCenter: (center: { lat: number; lng: number } | null) => {
        set({ mapCenter: center });
      }
    }),
    {
      name: 'food-share-connect-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        user: state.user,
        notifications: state.notifications,
        mapCenter: state.mapCenter,
      }) as AppState,
    }
  )
);
