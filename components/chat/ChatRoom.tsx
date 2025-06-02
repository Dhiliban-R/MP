'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  User,
  Users,
  Package,
  MoreVertical,
  Loader2,
  Bell,
  BellOff,
  Trash,
  LogOut,
  AlertCircle,
  ChevronLeft,
  Info,
  Clock,
  CircleCheck,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatRoom as ChatRoomType, ChatRoomType as RoomType, ChatParticipant } from '@/lib/types/chat.types';
import { Timestamp } from 'firebase/firestore';

interface ChatRoomProps {
  roomId: string;
  onBack?: () => void;
  className?: string;
}

export function ChatRoom({ roomId, onBack, className }: ChatRoomProps) {
  const { user } = useAuth();
  const { 
    currentRoom,
    messages,
    typingUsers,
    loading,
    error,
    setCurrentRoom,
    leaveRoom,
    sendTextMessage,
    sendFileMessage,
    markAsRead,
    setTyping,
    loadMoreMessages
  } = useChat();
  
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showBackButton, setShowBackButton] = useState(false);
  
  // Set current room when roomId changes
  useEffect(() => {
    if (roomId) {
      setCurrentRoom(roomId);
    }
    
    return () => {
      // Clean up when component unmounts
      setCurrentRoom(null);
    };
  }, [roomId, setCurrentRoom]);
  
  // Determine if we should show the back button based on screen size
  useEffect(() => {
    const handleResize = () => {
      setShowBackButton(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Mark messages as read when the component mounts or new messages arrive
  useEffect(() => {
    if (currentRoom && !loading.messages) {
      markAsRead();
    }
  }, [currentRoom, messages.length, loading.messages, markAsRead]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !loading.messages) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loading.messages]);
  
  // Get other participant for display in direct chats
  const getOtherParticipant = (room: ChatRoomType) => {
    return room?.participants.find(p => p.userId !== user?.uid);
  };
  
  // Get room display name
  const getRoomDisplayName = () => {
    if (!currentRoom) return 'Chat';
    
    if (currentRoom.name) return currentRoom.name;
    
    if (currentRoom.type === RoomType.DIRECT) {
      const otherParticipant = getOtherParticipant(currentRoom);
      return otherParticipant?.displayName || 'Chat';
    }
    
    return 'Chat Room';
  };
  
  // Get room avatar
  const getRoomAvatar = () => {
    if (!currentRoom) return '';
    
    if (currentRoom.type === RoomType.DIRECT) {
      const otherParticipant = getOtherParticipant(currentRoom);
      return otherParticipant?.photoURL || '';
    }
    
    return ''; // Default or group avatar could be added here
  };
  
  // Get room status display info
  const getRoomStatus = () => {
    if (!currentRoom) return null;
    
    if (currentRoom.type === RoomType.DIRECT) {
      const otherParticipant = getOtherParticipant(currentRoom);
      if (otherParticipant?.lastSeen) {
        const lastSeen = otherParticipant.lastSeen.toDate();
        // If seen within last 5 minutes, show as "online"
        if (Date.now() - lastSeen.getTime() < 5 * 60 * 1000) {
          return <Badge variant="outline" className="text-green-500 bg-green-50">Online</Badge>;
        } else {
          return (
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {`Last seen ${format(lastSeen, 'h:mm a')}`}
            </div>
          );
        }
      }
    } else if (currentRoom.type === RoomType.DONATION) {
      return (
        <Badge variant="outline" className="bg-blue-50">
          <Package className="h-3 w-3 mr-1" />
          Donation Chat
        </Badge>
      );
    } else {
      const participantCount = currentRoom.participants.length;
      return (
        <Badge variant="outline">
          <Users className="h-3 w-3 mr-1" />
          {`${participantCount} members`}
        </Badge>
      );
    }
    
    return null;
  };
  
  // Handle load more messages
  const handleLoadMore = async () => {
    if (loading.messages || !messages.length) return;
    
    try {
      const oldestMessage = messages[0];
      if (oldestMessage) {
        await loadMoreMessages(oldestMessage.timestamp as Timestamp);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      setHasMore(false);
    }
  };
  
  // Handle leave room
  const handleLeaveRoom = async () => {
    if (!currentRoom) return;
    
    try {
      await leaveRoom(currentRoom.id);
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };
  
  // Handle send message
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    try {
      await sendTextMessage(text);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      await sendFileMessage(file);
    } catch (error) {
      console.error('Error sending file:', error);
    }
  };
  
  // Handle typing status change
  const handleTypingChange = (isTyping: boolean) => {
    setTyping(isTyping);
  };
  
  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!typingUsers.length) return null;
    
    const typingNames = typingUsers.map(user => user.displayName).join(', ');
    
    return (
      <div className="px-4 py-1 text-xs text-muted-foreground italic">
        {typingUsers.length === 1 
          ? `${typingNames} is typing...` 
          : `${typingNames} are typing...`}
      </div>
    );
  };

  // Show loading state if still loading the chat room
  if (loading.rooms && !currentRoom) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-3 border-b flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show error message if there was an error loading the chat room
  if (error.rooms && !currentRoom) {
    return (
      <div className={cn("flex flex-col h-full", className)}>
        <div className="p-3 border-b flex items-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">Chat</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There was an error loading this chat.
              <Button variant="link" className="p-0 h-auto" onClick={() => setCurrentRoom(roomId)}>
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Show empty state if no room is selected
  if (!currentRoom) {
    return (
      <div className={cn("flex flex-col h-full items-center justify-center text-muted-foreground", className)}>
        <MessageSquare className="h-12 w-12 mb-4" />
        <h3 className="text-lg font-medium mb-2">No chat selected</h3>
        <p className="text-sm max-w-xs text-center">
          Select a conversation from the list or start a new one
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Chat Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={getRoomAvatar()} alt={getRoomDisplayName()} />
            <AvatarFallback>
              {currentRoom.type === RoomType.DIRECT ? (
                <User className="h-4 w-4" />
              ) : currentRoom.type === RoomType.DONATION ? (
                <Package className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="text-lg font-semibold">{getRoomDisplayName()}</h2>
            <div className="text-sm text-muted-foreground">
              {getRoomStatus()}
            </div>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Bell className="h-4 w-4 mr-2" />
              Mute Notifications
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Info className="h-4 w-4 mr-2" />
              Chat Information
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500" 
              onClick={handleLeaveRoom}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Message List */}
        <ScrollArea className="flex-1">
          {loading.messages && messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-4 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2" />
              <p className="text-center max-w-xs">
                No messages yet. Send a message to start the conversation!
              </p>
            </div>
          ) : (
            <div className="py-4 px-2">
              {hasMore && (
                <div className="flex justify-center mb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loading.messages}
                  >
                    {loading.messages ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
              
              <MessageList 
                messages={messages} 
                currentUser={user} 
                currentRoom={currentRoom}
                onDeleteMessage={(messageId) => {/* Handle delete message */}}
              />
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        {/* Typing Indicator */}
        {renderTypingIndicator()}
        
        {/* Message Input */}
        <div className="p-3 border-t">
          <MessageInput 
            onSendMessage={handleSendMessage} 
            onFileUpload={handleFileUpload}
            onTypingChange={handleTypingChange}
            disabled={loading.sendingMessage || loading.uploadingFile}
            isLoading={loading.sendingMessage || loading.uploadingFile}
          />
        </div>
      </div>
    </div>
  );
}

