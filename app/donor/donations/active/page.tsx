'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CurrentDonations() {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAuthorized('donor'))) {
      router.push('/auth/login');
    }
  }, [user, loading, isAuthorized, router]);

  // Placeholder data for demonstration
  const donations = [
    { id: 'D-101', title: 'Fresh Vegetables', status: 'Active', quantity: 10, unit: 'kg', recipient: 'Food Bank X', date: '2024-06-10' },
    { id: 'D-102', title: 'Canned Goods', status: 'Reserved', quantity: 20, unit: 'cans', recipient: 'Shelter Y', date: '2024-06-11' },
  ];

  if (loading || !user || !isAuthorized('donor')) {
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
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary">Current Donations</h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Track active donations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left font-semibold">ID</th>
                    <th className="px-4 py-2 text-left font-semibold">Title</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Quantity</th>
                    <th className="px-4 py-2 text-left font-semibold">Recipient</th>
                    <th className="px-4 py-2 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{donation.id}</td>
                      <td className="px-4 py-2">{donation.title}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${donation.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{donation.status}</span>
                      </td>
                      <td className="px-4 py-2">{donation.quantity} {donation.unit}</td>
                      <td className="px-4 py-2">{donation.recipient}</td>
                      <td className="px-4 py-2">{donation.date}</td>
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
