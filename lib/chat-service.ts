import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  startAfter,
  endBefore,
  runTransaction,
  arrayUnion,
  arrayRemove,
  DocumentReference,
  QueryDocumentSnapshot,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { db, storage } from './firebase';
import {
  ChatRoom,
  ChatMessage,
  ChatParticipant,
  MessageStatus,
  ChatRoomType,
  ChatAttachment,
  ChatRoomFilter,
  ChatMessageFilter,
  TypingIndicatorUpdate,
  MessageReadUpdate,
  ChatNotification,
} from './types/chat.types';
import { User, UserRole } from './types/user.types';

// Collection paths
const CHAT_ROOMS_COLLECTION = 'chatRooms';
const CHAT_MESSAGES_COLLECTION = 'chatMessages';
const CHAT_NOTIFICATIONS_COLLECTION = 'chatNotifications';
const TYPING_INDICATORS_COLLECTION = 'typingIndicators';

// Error messages
const ERRORS = {
  ROOM_NOT_FOUND: 'Chat room not found',
  USER_NOT_FOUND: 'User not found',
  MESSAGE_NOT_FOUND: 'Message not found',
  UNAUTHORIZED: 'User is not authorized to perform this action',
  INVALID_PARTICIPANT: 'Invalid participant data',
  INVALID_MESSAGE: 'Invalid message data',
  SERVER_ERROR: 'Server error occurred',
};

/**
 * Creates a new chat room between participants
 */
export const createChatRoom = async (
  roomData: Omit<ChatRoom, 'id' | 'createdAt' | 'updatedAt' | 'isActive' | 'participants'> & {
    participantIds: { userId: string; role: UserRole }[];
  }
): Promise<ChatRoom> => {
  try {
    // Get participant data
    const participantsPromises = roomData.participantIds.map(async ({ userId, role }) => {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error(`${ERRORS.USER_NOT_FOUND}: ${userId}`);
      }

      const userData = userDoc.data();

      const participant: ChatParticipant = {
        userId,
        displayName: userData.displayName || 'Unknown User',
        role: role,
        photoURL: userData.photoURL,
        isTyping: false,
        unreadCount: 0,
      };

      return participant;
    });

    const participants = await Promise.all(participantsPromises);

    // Create room with timestamp
    const timestamp = Timestamp.now();
    const roomRef = doc(collection(db, CHAT_ROOMS_COLLECTION));

    const room: ChatRoom = {
      id: roomRef.id,
      type: roomData.type,
      name: roomData.name,
      participants,
      createdAt: timestamp,
      updatedAt: timestamp,
      isActive: true,
    };

    // Add donation ID if provided
    if (roomData.donationId) {
      room.donationId = roomData.donationId;
    }

    // Save to Firestore
    await setDoc(roomRef, room);

    return room;
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw error;
  }
};

/**
 * Creates or finds a donation chat room
 */
export const createDonationChatRoom = async (
  donationId: string,
  donorId: string,
  recipientId: string,
  donationTitle: string
): Promise<ChatRoom> => {
  try {
    // First check if a chat already exists for this donation
    const existingChatQuery = query(
      collection(db, CHAT_ROOMS_COLLECTION),
      where('type', '==', ChatRoomType.DONATION),
      where('donationId', '==', donationId),
      where('isActive', '==', true)
    );

    const existingChatSnapshot = await getDocs(existingChatQuery);

    if (!existingChatSnapshot.empty) {
      // Return existing chat
      const existingChatDoc = existingChatSnapshot.docs[0];
      return existingChatDoc.data() as ChatRoom;
    }

    // Create new donation chat
    const room = await createChatRoom({
      type: ChatRoomType.DONATION,
      name: `Chat: ${donationTitle}`,
      donationId,
      participantIds: [
        { userId: donorId, role: 'donor' },
        { userId: recipientId, role: 'recipient' }
      ]
    });

    // Send welcome message
    await sendMessage(
      room.id,
      'system',
      `Chat started for donation: ${donationTitle}. You can now communicate about pickup details.`
    );

    return room;
  } catch (error) {
    console.error('Error creating donation chat room:', error);
    throw error;
  }
};

/**
 * Finds existing chat room for a donation
 */
