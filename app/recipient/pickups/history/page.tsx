'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PreviousCollections() {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAuthorized('recipient'))) {
      router.push('/auth/login');
    }
  }, [user, loading, isAuthorized, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await fetch('/api/requests');
        if (!response.ok) throw new Error('Failed to fetch requests');
        const data = await response.json();
        setRequests(data.filter((r: any) => r.recipientId === user.uid && r.status === 'completed'));
      } catch (error) {
        toast.error('Failed to load requests.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, [user]);

  if (loading || !user || !isAuthorized('recipient')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Skeleton className="w-64 h-32 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary">Previous Collections</h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>History of collected donations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="w-full h-16 rounded-lg" />
            ) : requests.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No completed requests found.</div>
            ) : (
              <ul className="mt-6 space-y-4">
                {requests.map((req) => (
                  <li key={req.id} className="border rounded p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-semibold">{req.title}</div>
                      <div className="text-sm text-muted-foreground">{req.description}</div>
                      <div className="text-xs mt-1">Quantity: {req.quantity} | Category: {req.category}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}