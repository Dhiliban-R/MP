'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  File as FileIcon, 
  Smile, 
  X, 
  Loader2,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import TextareaAutosize from 'react-textarea-autosize';

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Debounce time for typing indicator in milliseconds
const TYPING_DEBOUNCE_TIME = 800;

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onFileUpload: (file: File) => Promise<void>;
  onTypingChange: (isTyping: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  replyToMessage?: { id: string; text: string; sender: string } | null;
  onCancelReply?: () => void;
  placeholder?: string;
  className?: string;
}

interface FilePreview {
  file: File;
  previewUrl: string;
  type: 'image' | 'file';
}

export function MessageInput({
  onSendMessage,
  onFileUpload,
  onTypingChange,
  disabled = false,
  isLoading = false,
  replyToMessage = null,
  onCancelReply,
  placeholder = 'Type a message...',
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Typing indicator debounce
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        // Ensure we clear the typing indicator when component unmounts
        onTypingChange(false);
      }
    };
  }, [onTypingChange]);
  
  // Handle typing indicator
  const handleTypingChange = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      onTypingChange(true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTypingChange(false);
    }, TYPING_DEBOUNCE_TIME);
  }, [isTyping, onTypingChange]);
  
  // Handle message input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Update typing indicator
    if (e.target.value.length > 0) {
      handleTypingChange();
    } else if (isTyping) {
      // Clear typing indicator immediately if message is empty
      setIsTyping(false);
      onTypingChange(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    const invalidFiles: string[] = [];
    
    // Validate file size
    selectedFiles.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (exceeds 5MB limit)`);
      }
    });
    
    if (invalidFiles.length > 0) {
      // Show error for invalid files
      alert(`The following files are too large:\n${invalidFiles.join('\n')}`);
      return;
    }
    
    // Create file previews
    const newFilePreviews = selectedFiles.map(file => {
      const isImage = file.type.startsWith('image/');
      const previewUrl = isImage 
        ? URL.createObjectURL(file) 
        : '';
        
      return {
        file,
        previewUrl,
        type: isImage ? 'image' : 'file' as 'image' | 'file',
      };
    });
    
    setFiles(prev => [...prev, ...newFilePreviews]);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      
      // Revoke the object URL to avoid memory leaks
      if (newFiles[index].previewUrl) {
        URL.revokeObjectURL(newFiles[index].previewUrl);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading || isUploading || (message.trim() === '' && files.length === 0)) {
      return;
    }
    
    try {
      // First, upload any files
      if (files.length > 0) {
        setIsUploading(true);
        
        // For a real implementation, you would upload each file and track progress
        for (let i = 0; i < files.length; i++) {
          // Simulate upload progress
          for (let progress = 0; progress <= 100; progress += 10) {
            setUploadProgress(progress);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          // Upload file
          await onFileUpload(files[i].file);
          
          // Revoke object URL
          if (files[i].previewUrl) {
            URL.revokeObjectURL(files[i].previewUrl);
          }
        }
        
        setFiles([]);
        setUploadProgress(0);
        setIsUploading(false);
      }
      
      // Then send text message if there is any
      if (message.trim() !== '') {
        await onSendMessage(message);
        setMessage('');
        
        // Clear typing indicator
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        setIsTyping(false);
        onTypingChange(false);
      }
      
      // Focus back on textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message
      alert('Failed to send message. Please try again.');
    }
  };
  
  // Handle key press (Ctrl+Enter or Enter to submit)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    
    // Update typing indicator
    handleTypingChange();
    
    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  // Render file previews
  const renderFilePreviews = () => {
    if (files.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-2 mb-2">
        {files.map((file, index) => (
          <div 
            key={index} 
            className="relative rounded-md border bg-background p-1"
          >
            {file.type === 'image' ? (
              <div className="relative w-16 h-16">
                <img 
                  src={file.previewUrl} 
                  alt={file.file.name} 
                  className="w-full h-full object-cover rounded"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-16 h-16 p-1">
                <FileIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs truncate max-w-full mt-1">
                  {file.file.name.length > 10 
                    ? `${file.file.name.substring(0, 7)}...` 
                    : file.file.name}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground"
              onClick={() => removeFile(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    );
  };
  
  // Render emoji picker
  const renderEmojiPicker = () => {
    // Simple emoji picker for demonstration
    // In a real app, you might want to use a library like emoji-mart
    const emojis = ['😊', '👍', '❤️', '🎉', '🔥', '😂', '🙏', '👌', '🤔', '🚀'];
    
    return (
      <div className="grid grid-cols-5 gap-2 p-2">
        {emojis.map((emoji, index) => (
          <button
            key={index}
            className="text-lg p-1 hover:bg-accent rounded"
            onClick={() => handleEmojiSelect(emoji)}
            type="button"
          >
            {emoji}
          </button>
        ))}
        <button
          className="text-xs text-muted-foreground col-span-5 mt-1 hover:underline"
          onClick={() => {}}
          type="button"
        >
          More emojis...
        </button>
      </div>
    );
  };
  
  // Render reply to message banner
  const renderReplyBanner = () => {
    if (!replyToMessage) return null;
    
    return (
      <div className="flex items-center gap-2 text-sm border-l-2 border-primary pl-2 mb-2">
        <span className="text-muted-foreground">
          Replying to {replyToMessage.sender}
        </span>
        <span className="truncate flex-1">{replyToMessage.text}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={onCancelReply}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  };
  
  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      {/* File upload progress */}
      {isUploading && (
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Uploading files...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-1" />
        </div>
      )}
      
      {/* Reply banner */}
      {renderReplyBanner()}
      
      {/* File previews */}
      {renderFilePreviews()}
      
      {/* Input area */}
      <div className="flex items-end gap-1 border rounded-md bg-background p-1">
        {/* Attach file button */}
        <div className="flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isLoading || isUploading}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Attach file</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={handleFileSelect}
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          />
        </div>
        
        {/* Emoji picker */}
        <div className="flex-shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                disabled={disabled || isLoading || isUploading}
              >
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              {renderEmojiPicker()}
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Message input */}
        <div className="flex-grow">
          <TextareaAutosize
            ref={textareaRef}
            className="flex w-full rounded-md bg-transparent px-2 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[40px] max-h-[120px]"
            placeholder={placeholder}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            disabled={disabled || isLoading || isUploading}
            minRows={1}
            maxRows={5}
          />
        </div>
        
        {/* Send button */}
        <div className="flex-shrink-0">
          <Button 
            type="submit" 
            size="sm" 
            className="h-8 px-2 rounded-full"
            disabled={disabled || isLoading || isUploading || (message.trim() === '' && files.length === 0)}
          >
            {isLoading || isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

