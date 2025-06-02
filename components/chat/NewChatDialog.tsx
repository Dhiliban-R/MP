'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Users, MessageCircle } from 'lucide-react';
import { ChatRoomType } from '@/lib/types/chat.types';
import { User } from '@/lib/types/user.types';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateChat: (
    type: ChatRoomType,
    participantIds: string[],
    name?: string,
    donationId?: string
  ) => Promise<void>;
}

export const NewChatDialog: React.FC<NewChatDialogProps> = ({
  open,
  onOpenChange,
  onCreateChat
}) => {
  const { user } = useAuth();
  const [chatType, setChatType] = useState<ChatRoomType>(ChatRoomType.DIRECT);
  const [chatName, setChatName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim() || !user) return;

      try {
        setSearching(true);
        
        // Search by display name or email
        const usersRef = collection(db, 'users');
        const queries = [
          query(
            usersRef,
            where('displayName', '>=', searchQuery),
            where('displayName', '<=', searchQuery + '\uf8ff'),
            limit(10)
          ),
          query(
            usersRef,
            where('email', '>=', searchQuery.toLowerCase()),
            where('email', '<=', searchQuery.toLowerCase() + '\uf8ff'),
            limit(10)
          )
        ];

        const results = await Promise.all(queries.map(q => getDocs(q)));
        const users: User[] = [];
        const userIds = new Set<string>();

        results.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            const userData = doc.data() as User;
            // Exclude current user and avoid duplicates
            if (userData.uid !== user.uid && !userIds.has(userData.uid)) {
              users.push(userData);
              userIds.add(userData.uid);
            }
          });
        });

        setAvailableUsers(users);
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('Failed to search users');
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, user]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setChatType(ChatRoomType.DIRECT);
      setChatName('');
      setSearchQuery('');
      setSelectedUsers([]);
      setAvailableUsers([]);
    }
  }, [open]);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (chatType === ChatRoomType.DIRECT && selectedUsers.length > 1) {
      toast.error('Direct chats can only have one other participant');
      return;
    }

    try {
      setLoading(true);
      await onCreateChat(
        chatType,
        selectedUsers,
        chatName.trim() || undefined
      );
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedUserNames = () => {
    return availableUsers
      .filter(user => selectedUsers.includes(user.uid))
      .map(user => user.displayName)
      .join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Start New Chat</span>
          </DialogTitle>
          <DialogDescription>
            Create a new chat with other users
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Chat Type Selection */}
          <div className="space-y-3">
            <Label>Chat Type</Label>
            <RadioGroup
              value={chatType}
              onValueChange={(value) => setChatType(value as ChatRoomType)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ChatRoomType.DIRECT} id="direct" />
                <Label htmlFor="direct" className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Direct Chat</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value={ChatRoomType.DONATION} id="donation" />
                <Label htmlFor="donation" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Donation Chat</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Chat Name (optional for direct chats) */}
          {chatType !== ChatRoomType.DIRECT && (
            <div className="space-y-2">
              <Label htmlFor="chatName">Chat Name (Optional)</Label>
              <Input
                id="chatName"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="Enter chat name..."
              />
            </div>
          )}

          {/* User Search */}
          <div className="space-y-2">
            <Label>Search Users</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Users ({selectedUsers.length})</Label>
              <div className="p-2 bg-muted rounded-md">
                <p className="text-sm">{getSelectedUserNames()}</p>
              </div>
            </div>
          )}

          {/* Available Users */}
          <div className="space-y-2">
            <Label>Available Users</Label>
            <ScrollArea className="h-48 border rounded-md">
              {searching ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </div>
                </div>
              ) : availableUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? 'No users found' : 'Start typing to search for users'}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {availableUsers.map((availableUser) => (
                    <div
                      key={availableUser.uid}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleUserToggle(availableUser.uid)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(availableUser.uid)}
                        onChange={() => handleUserToggle(availableUser.uid)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={availableUser.photoURL} />
                        <AvatarFallback>
                          {availableUser.displayName?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {availableUser.displayName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {availableUser.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {availableUser.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateChat}
            disabled={selectedUsers.length === 0 || loading}
          >
            {loading ? 'Creating...' : 'Create Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
