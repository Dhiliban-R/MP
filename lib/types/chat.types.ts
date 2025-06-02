import { Timestamp } from 'firebase/firestore';
import { User } from './user.types';

/**
 * Message status enum
 */
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read'
}

/**
 * Chat room type enum
 */
export enum ChatRoomType {
  DONATION = 'donation',  // Chat related to a specific donation
  DIRECT = 'direct'       // Direct chat between users
}

/**
 * Individual chat message
 */
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderPhotoURL?: string;
  text: string;
  timestamp: Timestamp;
  status: MessageStatus;
  attachments?: ChatAttachment[];
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  replyTo?: string; // ID of the message this is replying to
}

/**
 * Chat attachment (for sending files, images, etc.)
 */
export interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'location';
  url: string;
  name: string;
  size?: number;
  thumbnailUrl?: string;
  mimeType?: string;
}

/**
 * Chat room information
 */
export interface ChatRoom {
  id: string;
  type: ChatRoomType;
  name?: string;
  participants: ChatParticipant[];
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  donationId?: string; // Reference to donation if type is DONATION
  isActive: boolean;
}

/**
 * Chat participant information
 */
export interface ChatParticipant {
  userId: string;
  displayName: string;
  role: 'donor' | 'recipient' | 'admin';
  photoURL?: string;
  isTyping: boolean;
  lastSeen?: Timestamp;
  lastRead?: Timestamp;
  unreadCount: number;
}

/**
 * Chat room with participants information expanded
 */
export interface ChatRoomWithDetails extends Omit<ChatRoom, 'participants'> {
  participants: ChatParticipantWithDetails[];
}

/**
 * Chat participant with user details
 */
export interface ChatParticipantWithDetails extends ChatParticipant {
  user?: User;
}

/**
 * Typing indicator update
 */
export interface TypingIndicatorUpdate {
  roomId: string;
  userId: string;
  isTyping: boolean;
}

/**
 * Message read status update
 */
export interface MessageReadUpdate {
  roomId: string;
  userId: string;
  timestamp: Timestamp;
}

/**
 * Chat notification
 */
export interface ChatNotification {
  id: string;
  roomId: string;
  messageId: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  isRead: boolean;
}

/**
 * Chat room filter options
 */
export interface ChatRoomFilter {
  userId?: string;
  type?: ChatRoomType;
  donationId?: string;
  limit?: number;
  isActive?: boolean;
}

/**
 * Chat messages filter options
 */
export interface ChatMessageFilter {
  roomId: string;
  limit?: number;
  beforeTimestamp?: Timestamp;
  afterTimestamp?: Timestamp;
  senderId?: string;
}

