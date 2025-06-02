'use client';

import { useState, useRef } from 'react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { User } from '@/lib/types/user.types';
import { ChatMessage, ChatRoom, MessageStatus, ChatAttachment } from '@/lib/types/chat.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  MoreVertical,
  Trash2,
  Reply,
  Copy,
  Check,
  CheckCheck,
  Clock,
  FileText,
  Image as ImageIcon,
  Download,
  MessageSquare,
  ThumbsUp,
  Heart,
  Laugh,
  Frown,
  Paperclip
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageProps {
  message: ChatMessage;
  currentUser: User | null;
  showSender?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onReact?: (messageId: string, reaction: string) => void;
}

export function Message({
  message,
  currentUser,
  showSender = true,
  isFirstInGroup = true,
  isLastInGroup = true,
  isSelected = false,
  onSelect,
  onDelete,
  onReply,
  onReact,
}: MessageProps) {
  const [showActions, setShowActions] = useState(false);
  const isCurrentUser = message.senderId === currentUser?.uid;
  
  // Format message timestamp
  const formatMessageTime = (timestamp: any) => {
    try {
      const date = timestamp.toDate();
      return format(date, 'h:mm a');
    } catch (e) {
      return '';
    }
  };
  
  // Format timestamp for tooltip
  const formatMessageDate = (timestamp: any) => {
    try {
      const date = timestamp.toDate();
      if (isToday(date)) {
        return `Today at ${format(date, 'h:mm a')}`;
      } else if (isYesterday(date)) {
        return `Yesterday at ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, yyyy h:mm a');
      }
    } catch (e) {
      return '';
    }
  };
  
  // Get sender initials for avatar
  const getSenderInitials = () => {
    return message.senderName
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  // Get message status icon
  const getStatusIcon = () => {
    if (isCurrentUser) {
      switch (message.status) {
        case MessageStatus.SENT:
          return <Check className="h-3 w-3 text-muted-foreground" />;
        case MessageStatus.DELIVERED:
          return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
        case MessageStatus.READ:
          return <CheckCheck className="h-3 w-3 text-primary" />;
        default:
          return <Clock className="h-3 w-3 text-muted-foreground" />;
      }
    }
    return null;
  };
  
  // Handle copy message text
  const handleCopyText = () => {
    navigator.clipboard.writeText(message.text);
  };
  
  // Render file attachment
  const renderAttachment = (attachment: ChatAttachment) => {
    if (attachment.type === 'image') {
      return (
        <div className="mt-2 relative group">
          <img 
            src={attachment.url} 
            alt={attachment.name} 
            className="max-w-[240px] max-h-[240px] rounded-md object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
            <Button size="sm" variant="ghost" className="text-white" asChild>
              <a href={attachment.url} target="_blank" rel="noopener noreferrer" download={attachment.name}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="mt-2">
          <a 
            href={attachment.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center p-2 border rounded-md hover:bg-accent transition-colors"
          >
            {attachment.type === 'file' ? (
              <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
            ) : (
              <Paperclip className="h-4 w-4 mr-2 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{attachment.name}</div>
              {attachment.size && (
                <div className="text-xs text-muted-foreground">
                  {(attachment.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>
            <Download className="h-4 w-4 ml-2 flex-shrink-0 text-muted-foreground" />
          </a>
        </div>
      );
    }
  };
  
  // Render message reactions
  const renderReactions = () => {
    // This would be populated from the message's reactions field if available
    const reactions = [
      { emoji: '👍', count: 2 },
      { emoji: '❤️', count: 1 },
    ];
    
    if (!reactions || reactions.length === 0) return null;
    
    return (
      <div className="flex gap-1 mt-1">
        {reactions.map((reaction, index) => (
          <div 
            key={index} 
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-accent"
          >
            <span className="mr-0.5">{reaction.emoji}</span>
            <span>{reaction.count}</span>
          </div>
        ))}
      </div>
    );
  };

  // Check if message is deleted
  const isDeleted = message.isDeleted;
  
  return (
    <div
      className={cn(
        "flex gap-2 px-2 py-1 relative group",
        isSelected ? "bg-accent/60" : "hover:bg-accent/20",
        isCurrentUser ? "flex-row-reverse" : "flex-row",
        !isFirstInGroup && !isCurrentUser && "pl-12"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={onSelect}
    >
      {/* Sender Avatar - only shown for first message in a group from other users */}
      {!isCurrentUser && isFirstInGroup && (
        <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
          <AvatarImage src={message.senderPhotoURL} alt={message.senderName} />
          <AvatarFallback>{getSenderInitials()}</AvatarFallback>
        </Avatar>
      )}
      
      {/* Message Content */}
      <div className={cn(
        "flex flex-col",
        isCurrentUser ? "items-end" : "items-start",
        isCurrentUser && "text-right"
      )}>
        {/* Sender Name - only shown for first message in a group */}
        {!isCurrentUser && isFirstInGroup && showSender && (
          <div className="text-sm font-medium mb-1">{message.senderName}</div>
        )}
        
        {/* Message Bubble */}
        <div className={cn(
          "px-3 py-2 rounded-lg max-w-xs sm:max-w-md break-words",
          isCurrentUser 
            ? "bg-primary text-primary-foreground rounded-tr-none" 
            : "bg-accent rounded-tl-none",
          isDeleted && "italic opacity-70"
        )}>
          {isDeleted ? (
            <span>This message has been deleted</span>
          ) : (
            <>
              {/* If replying to another message */}
              {message.replyTo && (
                <div className="p-1.5 mb-1.5 border-l-2 border-primary-foreground/50 text-xs rounded bg-primary-foreground/10">
                  <div className="font-medium">Reply to a message</div>
                  <div className="truncate">Some previous message text here...</div>
                </div>
              )}
              
              {/* Message Text */}
              <div className="whitespace-pre-wrap">{message.text}</div>
              
              {/* Attachments */}
              {message.attachments && message.attachments.map((attachment, index) => (
                <div key={index}>
                  {renderAttachment(attachment)}
                </div>
              ))}
            </>
          )}
        </div>
        
        {/* Reactions */}
        {renderReactions()}
        
        {/* Message Info (Time & Status) */}
        <div className={cn(
          "flex items-center text-xs text-muted-foreground mt-1",
          isCurrentUser ? "justify-end" : "justify-start"
        )}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>{formatMessageTime(message.timestamp)}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatMessageDate(message.timestamp)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Status Indicator for current user's messages */}
          {isCurrentUser && (
            <span className="ml-1">{getStatusIcon()}</span>
          )}
        </div>
      </div>
      
      {/* Message Actions */}
      {showActions && !isDeleted && (
        <div className={cn(
          "absolute top-0 flex items-center gap-1",
          isCurrentUser ? "left-0" : "right-0"
        )}>
          {/* Quick Reactions */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => onReact?.(message.id, "👍")}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Like</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Reply */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => onReply?.(message.id)}
                >
                  <Reply className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reply</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isCurrentUser ? "start" : "end"}>
              <DropdownMenuItem onClick={() => onReply?.(message.id)}>
                <Reply className="h-4 w-4 mr-2" />
                Reply
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyText}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Text
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReact?.(message.id, "👍")}>
                <ThumbsUp className="h-4 w-4 mr-2" />
                Like
              </DropdownMenuItem>
              {isCurrentUser && (
                <DropdownMenuItem 
                  className="text-red-500 focus:text-red-500"
                  onClick={() => onDelete?.(message.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

