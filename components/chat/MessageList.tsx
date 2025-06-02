'use client';

import { useState, useEffect } from 'react';
import { format, isToday, isYesterday, isSameDay, differenceInMinutes } from 'date-fns';
import { User } from '@/lib/types/user.types';
import { ChatMessage, ChatRoom } from '@/lib/types/chat.types';
import { Message } from './Message';
import { Separator } from '@/components/ui/separator';
import { InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: User | null;
  currentRoom: ChatRoom;
  onDeleteMessage: (messageId: string) => void;
  onReplyMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, reaction: string) => void;
  className?: string;
}

// Time threshold in minutes for grouping messages from the same sender
const MESSAGE_GROUP_THRESHOLD = 5;

// System message types (could be expanded based on system message requirements)
type SystemMessageType = 'join' | 'leave' | 'rename' | 'info';

// System message interface
interface SystemMessage {
  id: string;
  type: SystemMessageType;
  text: string;
  timestamp: any; // Firebase Timestamp
}

export function MessageList({
  messages,
  currentUser,
  currentRoom,
  onDeleteMessage,
  onReplyMessage,
  onReactToMessage,
  className
}: MessageListProps) {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  
  // Reset selected message when messages change
  useEffect(() => {
    setSelectedMessageId(null);
  }, [currentRoom?.id]);
  
  // Format date for date separators
  const formatMessageDate = (timestamp: any) => {
    try {
      const date = timestamp.toDate();
      if (isToday(date)) {
        return 'Today';
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else {
        return format(date, 'MMMM d, yyyy');
      }
    } catch (e) {
      return '';
    }
  };
  
  // Determine if a message is the first in a group
  const isFirstInGroup = (message: ChatMessage, index: number) => {
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    
    // Different sender means new group
    if (prevMessage.senderId !== message.senderId) return true;
    
    // Check if messages are more than threshold minutes apart
    try {
      const prevTime = prevMessage.timestamp.toDate();
      const currentTime = message.timestamp.toDate();
      return differenceInMinutes(currentTime, prevTime) > MESSAGE_GROUP_THRESHOLD;
    } catch (e) {
      return true;
    }
  };
  
  // Determine if a message is the last in a group
  const isLastInGroup = (message: ChatMessage, index: number) => {
    if (index === messages.length - 1) return true;
    
    const nextMessage = messages[index + 1];
    
    // Different sender means end of group
    if (nextMessage.senderId !== message.senderId) return true;
    
    // Check if messages are more than threshold minutes apart
    try {
      const nextTime = nextMessage.timestamp.toDate();
      const currentTime = message.timestamp.toDate();
      return differenceInMinutes(nextTime, currentTime) > MESSAGE_GROUP_THRESHOLD;
    } catch (e) {
      return true;
    }
  };
  
  // Check if we need a date separator before this message
  const needsDateSeparator = (message: ChatMessage, index: number) => {
    if (index === 0) return true;
    
    const prevMessage = messages[index - 1];
    
    try {
      const prevDate = prevMessage.timestamp.toDate();
      const currentDate = message.timestamp.toDate();
      return !isSameDay(prevDate, currentDate);
    } catch (e) {
      return false;
    }
  };
  
  // Render a system message
  const renderSystemMessage = (message: SystemMessage) => {
    return (
      <div className="flex justify-center my-2">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs text-muted-foreground bg-accent/30">
          <InfoIcon className="h-3 w-3 mr-1" />
          <span>{message.text}</span>
        </div>
      </div>
    );
  };

  // Handle message selection
  const handleSelectMessage = (messageId: string) => {
    setSelectedMessageId(messageId === selectedMessageId ? null : messageId);
  };
  
  return (
    <div className={cn("space-y-1", className)}>
      {messages.map((message, index) => {
        // Check if we need a date separator
        const showDateSeparator = needsDateSeparator(message, index);
        
        // Determine grouping
        const firstInGroup = isFirstInGroup(message, index);
        const lastInGroup = isLastInGroup(message, index);
        
        return (
          <div key={message.id}>
            {/* Date Separator */}
            {showDateSeparator && (
              <div className="flex items-center justify-center my-4">
                <Separator className="flex-grow" />
                <span className="mx-4 text-xs font-medium text-muted-foreground">
                  {formatMessageDate(message.timestamp)}
                </span>
                <Separator className="flex-grow" />
              </div>
            )}
            
            {/* Handle system messages (if any are added to the messages array) */}
            {'type' in message && (message as any).type ? (
              renderSystemMessage(message as unknown as SystemMessage)
            ) : (
              <Message
                message={message}
                currentUser={currentUser}
                showSender={firstInGroup}
                isFirstInGroup={firstInGroup}
                isLastInGroup={lastInGroup}
                isSelected={selectedMessageId === message.id}
                onSelect={() => handleSelectMessage(message.id)}
                onDelete={onDeleteMessage}
                onReply={onReplyMessage}
                onReact={onReactToMessage}
              />
            )}
          </div>
        );
      })}
      
      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex justify-center py-8 text-muted-foreground text-sm">
          No messages yet
        </div>
      )}
    </div>
  );
}

