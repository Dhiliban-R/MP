import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { Timestamp } from 'firebase/firestore';
import {
  ChatRoom,
  ChatMessage,
  ChatParticipant,
  ChatAttachment,
  ChatNotification,
  MessageStatus,
  ChatRoomType,
  ChatRoomFilter,
  ChatMessageFilter,
} from '@/lib/types/chat.types';
import {
  createChatRoom,
  getChatRoomsForUser,
  getChatRoomById,
  updateChatRoom,
  addParticipantToChatRoom,
  removeParticipantFromChatRoom,
  updateParticipantInChatRoom,
  sendMessage,
  getMessages,
  updateMessageStatus,
  deleteMessage,
  updateTypingStatus,
  markMessagesAsRead,
  getTotalUnreadCount,
  uploadChatAttachment,
  subscribeToMessages,
  subscribeToChatRoom,
  subscribeToChatRooms,
  subscribeToNotifications,
} from '@/lib/chat-service';
import { UserRole } from '@/lib/types/user.types';

// Hook options
interface UseChatOptions {
  autoLoadRooms?: boolean;
  roomsLimit?: number;
  messagesLimit?: number;
  typingTimeout?: number;
}

// Chat context return type
interface UseChatReturn {
  // States
  currentRoom: ChatRoom | null;
  rooms: ChatRoom[];
  messages: ChatMessage[];
  notifications: ChatNotification[];
  unreadCount: number;
  typingUsers: ChatParticipant[];
  loading: {
    rooms: boolean;
    messages: boolean;
    sendingMessage: boolean;
    uploadingFile: boolean;
  };
  error: {
    rooms: Error | null;
    messages: Error | null;
    sendMessage: Error | null;
    uploadFile: Error | null;
  };
  
  // Room methods
  setCurrentRoom: (roomId: string | null) => Promise<void>;
  createRoom: (
    type: ChatRoomType,
    participants: { userId: string; role: UserRole }[],
    name?: string,
    donationId?: string
  ) => Promise<ChatRoom>;
  leaveRoom: (roomId: string) => Promise<void>;
  
  // Message methods
  sendTextMessage: (text: string, replyTo?: string) => Promise<ChatMessage | null>;
  sendFileMessage: (
    file: File,
    caption?: string,
    replyTo?: string
  ) => Promise<ChatMessage | null>;
  deleteCurrentMessage: (messageId: string) => Promise<void>;
  loadMoreMessages: (beforeTimestamp?: Timestamp) => Promise<void>;
  
  // User interaction methods
  setTyping: (isTyping: boolean) => void;
  markAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

/**
 * Hook for managing chat functionality
 */
export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const {
    autoLoadRooms = true,
    roomsLimit = 20,
    messagesLimit = 50,
    typingTimeout = 3000, // 3 seconds typing timeout
  } = options;
  
  const authContext = useAuth();
  const user = authContext?.user;
  
