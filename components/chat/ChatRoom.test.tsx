import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ChatRoom } from './ChatRoom';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { ChatRoomType, ChatMessage, MessageStatus } from '@/lib/types/chat.types';
import { Timestamp } from 'firebase/firestore';

// Mock the hooks
vi.mock('@/hooks/use-chat');
vi.mock('@/hooks/use-auth');

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  MessageSquare: () => <div data-testid="icon-message-square" />,
  User: () => <div data-testid="icon-user" />,
  Users: () => <div data-testid="icon-users" />,
  Package: () => <div data-testid="icon-package" />,
  MoreVertical: () => <div data-testid="icon-more-vertical" />,
  Loader2: () => <div data-testid="icon-loader" />,
  Bell: () => <div data-testid="icon-bell" />,
  BellOff: () => <div data-testid="icon-bell-off" />,
  Trash: () => <div data-testid="icon-trash" />,
  LogOut: () => <div data-testid="icon-logout" />,
  AlertCircle: () => <div data-testid="icon-alert-circle" />,
  ChevronLeft: () => <div data-testid="icon-chevron-left" />,
  Info: () => <div data-testid="icon-info" />,
  Clock: () => <div data-testid="icon-clock" />,
  CircleCheck: () => <div data-testid="icon-circle-check" />,
  Circle: () => <div data-testid="icon-circle" />
}));

// Mock the scroll into view method
Element.prototype.scrollIntoView = vi.fn();

// Mock data
const mockUser = {
  uid: 'user1',
  displayName: 'Test User',
  email: 'test@example.com',
  photoURL: '/avatar.jpg'
};

const mockCurrentRoom = {
  id: 'room1',
  name: 'Test Room',
  type: ChatRoomType.GROUP,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  participants: [
    {
      userId: 'user1',
      displayName: 'Test User',
      photoURL: '/avatar.jpg',
      role: 'member',
      joinedAt: Timestamp.now(),
      lastSeen: Timestamp.now()
    },
    {
      userId: 'user2',
      displayName: 'Other User',
      photoURL: '/other-avatar.jpg',
      role: 'member',
      joinedAt: Timestamp.now(),
      lastSeen: Timestamp.now()
    }
  ]
};

const mockDirectRoom = {
  id: 'directRoom1',
  type: ChatRoomType.DIRECT,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  participants: [
    {
      userId: 'user1',
      displayName: 'Test User',
      photoURL: '/avatar.jpg',
      role: 'member',
      joinedAt: Timestamp.now(),
      lastSeen: Timestamp.now()
    },
    {
      userId: 'user2',
      displayName: 'Other User',
      photoURL: '/other-avatar.jpg',
      role: 'member',
      joinedAt: Timestamp.now(),
      lastSeen: Timestamp.now()
    }
  ]
};

const mockDonationRoom = {
  id: 'donationRoom1',
  name: 'Donation #123',
  type: ChatRoomType.DONATION,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  participants: [
    {
      userId: 'user1',
      displayName: 'Test User',
      photoURL: '/avatar.jpg',
      role: 'member',
      joinedAt: Timestamp.now(),
      lastSeen: Timestamp.now()
    },
    {
      userId: 'user2',
      displayName: 'Other User',
      photoURL: '/other-avatar.jpg',
      role: 'member',
      joinedAt: Timestamp.now(),
      lastSeen: Timestamp.now()
    }
  ]
};

const mockMessages: ChatMessage[] = [
  {
    id: 'msg1',
    roomId: 'room1',
    senderId: 'user2',
    senderName: 'Other User',
    senderPhotoURL: '/other-avatar.jpg',
    text: 'Hello there!',
    timestamp: Timestamp.now(),
    status: MessageStatus.DELIVERED,
    readBy: []
  },
  {
    id: 'msg2',
    roomId: 'room1',
    senderId: 'user1',
    senderName: 'Test User',
    senderPhotoURL: '/avatar.jpg',
    text: 'Hi! How are you?',
    timestamp: Timestamp.now(),
    status: MessageStatus.DELIVERED,
    readBy: ['user2']
  }
];

