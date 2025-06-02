'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Plus, 
  User, 
  Users, 
  Search, 
  Package, 
  RefreshCw,
  AlertCircle 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChatRoom, ChatRoomType } from '@/lib/types/chat.types';

interface ChatRoomListProps {
  onSelectRoom: (roomId: string) => void;
  selectedRoomId?: string;
  className?: string;
}

export function ChatRoomList({ onSelectRoom, selectedRoomId, className }: ChatRoomListProps) {
  const { user } = useAuth();
  const { 
    rooms, 
    loading, 
    error,
    refreshUnreadCount
  } = useChat();

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRooms, setFilteredRooms] = useState<ChatRoom[]>([]);

  // Apply search/filter to rooms
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRooms(rooms);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = rooms.filter(room => {
      // Search by room name if available
      if (room.name && room.name.toLowerCase().includes(lowerSearchTerm)) {
        return true;
      }

      // Search by participant names
      return room.participants.some(
        p => p.userId !== user?.uid && p.displayName.toLowerCase().includes(lowerSearchTerm)
      );
    });

    setFilteredRooms(filtered);
  }, [rooms, searchTerm, user?.uid]);

  // Get other participant for display in direct chats
  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find(p => p.userId !== user?.uid);
  };

  // Format the last message time
  const formatLastMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp.toDate()), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  // Get room display name
  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.name) return room.name;
    
    if (room.type === ChatRoomType.DIRECT) {
      const otherParticipant = getOtherParticipant(room);
      return otherParticipant?.displayName || 'Chat';
    }
    
    return 'Chat Room';
  };

  // Get room avatar
  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === ChatRoomType.DIRECT) {
      const otherParticipant = getOtherParticipant(room);
      return otherParticipant?.photoURL || '';
    }
    
    return ''; // Default or group avatar could be added here
  };

  // Get initials for avatar fallback
  const getInitials = (room: ChatRoom) => {
    if (room.type === ChatRoomType.DIRECT) {
      const otherParticipant = getOtherParticipant(room);
      if (otherParticipant) {
        return otherParticipant.displayName
          .split(' ')
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
      }
    }
    
    return room.name 
      ? room.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'CH';
  };

  // Get unread count for a room
  const getUnreadCount = (room: ChatRoom) => {
    const currentUserParticipant = room.participants.find(p => p.userId === user?.uid);
    return currentUserParticipant?.unreadCount || 0;
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="p-3 border-b">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Messages</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refreshUnreadCount()}
            disabled={loading.rooms}
          >
            <RefreshCw className={cn(
              "h-4 w-4", 
              loading.rooms ? "animate-spin" : ""
            )} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {error.rooms && (
        <div className="p-3 text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Error loading conversations
        </div>
      )}
      
      <ScrollArea className="flex-1">
        {loading.rooms && !rooms.length ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {searchTerm ? 'No conversations found' : 'No conversations yet'}
          </div>
        ) : (
          <div className="p-1">
            {filteredRooms.map((room) => {
              const isSelected = selectedRoomId === room.id;
              const unreadCount = getUnreadCount(room);
              const lastMessage = room.lastMessage;
              
              return (
                <div
                  key={room.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => onSelectRoom(room.id)}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getRoomAvatar(room)} alt={getRoomDisplayName(room)} />
                    <AvatarFallback>
                      {room.type === ChatRoomType.DIRECT ? (
                        <User className="h-4 w-4" />
                      ) : room.type === ChatRoomType.DONATION ? (
                        <Package className="h-4 w-4" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-medium truncate">
                        {getRoomDisplayName(room)}
                      </span>
                      {lastMessage?.timestamp && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
                          {formatLastMessageTime(lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground truncate">
                        {lastMessage?.text || 'No messages yet'}
                      </span>
                      
                      {unreadCount > 0 && (
                        <Badge variant="default" className="ml-1">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t">
        <Button className="w-full" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>
    </div>
  );
}