export const findDonationChatRoom = async (donationId: string): Promise<ChatRoom | null> => {
  try {
    const chatQuery = query(
      collection(db, CHAT_ROOMS_COLLECTION),
      where('type', '==', ChatRoomType.DONATION),
      where('donationId', '==', donationId),
      where('isActive', '==', true)
    );

    const chatSnapshot = await getDocs(chatQuery);

    if (chatSnapshot.empty) {
      return null;
    }

    return chatSnapshot.docs[0].data() as ChatRoom;
  } catch (error) {
    console.error('Error finding donation chat room:', error);
    throw error;
  }
};

/**
 * Gets all chat rooms for a user
 */
export const getChatRoomsForUser = async (
  userId: string, 
  filter?: Omit<ChatRoomFilter, 'userId'>
): Promise<ChatRoom[]> => {
  try {
    // Build query constraints
    let chatRoomsQuery = query(
      collection(db, CHAT_ROOMS_COLLECTION),
      where('participants', 'array-contains', { userId })
    );

    if (filter?.type) {
      chatRoomsQuery = query(chatRoomsQuery, where('type', '==', filter.type));
    }

    if (filter?.donationId) {
      chatRoomsQuery = query(chatRoomsQuery, where('donationId', '==', filter.donationId));
    }

    if (filter?.isActive !== undefined) {
      chatRoomsQuery = query(chatRoomsQuery, where('isActive', '==', filter.isActive));
    }

    // Always order by most recent activity
    chatRoomsQuery = query(chatRoomsQuery, orderBy('updatedAt', 'desc'));

    if (filter?.limit) {
      chatRoomsQuery = query(chatRoomsQuery, limit(filter.limit));
    }

    // Execute query
    const snapshot = await getDocs(chatRoomsQuery);
    
    // Map results to ChatRoom objects
    return snapshot.docs.map(doc => doc.data() as ChatRoom);
  } catch (error) {
    console.error('Error getting chat rooms for user:', error);
    throw error;
  }
};

/**
 * Gets a chat room by ID
 */
export const getChatRoomById = async (roomId: string): Promise<ChatRoom | null> => {
  try {
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      return null;
    }
    
    return roomDoc.data() as ChatRoom;
  } catch (error) {
    console.error('Error getting chat room by ID:', error);
    throw error;
  }
};

/**
 * Updates a chat room
 */
export const updateChatRoom = async (
  roomId: string,
  updates: Partial<Omit<ChatRoom, 'id' | 'createdAt' | 'participants'>>
): Promise<void> => {
  try {
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error(ERRORS.ROOM_NOT_FOUND);
    }
    
    // Add updated timestamp
    const updatedData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    
    await updateDoc(roomRef, updatedData);
  } catch (error) {
    console.error('Error updating chat room:', error);
    throw error;
  }
};

/**
 * Adds a participant to a chat room
 */
export const addParticipantToChatRoom = async (
  roomId: string,
  userId: string,
  role: UserRole
): Promise<void> => {
  try {
    // Get user data
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error(ERRORS.USER_NOT_FOUND);
    }
    
    const userData = userDoc.data();
    
    // Create participant object
    const participant: ChatParticipant = {
      userId,
      displayName: userData.displayName || 'Unknown User',
      role,
      photoURL: userData.photoURL,
      isTyping: false,
      unreadCount: 0,
    };
    
    // Update room using transaction to prevent race conditions
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
    
    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error(ERRORS.ROOM_NOT_FOUND);
      }
      
      const room = roomDoc.data() as ChatRoom;
      
      // Check if user is already a participant
      if (room.participants.some(p => p.userId === userId)) {
        // User is already a participant, no action needed
        return;
      }
      
      // Add participant and update timestamp
      const updatedParticipants = [...room.participants, participant];
      
      transaction.update(roomRef, {
        participants: updatedParticipants,
        updatedAt: Timestamp.now(),
      });
    });
  } catch (error) {
    console.error('Error adding participant to chat room:', error);
    throw error;
  }
};

/**
 * Removes a participant from a chat room
 */
export const removeParticipantFromChatRoom = async (
  roomId: string,
  userId: string
): Promise<void> => {
  try {
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
    
    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error(ERRORS.ROOM_NOT_FOUND);
      }
      
      const room = roomDoc.data() as ChatRoom;
      
      // Filter out the participant
      const updatedParticipants = room.participants.filter(
        participant => participant.userId !== userId
      );
      
      // If there's no participants left, mark room as inactive
      if (updatedParticipants.length === 0) {
        transaction.update(roomRef, {
          participants: updatedParticipants,
          isActive: false,
          updatedAt: Timestamp.now(),
        });
      } else {
        transaction.update(roomRef, {
          participants: updatedParticipants,
          updatedAt: Timestamp.now(),
        });
      }
    });
  } catch (error) {
    console.error('Error removing participant from chat room:', error);
    throw error;
  }
};

