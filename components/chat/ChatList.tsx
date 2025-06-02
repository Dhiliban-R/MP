'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Plus, 
  MessageCircle,
  Clock,
  CheckCheck,
  Check
} from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { ChatRoom, ChatRoomType } from '@/lib/types/chat.types';
import { formatDistanceToNow } from 'date-fns';

interface ChatListProps {
  selectedRoomId?: string | null;
  onRoomSelect: (roomId: string) => void;
  onNewChat?: () => void;
  className?: string;
}

export const ChatList: React.FC<ChatListProps> = ({
  selectedRoomId,
  onRoomSelect,
  onNewChat,
  className = ''
}) => {
  const { user } = useAuth();
  const {
    rooms,
    unreadCount,
    loading,
    error,
    refreshUnreadCount
  } = useChat({ autoLoadRooms: true });

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>([]);

  // Filter rooms based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRooms(rooms);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = rooms.filter(room => {
        // Search by room name
        if (room.name?.toLowerCase().includes(query)) return true;
        
        // Search by participant names
        const participantNames = room.participants
          .filter(p => p.userId !== user?.uid)
          .map(p => p.displayName.toLowerCase())
          .join(' ');
        
        if (participantNames.includes(query)) return true;
        
        // Search by last message
        if (room.lastMessage?.text.toLowerCase().includes(query)) return true;
        
        return false;
      });
      setFilteredRooms(filtered);
    }
  }, [rooms, searchQuery, user?.uid]);

  // Refresh unread count periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find(p => p.userId !== user?.uid);
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.name) return room.name;
    
    const otherParticipant = getOtherParticipant(room);
    return otherParticipant?.displayName || 'Unknown User';
  };

  const getUnreadCountForRoom = (room: ChatRoom) => {
    const participant = room.participants.find(p => p.userId === user?.uid);
    return participant?.unreadCount || 0;
  };

  const formatLastMessageTime = (timestamp: any) => {
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getLastMessagePreview = (room: ChatRoom) => {
    if (!room.lastMessage) return 'No messages yet';
    
    const { text, senderId } = room.lastMessage;
    const isOwnMessage = senderId === user?.uid;
    const prefix = isOwnMessage ? 'You: ' : '';
    
    return `${prefix}${text.length > 50 ? text.substring(0, 47) + '...' : text}`;
  };

  const getRoomTypeIcon = (type: ChatRoomType) => {
    switch (type) {
      case ChatRoomType.DONATION:
        return '🍽️';
      case ChatRoomType.DIRECT:
        return '💬';
      default:
        return '💬';
    }
  };

  if (loading.rooms) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Chats</span>
            <Badge variant="secondary">{unreadCount}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading chats...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error.rooms) {
    return (
      <Card className={`h-full ${className}`}>
        <CardHeader>
          <CardTitle>Chats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            <p>Failed to load chats</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Chats</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {onNewChat && (
            <Button variant="ghost" size="sm" onClick={onNewChat}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {filteredRooms.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </div>
          ) : (
            <div className="divide-y">
              {filteredRooms.map((room) => {
                const otherParticipant = getOtherParticipant(room);
                const unreadCount = getUnreadCountForRoom(room);
                const isSelected = selectedRoomId === room.id;

                return (
                  <div
                    key={room.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      isSelected ? 'bg-muted' : ''
                    }`}
                    onClick={() => onRoomSelect(room.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherParticipant?.photoURL} />
                          <AvatarFallback>
                            {otherParticipant?.displayName?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {/* Room type indicator */}
                        <div className="absolute -bottom-1 -right-1 text-xs">
                          {getRoomTypeIcon(room.type)}
                        </div>
                      </div>

                      {/* Chat info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">
                            {getRoomDisplayName(room)}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {room.lastMessage && (
                              <span className="text-xs text-muted-foreground">
                                {formatLastMessageTime(room.lastMessage.timestamp)}
                              </span>
                            )}
                            {unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs h-5 w-5 p-0 flex items-center justify-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Role and status */}
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {otherParticipant?.role}
                          </Badge>
                          {room.type === ChatRoomType.DONATION && (
                            <Badge variant="secondary" className="text-xs">
                              Donation
                            </Badge>
                          )}
                        </div>

                        {/* Last message */}
                        <div className="flex items-center justify-between mt-2">
                          <p className={`text-sm truncate ${
                            unreadCount > 0 ? 'font-medium' : 'text-muted-foreground'
                          }`}>
                            {getLastMessagePreview(room)}
                          </p>
                          
                          {/* Message status for own messages */}
                          {room.lastMessage?.senderId === user?.uid && (
                            <div className="flex-shrink-0 ml-2">
                              {/* This would show read/delivered status */}
                              <CheckCheck className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
