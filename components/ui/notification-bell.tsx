'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Info, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '@/hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification } from '@/lib/types/notification.types';
import { useAuth } from '@/hooks/useAuth';

export function NotificationBell() {
  const { 
    notifications, 
    unreadNotificationsCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    getFilteredNotifications
  } = useNotifications();
  const authContext = useAuth();
  const user = authContext?.user;
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'unread' | 'all'>('unread');
  const router = useRouter();

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId);
    setOpen(false);

    if (link) {
      router.push(link);
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get filtered notifications based on active tab
  const displayNotifications = activeTab === 'unread' 
    ? getFilteredNotifications('unread')
    : notifications;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative md:h-8 md:w-8">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadNotificationsCount > 0 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="absolute -right-1 -top-1"
              >
                <Badge 
                  variant="destructive" 
                  className="flex h-5 min-w-5 items-center justify-center rounded-full p-0 text-xs"
                >
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[350px] p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadNotificationsCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => markAllAsRead()}
            >
              <Check className="mr-1 h-3 w-3" />
              Mark all as read
            </Button>
          )}
        </div>
        
        <Tabs 
          defaultValue="unread" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'unread' | 'all')}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadNotificationsCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                  {unreadNotificationsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[300px]">
            {loading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-4 w-4 mt-0.5 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {activeTab === 'unread' ? (
                  <>
                    <CheckCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>You're all caught up!</p>
                    <p className="text-xs mt-1">No unread notifications</p>
                  </>
                ) : (
                  <>
                    <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>No notifications yet</p>
                    <p className="text-xs mt-1">We'll notify you when something happens</p>
                  </>
                )}
              </div>
            ) : (
              <AnimatePresence>
                {displayNotifications.map((notification: Notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DropdownMenuItem
                      className={`flex cursor-pointer items-start gap-2 p-3 focus:bg-accent ${
                        !notification.read ? 'bg-accent/30' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id, notification.link)}
                    >
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 -mr-1 -mt-1 text-muted-foreground hover:text-foreground"
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground/70">
                            {formatDistanceToNow(notification.createdAt, {
                              addSuffix: true,
                            })}
                          </p>
                          {!notification.read && (
                            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                          )}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </ScrollArea>
        </Tabs>
        
        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs h-8"
            onClick={() => {
              setOpen(false);
              if (user?.role) {
                router.push(`/${user.role}/notifications`);
              }
            }}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
