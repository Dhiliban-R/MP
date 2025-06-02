'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Paperclip, 
  MapPin, 
  MoreVertical, 
  Phone, 
  Video,
  X,
  Image as ImageIcon,
  File,
  Smile
} from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { ChatMessage, ChatRoom, ChatParticipant } from '@/lib/types/chat.types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ChatWindowProps {
  roomId: string | null;
  onClose?: () => void;
  className?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  roomId,
  onClose,
  className = ''
}) => {
  const { user } = useAuth();
  const {
    currentRoom,
    messages,
    typingUsers,
    loading,
    error,
    setCurrentRoom,
    sendTextMessage,
    sendFileMessage,
    setTyping,
    markAsRead,
    loadMoreMessages
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set current room when roomId changes
  useEffect(() => {
    if (roomId) {
      setCurrentRoom(roomId);
    }
  }, [roomId, setCurrentRoom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  useEffect(() => {
    if (messageText.trim() && !isTyping) {
      setIsTyping(true);
      setTyping(true);
    } else if (!messageText.trim() && isTyping) {
      setIsTyping(false);
      setTyping(false);
    }
  }, [messageText, isTyping, setTyping]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !currentRoom || loading.sendingMessage) return;

    try {
      await sendTextMessage(messageText, replyTo?.id);
      setMessageText('');
      setReplyTo(null);
      setIsTyping(false);
      setTyping(false);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentRoom) return;

    try {
      await sendFileMessage(file);
      toast.success('File sent successfully');
    } catch (error) {
      toast.error('Failed to send file');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getParticipantInfo = (userId: string): ChatParticipant | null => {
    return currentRoom?.participants.find(p => p.userId === userId) || null;
  };

  const formatMessageTime = (timestamp: any) => {
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  if (!roomId) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <p>Select a chat to start messaging</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading.messages && !currentRoom) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error.messages) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-destructive">
            <p>Failed to load chat</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setCurrentRoom(roomId)}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentRoom) {
    return (
      <Card className={`h-full ${className}`}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <p>Chat room not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const otherParticipant = currentRoom.participants.find(p => p.userId !== user?.uid);

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Chat Header */}
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant?.photoURL} />
              <AvatarFallback>
                {otherParticipant?.displayName?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {otherParticipant?.displayName || 'Unknown User'}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  {otherParticipant?.role}
                </Badge>
                {currentRoom.donationId && (
                  <Badge variant="outline" className="text-xs">
                    Donation Chat
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <Separator />

      {/* Messages Area */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === user?.uid;
              const sender = getParticipantInfo(message.senderId);

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    {!isOwnMessage && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={sender?.photoURL} />
                          <AvatarFallback className="text-xs">
                            {sender?.displayName?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-muted-foreground">
                          {sender?.displayName || 'Unknown'}
                        </span>
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.replyTo && (
                        <div className="border-l-2 border-muted-foreground/30 pl-2 mb-2 text-sm opacity-70">
                          <p>Replying to previous message</p>
                        </div>
                      )}
                      <p className="text-sm">{message.text}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment) => (
                            <div key={attachment.id} className="flex items-center space-x-2">
                              {attachment.type === 'image' ? (
                                <ImageIcon className="h-4 w-4" />
                              ) : (
                                <File className="h-4 w-4" />
                              )}
                              <span className="text-xs">{attachment.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs text-muted-foreground mt-1 ${
                      isOwnMessage ? 'text-right' : 'text-left'
                    }`}>
                      {formatMessageTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicators */}
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {typingUsers[0].displayName} is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <Separator />

      {/* Message Input */}
      <div className="p-4 flex-shrink-0">
        {replyTo && (
          <div className="mb-2 p-2 bg-muted rounded border-l-2 border-primary">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Replying to:</span>
                <p className="text-muted-foreground truncate">{replyTo.text}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading.uploadingFile}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={loading.sendingMessage}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || loading.sendingMessage}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,application/pdf,.doc,.docx"
        />
      </div>
    </Card>
  );
};
