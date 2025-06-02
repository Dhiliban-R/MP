'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecipientManagement() {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAuthorized('admin'))) {
      router.push('/auth/login');
    }
  }, [user, loading, isAuthorized, router]);

  // Placeholder data for demonstration
  const recipients = [
    { id: 'R-001', name: 'Food Bank X', email: 'fbx@example.com', status: 'Active' },
    { id: 'R-002', name: 'Shelter Y', email: 'sheltery@example.com', status: 'Inactive' },
    { id: 'R-003', name: 'Charity A', email: 'charitya@example.com', status: 'Active' },
  ];

  if (loading || !user || !isAuthorized('admin')) {
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
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary">Recipient Management</h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>View and manage recipient accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left font-semibold">ID</th>
                    <th className="px-4 py-2 text-left font-semibold">Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Email</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((recipient) => (
                    <tr key={recipient.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{recipient.id}</td>
                      <td className="px-4 py-2">{recipient.name}</td>
                      <td className="px-4 py-2">{recipient.email}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${recipient.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{recipient.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}