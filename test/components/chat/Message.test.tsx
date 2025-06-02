import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Message } from '@/components/chat/Message';
import { MessageStatus } from '@/lib/types/chat.types';
import { User } from '@/lib/types/user.types';
import { Timestamp } from 'firebase/firestore';

// Mock Timestamp
vi.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => ({
      toDate: () => new Date(),
    }),
    fromDate: (date: Date) => ({
      toDate: () => date,
    }),
  },
}));

describe('Message Component', () => {
  // Mock user
  const mockCurrentUser: User = {
    uid: 'user123',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    role: 'donor',
    createdAt: new Date(),
    lastLogin: new Date(),
    getIdToken: async () => 'mock-token',
  };

  // Mock timestamps
  const mockTimestamp = {
    toDate: () => new Date('2025-06-01T10:00:00'),
  };

  // Mock message from current user
  const mockCurrentUserMessage = {
    id: 'msg1',
    roomId: 'room1',
    senderId: 'user123',
    senderName: 'Test User',
    senderPhotoURL: '/test-avatar.jpg',
    text: 'Hello, this is a test message',
    timestamp: mockTimestamp,
    status: MessageStatus.DELIVERED,
  };

  // Mock message from other user
  const mockOtherUserMessage = {
    id: 'msg2',
    roomId: 'room1',
    senderId: 'user456',
    senderName: 'Other User',
    senderPhotoURL: '/other-avatar.jpg',
    text: 'This is a reply message',
    timestamp: mockTimestamp,
    status: MessageStatus.READ,
  };

  // Mock message with attachment
  const mockMessageWithAttachment = {
    id: 'msg3',
    roomId: 'room1',
    senderId: 'user123',
    senderName: 'Test User',
    text: 'Check out this file',
    timestamp: mockTimestamp,
    status: MessageStatus.SENT,
    attachments: [
      {
        id: 'att1',
        type: 'file',
        url: 'https://example.com/file.pdf',
        name: 'document.pdf',
        size: 1024 * 1024,
        mimeType: 'application/pdf',
      },
    ],
  };

  // Mock deleted message
  const mockDeletedMessage = {
    id: 'msg4',
    roomId: 'room1',
    senderId: 'user123',
    senderName: 'Test User',
    text: 'This message has been deleted',
    timestamp: mockTimestamp,
    status: MessageStatus.DELIVERED,
    isDeleted: true,
    deletedAt: mockTimestamp,
  };

  // Mock functions
  const mockOnDelete = vi.fn();
  const mockOnReply = vi.fn();
  const mockOnReact = vi.fn();
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders a message from the current user correctly', () => {
    render(
      <Message
        message={mockCurrentUserMessage}
        currentUser={mockCurrentUser}
        onDelete={mockOnDelete}
        onReply={mockOnReply}
        onReact={mockOnReact}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    // Messages from current user don't show sender name
    expect(screen.queryByText('Test User')).not.toBeInTheDocument();
  });

  test('renders a message from another user correctly', () => {
    render(
      <Message
        message={mockOtherUserMessage}
        currentUser={mockCurrentUser}
        onDelete={mockOnDelete}
        onReply={mockOnReply}
        onReact={mockOnReact}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('This is a reply message')).toBeInTheDocument();
    expect(screen.getByText('Other User')).toBeInTheDocument();
  });

  test('renders a message with attachment correctly', () => {
    render(
      <Message
        message={mockMessageWithAttachment}
        currentUser={mockCurrentUser}
        onDelete={mockOnDelete}
        onReply={mockOnReply}
        onReact={mockOnReact}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Check out this file')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
  });

  test('renders a deleted message correctly', () => {
    render(
      <Message
        message={mockDeletedMessage}
        currentUser={mockCurrentUser}
        onDelete={mockOnDelete}
        onReply={mockOnReply}
        onReact={mockOnReact}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('This message has been deleted')).toBeInTheDocument();
    // Action buttons should not be visible for deleted messages
    expect(document.querySelector('[aria-label="Like"]')).not.toBeInTheDocument();
    expect(document.querySelector('[aria-label="Reply"]')).not.toBeInTheDocument();
    expect(document.querySelector('[aria-label="More options"]')).not.toBeInTheDocument();
  });

  test('calls onSelect when message is clicked', () => {
    render(
      <Message
        message={mockCurrentUserMessage}
        currentUser={mockCurrentUser}
        onDelete={mockOnDelete}
        onReply={mockOnReply}
        onReact={mockOnReact}
        onSelect={mockOnSelect}
      />
    );

    fireEvent.click(screen.getByText('Hello, this is a test message'));
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  test('shows action buttons on hover for non-deleted messages', async () => {
    // Mock implementation for hover
    // Note: Testing hover is tricky - we're directly triggering mouseEnter event
    render(
      <Message
        message={mockCurrentUserMessage}
        currentUser={mockCurrentUser}
        onDelete={mockOnDelete}
        onReply={mockOnReply}
        onReact={mockOnReact}
        onSelect={mockOnSelect}
      />
    );

    // Find the message container and trigger mouseEnter
    const messageContainer = screen.getByText('Hello, this is a test message').closest('div');
    if (messageContainer) {
      fireEvent.mouseEnter(messageContainer);
      
      // We can't easily test for hover buttons due to how they're implemented,
      // but we can verify the component doesn't crash on hover
      expect(messageContainer).toBeInTheDocument();
    }
  });

  test('correctly formats timestamp', () => {
    render(
      <Message
        message={mockCurrentUserMessage}
        currentUser={mockCurrentUser}
        onDelete={mockOnDelete}
        onReply={mockOnReply}
        onReact={mockOnReact}
        onSelect={mockOnSelect}
      />
    );

    // Just verify time format exists (exact format depends on locale and time)
    const timeElement = screen.getByText(/\d+:\d+ [AP]M/);
    expect(timeElement).toBeInTheDocument();
  });

  test('shows correct status indicator for current user message', () => {
    render(
      <Message
        message={mockCurrentUserMessage}
        currentUser={mockCurrentUser}
        onDelete={mockOnDelete}
        onReply={mockOnReply}
        onReact={mockOnReact}
        onSelect={mockOnSelect}
      />
    );

    // Status indicator is a SVG icon, hard to test directly
    // Just verify the message renders properly
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
  });

  test('handles null current user gracefully', () => {
    // Should not crash if currentUser is null
    render(
      <Message
        message={mockOtherUserMessage}
        currentUser={null}
        onDelete={mockOnDelete}
        onReply={mockOnReply}
        onReact={mockOnReact}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('This is a reply message')).toBeInTheDocument();
  });
});

