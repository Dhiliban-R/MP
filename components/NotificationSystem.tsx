import React, { useEffect, useState } from 'react';
import { useNotificationContext } from '@/contexts/notification-context';
import { Notification } from '@/lib/types/notification.types';
import { Bell, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

const NotificationSystem: React.FC = () => {
  const authContext = useAuth();
  const user = authContext?.user;
  const { notifications, addNotification, removeNotification } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Listen for real-time notifications from Firestore
  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notificationData = change.doc.data();
          const notification: Notification = {
            id: change.doc.id,
            userId: notificationData.userId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            read: notificationData.read,
            createdAt: notificationData.createdAt.toDate(),
            link: notificationData.link,
            relatedEntityId: notificationData.relatedEntityId,
            relatedEntityType: notificationData.relatedEntityType,
          };
          addNotification(notification);
        }
        if (change.type === 'removed') {
          removeNotification(change.doc.id);
        }
      });
    });

    return () => unsubscribe();
  }, [user, addNotification, removeNotification]);

  // Calculate unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      // Update local state
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      // This will trigger the useEffect to recalculate unreadCount
      setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update all unread notifications in Firestore
      const unreadNotifications = notifications.filter(n => !n.read);
      
      const updatePromises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, { read: true });
      });
      
      await Promise.all(updatePromises);
      
      // Update local state
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const formatTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 md:w-96 z-50 shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No notifications</p>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-3 rounded-md ${!notification.read ? 'bg-muted/50' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getNotificationTypeColor(notification.type)}>
                              {notification.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                          <h4 className="font-medium mt-1">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 w-6"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
            )}
    </div>
  );
};

export default NotificationSystem;
