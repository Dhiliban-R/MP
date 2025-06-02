import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table } from '@/components/ui/table';

export default function DonationManagement() {
  // Placeholder data for demonstration
  const donations = [
    { id: 'D-001', donor: 'John Doe', recipient: 'Food Bank X', status: 'Collected', date: '2024-06-01' },
    { id: 'D-002', donor: 'Jane Smith', recipient: 'Shelter Y', status: 'Pending', date: '2024-06-02' },
    { id: 'D-003', donor: 'Market Z', recipient: 'Charity A', status: 'In Transit', date: '2024-06-03' },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary">Donation Management</h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Monitor donations and their statuses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="px-4 py-2 text-left font-semibold">ID</th>
                    <th className="px-4 py-2 text-left font-semibold">Donor</th>
                    <th className="px-4 py-2 text-left font-semibold">Recipient</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((donation) => (
                    <tr key={donation.id} className="border-b last:border-0">
                      <td className="px-4 py-2">{donation.id}</td>
                      <td className="px-4 py-2">{donation.donor}</td>
                      <td className="px-4 py-2">{donation.recipient}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${donation.status === 'Collected' ? 'bg-green-100 text-green-700' : donation.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{donation.status}</span>
                      </td>
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