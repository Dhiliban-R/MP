'use client';

import React, { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useSearchParams } from 'next/navigation';

function ChatPageContent() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();

  // Get initial room ID from URL params
  const initialRoomId = searchParams.get('room');
  const donationId = searchParams.get('donation');

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-6 w-6" />
              <span>Chat</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-muted-foreground">
                Please log in to access the chat feature
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <MessageCircle className="h-8 w-8" />
          <span>Chat</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Communicate with donors and recipients about food donations
        </p>
      </div>

      <div className="h-[calc(100vh-200px)]">
        <ChatInterface
          initialRoomId={initialRoomId || undefined}
          donationId={donationId || undefined}
          className="h-full"
        />
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}
