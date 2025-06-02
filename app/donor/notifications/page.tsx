'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCircle,
  Filter,
  Bell,
  AlertCircle,
  Package,
  Truck,
  Info,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DonorNotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId);
    if (link) {
      router.push(link);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">
          Notifications
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
          Stay updated on your donation activities and recipient interactions
        </p>
      </div>
        {/* Quick Actions Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shadow-md"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCircle className="h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Notification Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total</p>
                  <p className="text-2xl font-bold text-blue-900">{notifications.length}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Unread</p>
                  <p className="text-2xl font-bold text-orange-900">{unreadCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Donations</p>
                  <p className="text-2xl font-bold text-green-900">
                    {notifications.filter(n => n.type === 'info' || n.type === 'success').length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Pickups</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {notifications.filter(n => n.type === 'warning').length}
                  </p>
                </div>
                <Truck className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Your Notifications
                </CardTitle>
                <CardDescription>
                  Stay updated on your donation activity
                </CardDescription>
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="bg-white shadow-sm">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread" className="gap-2">
                    Unread
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                        {unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="success">Success</TabsTrigger>
                  <TabsTrigger value="warning">Warning</TabsTrigger>
                  <TabsTrigger value="error">Error</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                        !notification.read
                          ? 'bg-gradient-to-r from-primary/5 to-primary/2 border-primary/20 shadow-sm'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleNotificationClick(notification.id, notification.link)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            {getNotificationTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(notification.createdAt, {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            </div>
                            <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-500">
                      {activeTab === 'unread'
                        ? "You're all caught up! No unread notifications."
                        : "You don't have any notifications yet."}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
    </div>
  );
}
