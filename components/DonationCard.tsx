import React from 'react';
import { Donation } from '@/lib/types/donation.types';

interface DonationCardProps {
  donation: Donation;
  onSelect?: (donation: Donation) => void;
  onReserve?: (donationId: string) => void;
  showDistance?: boolean;
  distance?: number | null;
  variant?: 'vertical' | 'horizontal';
}

// TODO: Implement full donation card UI and logic
const DonationCard: React.FC<DonationCardProps> = ({ donation }) => {
  return (
    <div className="border rounded p-4 shadow">
      <h3 className="font-bold text-lg">{donation.title}</h3>
      <p>{donation.description}</p>
      <p>Status: {donation.status}</p>
      {/* Add more donation details as needed */}
    </div>
  );
};

export default DonationCard;
