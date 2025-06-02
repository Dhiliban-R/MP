'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Filter, Bell } from 'lucide-react';

export default function AdminNotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    const searchTermLower = searchTerm.toLowerCase();
    const titleMatch = notification.title.toLowerCase().includes(searchTermLower);
    const messageMatch = notification.message.toLowerCase().includes(searchTermLower);

    if (!titleMatch && !messageMatch) {
      return false;
    }

    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    return notification.type === activeTab;
  });

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="h-3 w-3 rounded-full bg-green-500" />;
      case 'warning':
        return <div className="h-3 w-3 rounded-full bg-orange-500" />;
      case 'error':
        return <div className="h-3 w-3 rounded-full bg-rose-500" />;
      default:
        return <div className="h-3 w-3 rounded-full bg-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-heading font-bold">Notifications</h2>
        <div className="flex gap-2 items-center">
          <a href="/admin/dashboard">
            <Button variant="secondary" size="sm">Back to Dashboard</Button>
          </a>
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={markAllAsRead}
            >
              <CheckCircle className="h-4 w-4" />
              Mark All Read
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>
                View and manage all system notifications
              </CardDescription>
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread 
                  {notifications.filter(n => !n.read).length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {notifications.filter(n => !n.read).length}
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
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id}
                    className={`p-4 border rounded-lg ${!notification.read ? 'bg-primary/5 border-primary/10' : ''}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium leading-none">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(notification.createdAt, {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium">No notifications</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {activeTab === 'all' 
                      ? 'You don\'t have any notifications yet' 
                      : `You don't have any ${activeTab === 'unread' ? 'unread' : activeTab} notifications`}
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