describe('ChatRoom Component', () => {
  // Set up mock functions
  const mockSetCurrentRoom = vi.fn();
  const mockLeaveRoom = vi.fn();
  const mockSendTextMessage = vi.fn();
  const mockSendFileMessage = vi.fn();
  const mockMarkAsRead = vi.fn();
  const mockSetTyping = vi.fn();
  const mockLoadMoreMessages = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock useAuth hook
    (useAuth as any).mockReturnValue({
      user: mockUser
    });
    
    // Set up default mock implementation for useChat hook
    (useChat as any).mockReturnValue({
      currentRoom: mockCurrentRoom,
      messages: mockMessages,
      typingUsers: [],
      loading: {
        rooms: false,
        messages: false,
        sendingMessage: false,
        uploadingFile: false
      },
      error: {
        rooms: null,
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom,
      leaveRoom: mockLeaveRoom,
      sendTextMessage: mockSendTextMessage,
      sendFileMessage: mockSendFileMessage,
      markAsRead: mockMarkAsRead,
      setTyping: mockSetTyping,
      loadMoreMessages: mockLoadMoreMessages
    });

    // Mock window.innerWidth for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('sets current room when mounted and cleans up on unmount', () => {
    const { unmount } = render(<ChatRoom roomId="room1" />);
    
    expect(mockSetCurrentRoom).toHaveBeenCalledWith('room1');
    
    unmount();
    
    expect(mockSetCurrentRoom).toHaveBeenCalledWith(null);
  });

  it('shows loading state when loading rooms', () => {
    (useChat as any).mockReturnValue({
      currentRoom: null,
      messages: [],
      typingUsers: [],
      loading: {
        rooms: true,
        messages: false,
        sendingMessage: false,
        uploadingFile: false
      },
      error: {
        rooms: null,
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom
    });
    
    render(<ChatRoom roomId="room1" />);
    
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
  });

  it('shows error state when there is an error loading rooms', () => {
    (useChat as any).mockReturnValue({
      currentRoom: null,
      messages: [],
      typingUsers: [],
      loading: {
        rooms: false,
        messages: false,
        sendingMessage: false,
        uploadingFile: false
      },
      error: {
        rooms: new Error('Failed to load room'),
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom
    });
    
    render(<ChatRoom roomId="room1" />);
    
    expect(screen.getByText('There was an error loading this chat.')).toBeInTheDocument();
  });

  it('shows empty state when no room is selected', () => {
    (useChat as any).mockReturnValue({
      currentRoom: null,
      messages: [],
      typingUsers: [],
      loading: {
        rooms: false,
        messages: false,
        sendingMessage: false,
        uploadingFile: false
      },
      error: {
        rooms: null,
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom
    });
    
    render(<ChatRoom roomId="" />);
    
    expect(screen.getByText('No chat selected')).toBeInTheDocument();
  });

  it('renders a group chat room correctly', () => {
    render(<ChatRoom roomId="room1" />);
    
    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.getByText(/2 members/)).toBeInTheDocument();
  });

  it('renders a direct chat room correctly', () => {
    (useChat as any).mockReturnValue({
      currentRoom: mockDirectRoom,
      messages: mockMessages,
      typingUsers: [],
      loading: {
        rooms: false,
        messages: false,
        sendingMessage: false,
        uploadingFile: false
      },
      error: {
        rooms: null,
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom,
      markAsRead: mockMarkAsRead
    });
    
    render(<ChatRoom roomId="directRoom1" />);
    
    expect(screen.getByText('Other User')).toBeInTheDocument();
  });

  it('renders a donation chat room correctly', () => {
    (useChat as any).mockReturnValue({
      currentRoom: mockDonationRoom,
      messages: mockMessages,
      typingUsers: [],
      loading: {
        rooms: false,
        messages: false,
        sendingMessage: false,
        uploadingFile: false
      },
      error: {
        rooms: null,
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom,
      markAsRead: mockMarkAsRead
    });
    
    render(<ChatRoom roomId="donationRoom1" />);
    
    expect(screen.getByText('Donation #123')).toBeInTheDocument();
    expect(screen.getByText('Donation Chat')).toBeInTheDocument();
  });

  it('shows back button on mobile view', () => {
    // Set window width to mobile size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 767
    });
    
    // Trigger resize event
    fireEvent(window, new Event('resize'));
    
    render(<ChatRoom roomId="room1" onBack={mockOnBack} />);
    
    const backButton = screen.getAllByTestId('icon-chevron-left')[0];
    expect(backButton).toBeInTheDocument();
    
    // Find the button element that contains the back icon
    const buttonWithBackIcon = backButton.closest('button');
    fireEvent.click(buttonWithBackIcon!);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('marks messages as read when the component mounts', () => {
    render(<ChatRoom roomId="room1" />);
    
    expect(mockMarkAsRead).toHaveBeenCalled();
  });

  it('handles sending a text message', async () => {
    render(<ChatRoom roomId="room1" />);
    
    // Find the textarea
    const textarea = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textarea, { target: { value: 'New message' } });
    
    // Find and click the send button
    const sendButton = screen.getByText('Send');
    fireEvent.click(sendButton);
    
    expect(mockSendTextMessage).toHaveBeenCalledWith('New message');
  });

  it('shows typing indicator when someone is typing', () => {
    (useChat as any).mockReturnValue({
      currentRoom: mockCurrentRoom,
      messages: mockMessages,
      typingUsers: [{ userId: 'user2', displayName: 'Other User' }],
      loading: {
        rooms: false,
        messages: false,
        sendingMessage: false,
        uploadingFile: false
      },
      error: {
        rooms: null,
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom,
      markAsRead: mockMarkAsRead,
      setTyping: mockSetTyping
    });
    
    render(<ChatRoom roomId="room1" />);
    
    expect(screen.getByText('Other User is typing...')).toBeInTheDocument();
  });

  it('handles loading more messages', async () => {
    (useChat as any).mockReturnValue({
      currentRoom: mockCurrentRoom,
      messages: mockMessages,
      typingUsers: [],
      loading: {
        rooms: false,
        messages: false,
        sendingMessage: false,
        uploadingFile: false
      },
      error: {
        rooms: null,
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom,
      markAsRead: mockMarkAsRead,
      loadMoreMessages: mockLoadMoreMessages
    });
    
    render(<ChatRoom roomId="room1" />);
    
    const loadMoreButton = screen.getByText('Load More');
    fireEvent.click(loadMoreButton);
    
    expect(mockLoadMoreMessages).toHaveBeenCalled();
  });

  it('handles leaving a room', async () => {
    render(<ChatRoom roomId="room1" onBack={mockOnBack} />);
    
    // Open the dropdown menu
    const menuButton = screen.getByTestId('icon-more-vertical').closest('button');
    fireEvent.click(menuButton!);
    
    // Click on the leave chat option
    const leaveButton = screen.getByText('Leave Chat');
    fireEvent.click(leaveButton);
    
    expect(mockLeaveRoom).toHaveBeenCalledWith('room1');
    await waitFor(() => {
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  it('shows empty message list when no messages are available', () => {
    (useChat as any).mockReturnValue({
      currentRoom: mockCurrentRoom,
      messages: [],
      typingUsers: [],
      loading: {
        rooms: false,
        messages: false,
        sendingMessage: false,
        uploadingFile: false
      },
      error: {
        rooms: null,
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom,
      markAsRead: mockMarkAsRead
    });
    
    render(<ChatRoom roomId="room1" />);
    
    expect(screen.getByText('No messages yet. Send a message to start the conversation!')).toBeInTheDocument();
  });

  it('shows loading state when messages are loading', () => {
    (useChat as any).mockReturnValue({
      currentRoom: mockCurrentRoom,
      messages: [],
      typingUsers: [],
      loading: {
        rooms: false,
        messages: true,
        sendingMessage: false,
        uploadingFile: false
      },
      error: {
        rooms: null,
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom,
      markAsRead: mockMarkAsRead
    });
    
    render(<ChatRoom roomId="room1" />);
    
    expect(screen.getByTestId('icon-loader')).toBeInTheDocument();
  });

  it('disables message input when sending message or uploading file', () => {
    (useChat as any).mockReturnValue({
      currentRoom: mockCurrentRoom,
      messages: mockMessages,
      typingUsers: [],
      loading: {
        rooms: false,
        messages: false,
        sendingMessage: true,
        uploadingFile: false
      },
      error: {
        rooms: null,
        messages: null,
        sendingMessage: null,
        uploadingFile: null
      },
      setCurrentRoom: mockSetCurrentRoom,
      markAsRead: mockMarkAsRead
    });
    
    render(<ChatRoom roomId="room1" />);
    
    const textarea = screen.getByPlaceholderText('Type a message...');
    expect(textarea).toBeDisabled();
  });
});