/**
 * Updates a participant in a chat room
 */
export const updateParticipantInChatRoom = async (
  roomId: string,
  userId: string,
  updates: Partial<Omit<ChatParticipant, 'userId'>>
): Promise<void> => {
  try {
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
    
    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error(ERRORS.ROOM_NOT_FOUND);
      }
      
      const room = roomDoc.data() as ChatRoom;
      const participantIndex = room.participants.findIndex(p => p.userId === userId);
      
      if (participantIndex === -1) {
        throw new Error(ERRORS.INVALID_PARTICIPANT);
      }
      
      // Create updated participant
      const updatedParticipant = {
        ...room.participants[participantIndex],
        ...updates,
      };
      
      // Replace participant in the array
      const updatedParticipants = [...room.participants];
      updatedParticipants[participantIndex] = updatedParticipant;
      
      transaction.update(roomRef, {
        participants: updatedParticipants,
        updatedAt: Timestamp.now(),
      });
    });
  } catch (error) {
    console.error('Error updating participant in chat room:', error);
    throw error;
  }
};

/**
 * Sends a message to a chat room
 */
export const sendMessage = async (
  roomId: string,
  senderId: string,
  text: string,
  attachments?: ChatAttachment[],
  replyTo?: string
): Promise<ChatMessage> => {
  try {
    // First verify the room exists and user is a participant
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
    const roomDoc = await getDoc(roomRef);
    
    if (!roomDoc.exists()) {
      throw new Error(ERRORS.ROOM_NOT_FOUND);
    }
    
    const room = roomDoc.data() as ChatRoom;
    const sender = room.participants.find(p => p.userId === senderId);
    
    if (!sender) {
      throw new Error(ERRORS.UNAUTHORIZED);
    }
    
    // Create message
    const timestamp = Timestamp.now();
    const messageRef = doc(collection(db, CHAT_MESSAGES_COLLECTION));
    
    const message: ChatMessage = {
      id: messageRef.id,
      roomId,
      senderId,
      senderName: sender.displayName,
      senderPhotoURL: sender.photoURL,
      text,
      timestamp,
      status: MessageStatus.SENT,
    };
    
    if (attachments && attachments.length > 0) {
      message.attachments = attachments;
    }
    
    if (replyTo) {
      message.replyTo = replyTo;
    }
    
    // Use a batch to update both the message and the room
    const batch = writeBatch(db);
    
    // Add the message
    batch.set(messageRef, message);
    
    // Update the room's last message and timestamp
    batch.update(roomRef, {
      lastMessage: {
        text: text.length > 100 ? `${text.substring(0, 97)}...` : text,
        senderId,
        timestamp,
      },
      updatedAt: timestamp,
    });
    
    // Update unread count for all participants except sender
    const otherParticipants = room.participants.filter(p => p.userId !== senderId);
    
    if (otherParticipants.length > 0) {
      const updatedParticipants = [...room.participants];
      
      otherParticipants.forEach(participant => {
        const index = updatedParticipants.findIndex(p => p.userId === participant.userId);
        if (index !== -1) {
          updatedParticipants[index] = {
            ...updatedParticipants[index],
            unreadCount: (updatedParticipants[index].unreadCount || 0) + 1,
          };
        }
      });
      
      batch.update(roomRef, { participants: updatedParticipants });
      
      // Create notifications for other participants
      for (const participant of otherParticipants) {
        const notificationRef = doc(collection(db, CHAT_NOTIFICATIONS_COLLECTION));
        const notification: ChatNotification = {
          id: notificationRef.id,
          roomId,
          messageId: messageRef.id,
          recipientId: participant.userId,
          senderId,
          senderName: sender.displayName,
          text: text.length > 100 ? `${text.substring(0, 97)}...` : text,
          timestamp,
          isRead: false,
        };
        
        batch.set(notificationRef, notification);
      }
    }
    
    // Commit all changes
    await batch.commit();
    
    return message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Gets messages for a chat room
 */
export const getMessages = async (filter: ChatMessageFilter): Promise<ChatMessage[]> => {
  try {
    const { roomId, limit: msgLimit = 50, beforeTimestamp, afterTimestamp, senderId } = filter;

    // Build query step by step
    let messagesQuery = query(
      collection(db, CHAT_MESSAGES_COLLECTION),
      where('roomId', '==', roomId)
    );

    if (senderId) {
      messagesQuery = query(messagesQuery, where('senderId', '==', senderId));
    }

    // Add ordering
    messagesQuery = query(messagesQuery, orderBy('timestamp', 'desc'));

    if (beforeTimestamp) {
      messagesQuery = query(messagesQuery, endBefore(beforeTimestamp));
    }

    if (afterTimestamp) {
      messagesQuery = query(messagesQuery, startAfter(afterTimestamp));
    }

    // Add limit
    messagesQuery = query(messagesQuery, limit(msgLimit));

    // Execute query
    const snapshot = await getDocs(messagesQuery);
    
    // Map results to ChatMessage objects and reverse to get chronological order
    return snapshot.docs.map(doc => doc.data() as ChatMessage).reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

/**
 * Updates a message's status
 */
export const updateMessageStatus = async (
  messageId: string,
  status: MessageStatus
): Promise<void> => {
  try {
    const messageRef = doc(db, CHAT_MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error(ERRORS.MESSAGE_NOT_FOUND);
    }
    
    await updateDoc(messageRef, { status });
  } catch (error) {
    console.error('Error updating message status:', error);
    throw error;
  }
};

/**
 * Deletes a message (soft delete)
 */
export const deleteMessage = async (messageId: string, userId: string): Promise<void> => {
  try {
    const messageRef = doc(db, CHAT_MESSAGES_COLLECTION, messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error(ERRORS.MESSAGE_NOT_FOUND);
    }
    
    const message = messageDoc.data() as ChatMessage;
    
    // Check if user is allowed to delete (only sender can delete)
    if (message.senderId !== userId) {
      throw new Error(ERRORS.UNAUTHORIZED);
    }
    
    // Soft delete
    await updateDoc(messageRef, {
      isDeleted: true,
      deletedAt: Timestamp.now(),
      text: 'This message has been deleted',
      attachments: [],
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Updates the typing status for a user in a chat room
 */
export const updateTypingStatus = async (
  roomId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  try {
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
    
    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error(ERRORS.ROOM_NOT_FOUND);
      }
      
      const room = roomDoc.data() as ChatRoom;
      const participantIndex = room.participants.findIndex(p => p.userId === userId);
      
      if (participantIndex === -1) {
        throw new Error(ERRORS.INVALID_PARTICIPANT);
      }
      
      // Update typing status
      const updatedParticipants = [...room.participants];
      updatedParticipants[participantIndex] = {
        ...updatedParticipants[participantIndex],
        isTyping,
      };
      
      transaction.update(roomRef, {
        participants: updatedParticipants,
      });
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
    throw error;
  }
};

/**
 * Marks messages as read for a user
 */
export const markMessagesAsRead = async (
  roomId: string,
  userId: string
): Promise<void> => {
  try {
    const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
    const timestamp = Timestamp.now();
    
    await runTransaction(db, async (transaction) => {
      const roomDoc = await transaction.get(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error(ERRORS.ROOM_NOT_FOUND);
      }
      
      const room = roomDoc.data() as ChatRoom;
      const participantIndex = room.participants.findIndex(p => p.userId === userId);
      
      if (participantIndex === -1) {
        throw new Error(ERRORS.INVALID_PARTICIPANT);
      }
      
      // Update participant with read timestamp and reset unread count
      const updatedParticipants = [...room.participants];
      updatedParticipants[participantIndex] = {
        ...updatedParticipants[participantIndex],
        lastRead: timestamp,
        unreadCount: 0,
      };
      
      transaction.update(roomRef, {
        participants: updatedParticipants,
      });
    });
    
    // Also mark notifications as read
    const notificationsQuery = query(
      collection(db, CHAT_NOTIFICATIONS_COLLECTION),
      where('roomId', '==', roomId),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    const batch = writeBatch(db);
    notificationsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });
    
    if (notificationsSnapshot.docs.length > 0) {
      await batch.commit();
    }
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Gets unread count for a user across all chat rooms
 */
export const getTotalUnreadCount = async (userId: string): Promise<number> => {
  try {
    const roomsQuery = query(
      collection(db, CHAT_ROOMS_COLLECTION),
      where('participants', 'array-contains', { userId }),
      where('isActive', '==', true)
    );
    
    const roomsSnapshot = await getDocs(roomsQuery);
    
    let totalUnreadCount = 0;
    
    roomsSnapshot.docs.forEach(doc => {
      const room = doc.data() as ChatRoom;
      const participant = room.participants.find(p => p.userId === userId);
      
      if (participant) {
        totalUnreadCount += participant.unreadCount || 0;
      }
    });
    
    return totalUnreadCount;
  } catch (error) {
    console.error('Error getting total unread count:', error);
    throw error;
  }
};

/**
 * Uploads a file attachment for a chat message
 */
export const uploadChatAttachment = async (
  file: File,
  roomId: string,
  senderId: string
): Promise<ChatAttachment> => {
  try {
    // Generate unique file name
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${fileId}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `chat_attachments/${roomId}/${senderId}/${fileName}`);
    
    // Upload file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Determine attachment type
    let type: 'image' | 'file' | 'location' = 'file';
    if (file.type.startsWith('image/')) {
      type = 'image';
    }
    
    // Create and return attachment object
    const attachment: ChatAttachment = {
      id: fileId,
      type,
      url: downloadURL,
      name: file.name,
      size: file.size,
      mimeType: file.type,
    };
    
    // If it's an image, create thumbnail
    if (type === 'image') {
      // In a real implementation, you might want to generate a thumbnail
      // For now, we'll just use the same URL
      attachment.thumbnailUrl = downloadURL;
    }
    
    return attachment;
  } catch (error) {
    console.error('Error uploading chat attachment:', error);
    throw error;
  }
};

/**
 * Subscribes to messages in a chat room
 */
export const subscribeToMessages = (
  roomId: string,
  callback: (messages: ChatMessage[]) => void,
  lastN: number = 50
) => {
  const messagesQuery = query(
    collection(db, CHAT_MESSAGES_COLLECTION),
    where('roomId', '==', roomId),
    orderBy('timestamp', 'desc'),
    limit(lastN)
  );
  
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs
      .map(doc => doc.data() as ChatMessage)
      .sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());
    
    callback(messages);
  }, (error) => {
    console.error('Error in messages subscription:', error);
  });
};

/**
 * Subscribes to a specific chat room
 */
export const subscribeToChatRoom = (
  roomId: string,
  callback: (room: ChatRoom | null) => void
) => {
  const roomRef = doc(db, CHAT_ROOMS_COLLECTION, roomId);
  
  return onSnapshot(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    
    callback(snapshot.data() as ChatRoom);
  }, (error) => {
    console.error('Error in chat room subscription:', error);
  });
};

/**
 * Subscribes to all chat rooms for a user
 */
export const subscribeToChatRooms = (
  userId: string,
  callback: (rooms: ChatRoom[]) => void,
  filter?: Omit<ChatRoomFilter, 'userId'>
) => {
  // Build query step by step
  let roomsQuery = query(
    collection(db, CHAT_ROOMS_COLLECTION),
    where('participants', 'array-contains', { userId })
  );

  if (filter?.type) {
    roomsQuery = query(roomsQuery, where('type', '==', filter.type));
  }

  if (filter?.donationId) {
    roomsQuery = query(roomsQuery, where('donationId', '==', filter.donationId));
  }

  if (filter?.isActive !== undefined) {
    roomsQuery = query(roomsQuery, where('isActive', '==', filter.isActive));
  }

  // Always order by most recent activity
  roomsQuery = query(roomsQuery, orderBy('updatedAt', 'desc'));

  if (filter?.limit) {
    roomsQuery = query(roomsQuery, limit(filter.limit));
  }
  
  return onSnapshot(roomsQuery, (snapshot) => {
    const rooms = snapshot.docs.map(doc => doc.data() as ChatRoom);
    callback(rooms);
  }, (error) => {
    console.error('Error in chat rooms subscription:', error);
  });
};

/**
 * Subscribes to chat notifications for a user
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: ChatNotification[]) => void
) => {
  const notificationsQuery = query(
    collection(db, CHAT_NOTIFICATIONS_COLLECTION),
    where('recipientId', '==', userId),
    where('isRead', '==', false),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications = snapshot.docs.map(doc => doc.data() as ChatNotification);
    callback(notifications);
  }, (error) => {
    console.error('Error in notifications subscription:', error);
  });
};