  // States
  const [currentRoom, setCurrentRoomState] = useState<ChatRoom | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notifications, setNotifications] = useState<ChatNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Loading states
  const [roomsLoading, setRoomsLoading] = useState<boolean>(false);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  
  // Error states
  const [roomsError, setRoomsError] = useState<Error | null>(null);
  const [messagesError, setMessagesError] = useState<Error | null>(null);
  const [sendMessageError, setSendMessageError] = useState<Error | null>(null);
  const [uploadFileError, setUploadFileError] = useState<Error | null>(null);
  
  // Refs for subscriptions (for cleanup)
  const roomsSubscriptionRef = useRef<(() => void) | undefined>(undefined);
  const roomSubscriptionRef = useRef<(() => void) | undefined>(undefined);
  const messagesSubscriptionRef = useRef<(() => void) | undefined>(undefined);
  const notificationsSubscriptionRef = useRef<(() => void) | undefined>(undefined);
  
  // Typing state
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);
  
  /**
   * Computes users who are currently typing
   */
  const typingUsers = currentRoom 
    ? currentRoom.participants.filter(p => p.isTyping && p.userId !== user?.uid)
    : [];
  
  /**
   * Load chat rooms for the current user
   */
  const loadRooms = useCallback(async () => {
    if (!user) return;
    
    try {
      setRoomsLoading(true);
      setRoomsError(null);
      
      const filter: Omit<ChatRoomFilter, 'userId'> = {
        isActive: true,
        limit: roomsLimit,
      };
      
      const fetchedRooms = await getChatRoomsForUser(user.uid, filter);
      setRooms(fetchedRooms);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      setRoomsError(error as Error);
    } finally {
      setRoomsLoading(false);
    }
  }, [user, roomsLimit]);
  
  /**
   * Subscribe to chat rooms updates
   */
  const subscribeToRoomsUpdates = useCallback(() => {
    if (!user) return;
    
    // Unsubscribe from previous subscription if exists
    if (roomsSubscriptionRef.current) {
      roomsSubscriptionRef.current();
    }
    
    const filter: Omit<ChatRoomFilter, 'userId'> = {
      isActive: true,
      limit: roomsLimit,
    };
    
    // Set up new subscription
    roomsSubscriptionRef.current = subscribeToChatRooms(
      user.uid,
      (updatedRooms) => {
        setRooms(updatedRooms);
      },
      filter
    );
    
    // Subscribe to notifications
    if (notificationsSubscriptionRef.current) {
      notificationsSubscriptionRef.current();
    }
    
    notificationsSubscriptionRef.current = subscribeToNotifications(
      user.uid,
      (updatedNotifications) => {
        setNotifications(updatedNotifications);
        
        // Update unread count based on notifications
        const count = updatedNotifications.length;
        setUnreadCount(count);
      }
    );
    
    return () => {
      if (roomsSubscriptionRef.current) {
        roomsSubscriptionRef.current();
      }
      if (notificationsSubscriptionRef.current) {
        notificationsSubscriptionRef.current();
      }
    };
  }, [user, roomsLimit]);
  
  /**
   * Set the current chat room
   */
  const setCurrentRoom = useCallback(async (roomId: string | null) => {
    try {
      // Clear current room if roomId is null
      if (!roomId) {
        setCurrentRoomState(null);
        setMessages([]);
        
        // Unsubscribe from room and messages
        if (roomSubscriptionRef.current) {
          roomSubscriptionRef.current();
          roomSubscriptionRef.current = undefined;
        }
        if (messagesSubscriptionRef.current) {
          messagesSubscriptionRef.current();
          messagesSubscriptionRef.current = undefined;
        }
        
        return;
      }
      
      setMessagesLoading(true);
      setMessagesError(null);
      
      // Get room data
      const room = await getChatRoomById(roomId);
      
      if (!room) {
        throw new Error(`Chat room with ID ${roomId} not found`);
      }
      
      setCurrentRoomState(room);
      
      // Subscribe to room updates
      if (roomSubscriptionRef.current) {
        roomSubscriptionRef.current();
      }
      
      roomSubscriptionRef.current = subscribeToChatRoom(roomId, (updatedRoom) => {
        if (updatedRoom) {
          setCurrentRoomState(updatedRoom);
        } else {
          // Room was deleted or became inactive
          setCurrentRoomState(null);
        }
      });
      
      // Subscribe to messages
      if (messagesSubscriptionRef.current) {
        messagesSubscriptionRef.current();
      }
      
      messagesSubscriptionRef.current = subscribeToMessages(
        roomId,
        (updatedMessages) => {
          setMessages(updatedMessages);
          setMessagesLoading(false);
        },
        messagesLimit
      );
      
      // Mark messages as read when entering room
      if (user) {
        await markMessagesAsRead(roomId, user.uid);
      }
      
    } catch (error) {
      console.error('Error setting current room:', error);
      setMessagesError(error as Error);
      setMessagesLoading(false);
    }
  }, [user, messagesLimit]);
  
  /**
   * Create a new chat room
   */
  const createRoom = useCallback(async (
    type: ChatRoomType,
    participants: { userId: string; role: UserRole }[],
    name?: string,
    donationId?: string
  ): Promise<ChatRoom> => {
    if (!user) {
      throw new Error('User must be authenticated to create a chat room');
    }
    
    // Make sure the current user is included in participants
    const currentUserIncluded = participants.some(p => p.userId === user.uid);
    
    if (!currentUserIncluded) {
      participants.push({
        userId: user.uid,
        role: user.role as UserRole,
      });
    }
    
    try {
      setRoomsLoading(true);
      
      const roomData = {
        type,
        name,
        donationId,
        participantIds: participants,
      };
      
      const room = await createChatRoom(roomData);
      
      // After creation, set as current room
      await setCurrentRoom(room.id);
      
      return room;
    } catch (error) {
      console.error('Error creating chat room:', error);
      setRoomsError(error as Error);
      throw error;
    } finally {
      setRoomsLoading(false);
    }
  }, [user, setCurrentRoom]);
  
  /**
   * Leave a chat room
   */
  const leaveRoom = useCallback(async (roomId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to leave a chat room');
    }
    
    try {
      setRoomsLoading(true);
      
      await removeParticipantFromChatRoom(roomId, user.uid);
      
      // If leaving the current room, clear it
      if (currentRoom && currentRoom.id === roomId) {
        await setCurrentRoom(null);
      }
      
    } catch (error) {
      console.error('Error leaving chat room:', error);
      setRoomsError(error as Error);
      throw error;
    } finally {
      setRoomsLoading(false);
    }
  }, [user, currentRoom, setCurrentRoom]);
  
  /**
   * Send a text message
   */
  const sendTextMessage = useCallback(async (
    text: string,
    replyTo?: string
  ): Promise<ChatMessage | null> => {
    if (!user || !currentRoom) {
      return null;
    }
    
    try {
      setSendingMessage(true);
      setSendMessageError(null);
      
      // Clear typing indicator when sending message
      if (isTypingRef.current) {
        await updateTypingStatus(currentRoom.id, user.uid, false);
        isTypingRef.current = false;
      }
      
      const message = await sendMessage(
        currentRoom.id,
        user.uid,
        text,
        undefined,
        replyTo
      );
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      setSendMessageError(error as Error);
      throw error;
    } finally {
      setSendingMessage(false);
    }
  }, [user, currentRoom]);
  
  /**
   * Send a file message
   */
  const sendFileMessage = useCallback(async (
    file: File,
    caption?: string,
    replyTo?: string
  ): Promise<ChatMessage | null> => {
    if (!user || !currentRoom) {
      return null;
    }
    
    try {
      setUploadingFile(true);
      setUploadFileError(null);
      
      // Upload file
      const attachment = await uploadChatAttachment(
        file,
        currentRoom.id,
        user.uid
      );
      
      // Send message with attachment
      const message = await sendMessage(
        currentRoom.id,
        user.uid,
        caption || file.name,
        [attachment],
        replyTo
      );
      
      return message;
    } catch (error) {
      console.error('Error sending file message:', error);
      setUploadFileError(error as Error);
      throw error;
    } finally {
      setUploadingFile(false);
    }
  }, [user, currentRoom]);
  
  /**
   * Delete a message
   */
  const deleteCurrentMessage = useCallback(async (messageId: string) => {
    if (!user) {
      throw new Error('User must be authenticated to delete a message');
    }
    
    try {
      await deleteMessage(messageId, user.uid);
    } catch (error) {
      console.error('Error deleting message:', error);
      setSendMessageError(error as Error);
      throw error;
    }
  }, [user]);
  
  /**
   * Load more messages (for pagination)
   */
  const loadMoreMessages = useCallback(async (beforeTimestamp?: Timestamp) => {
    if (!currentRoom || !user) return;
    
    try {
      setMessagesLoading(true);
      
      const filter: ChatMessageFilter = {
        roomId: currentRoom.id,
        limit: messagesLimit,
      };
      
      if (beforeTimestamp) {
        filter.beforeTimestamp = beforeTimestamp;
      }
      
      const olderMessages = await getMessages(filter);
      
      // Combine with existing messages, avoiding duplicates
      const existingIds = new Set(messages.map(msg => msg.id));
      const uniqueNewMessages = olderMessages.filter(msg => !existingIds.has(msg.id));
      
      setMessages(prevMessages => [...uniqueNewMessages, ...prevMessages]);
    } catch (error) {
      console.error('Error loading more messages:', error);
      setMessagesError(error as Error);
    } finally {
      setMessagesLoading(false);
    }
  }, [currentRoom, user, messages, messagesLimit]);
  
  /**
   * Set typing status
   */
  const setTyping = useCallback((isTyping: boolean) => {
    if (!user || !currentRoom) return;
    
    // Update local ref
    isTypingRef.current = isTyping;
    
    // Clear existing timeout if any
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    // Update typing status in Firestore
    updateTypingStatus(currentRoom.id, user.uid, isTyping).catch(error => {
      console.error('Error updating typing status:', error);
    });
    
    // Set timeout to automatically clear typing indicator
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          updateTypingStatus(currentRoom.id, user.uid, false).catch(error => {
            console.error('Error clearing typing status:', error);
          });
          isTypingRef.current = false;
        }
      }, typingTimeout);
    }
  }, [user, currentRoom, typingTimeout]);
  
  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(async () => {
    if (!user || !currentRoom) return;
    
    try {
      await markMessagesAsRead(currentRoom.id, user.uid);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user, currentRoom]);
  
  /**
   * Refresh unread count
   */
  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const count = await getTotalUnreadCount(user.uid);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error getting unread count:', error);
    }
  }, [user]);
  
  // Initial setup when user changes
  useEffect(() => {
    if (user && autoLoadRooms) {
      loadRooms();
      subscribeToRoomsUpdates();
      refreshUnreadCount();
    } else {
      // Clear state when user is not authenticated
      setRooms([]);
      setCurrentRoomState(null);
      setMessages([]);
      setNotifications([]);
      setUnreadCount(0);
    }
    
    // Cleanup function
    return () => {
      if (roomsSubscriptionRef.current) {
        roomsSubscriptionRef.current();
      }
      if (roomSubscriptionRef.current) {
        roomSubscriptionRef.current();
      }
      if (messagesSubscriptionRef.current) {
        messagesSubscriptionRef.current();
      }
      if (notificationsSubscriptionRef.current) {
        notificationsSubscriptionRef.current();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, autoLoadRooms, loadRooms, subscribeToRoomsUpdates, refreshUnreadCount]);
  
  return {
    // States
    currentRoom,
    rooms,
    messages,
    notifications,
    unreadCount,
    typingUsers,
    loading: {
      rooms: roomsLoading,
      messages: messagesLoading,
      sendingMessage,
      uploadingFile,
    },
    error: {
      rooms: roomsError,
      messages: messagesError,
      sendMessage: sendMessageError,
      uploadFile: uploadFileError,
    },
    
    // Room methods
    setCurrentRoom,
    createRoom,
    leaveRoom,
    
    // Message methods
    sendTextMessage,
    sendFileMessage,
    deleteCurrentMessage,
    loadMoreMessages,
    
    // User interaction methods
    setTyping,
    markAsRead,
    refreshUnreadCount,
  };
};

