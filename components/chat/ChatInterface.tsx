'use client';

import React, { useState, useEffect } from 'react';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { NewChatDialog } from './NewChatDialog';
import { useAuth } from '@/hooks/use-auth';
import { useChat } from '@/hooks/use-chat';
import { ChatRoomType } from '@/lib/types/chat.types';
import { toast } from 'sonner';

interface ChatInterfaceProps {
  initialRoomId?: string;
  donationId?: string; // If provided, will create/find donation chat
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialRoomId,
  donationId,
  className = ''
}) => {
  const { user } = useAuth();
  const { createRoom, rooms } = useChat();
  
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(initialRoomId || null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle donation chat creation/finding
  useEffect(() => {
    if (donationId && user && rooms.length > 0) {
      // Look for existing donation chat
      const existingChat = rooms.find(room => 
        room.type === ChatRoomType.DONATION && 
        room.donationId === donationId
      );
      
      if (existingChat) {
        setSelectedRoomId(existingChat.id);
        if (isMobile) setShowChatWindow(true);
      }
    }
  }, [donationId, user, rooms, isMobile]);

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (isMobile) {
      setShowChatWindow(true);
    }
  };

  const handleNewChat = () => {
    setShowNewChatDialog(true);
  };

  const handleCreateChat = async (
    type: ChatRoomType,
    participantIds: string[],
    name?: string,
    donationId?: string
  ) => {
    try {
      const participants = participantIds.map(id => ({
        userId: id,
        role: 'recipient' as const // Default role, will be updated based on actual user role
      }));

      const newRoom = await createRoom(type, participants, name, donationId);
      setSelectedRoomId(newRoom.id);
      setShowNewChatDialog(false);
      
      if (isMobile) {
        setShowChatWindow(true);
      }
      
      toast.success('Chat created successfully');
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Failed to create chat');
    }
  };

  const handleCloseChatWindow = () => {
    if (isMobile) {
      setShowChatWindow(false);
    }
  };

  const handleBackToList = () => {
    if (isMobile) {
      setShowChatWindow(false);
      setSelectedRoomId(null);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to access chat</p>
      </div>
    );
  }

  // Mobile view - show either list or chat window
  if (isMobile) {
    return (
      <div className={`h-full ${className}`}>
        {!showChatWindow ? (
          <ChatList
            selectedRoomId={selectedRoomId}
            onRoomSelect={handleRoomSelect}
            onNewChat={handleNewChat}
            className="h-full"
          />
        ) : (
          <ChatWindow
            roomId={selectedRoomId}
            onClose={handleBackToList}
            className="h-full"
          />
        )}
        
        <NewChatDialog
          open={showNewChatDialog}
          onOpenChange={setShowNewChatDialog}
          onCreateChat={handleCreateChat}
        />
      </div>
    );
  }

  // Desktop view - show both list and chat window
  return (
    <div className={`h-full flex ${className}`}>
      {/* Chat List */}
      <div className="w-1/3 min-w-[300px] border-r">
        <ChatList
          selectedRoomId={selectedRoomId}
          onRoomSelect={handleRoomSelect}
          onNewChat={handleNewChat}
          className="h-full"
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1">
        <ChatWindow
          roomId={selectedRoomId}
          className="h-full"
        />
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={showNewChatDialog}
        onOpenChange={setShowNewChatDialog}
        onCreateChat={handleCreateChat}
      />
    </div>
  );
};
