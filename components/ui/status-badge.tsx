'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DonationStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: DonationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case DonationStatus.ACTIVE:
        return {
          label: 'Active',
          className: 'bg-green-500/15 text-green-600 hover:bg-green-500/20'
        };
      case DonationStatus.PENDING:
        return {
          label: 'Pending',
          className: 'bg-blue-500/15 text-blue-600 hover:bg-blue-500/20'
        };
      case DonationStatus.RESERVED:
        return {
          label: 'Reserved',
          className: 'bg-orange-500/15 text-orange-600 hover:bg-orange-500/20'
        };
      case DonationStatus.COMPLETED:
        return {
          label: 'Completed',
          className: 'bg-teal-500/15 text-teal-600 hover:bg-teal-500/20'
        };
      case DonationStatus.EXPIRED:
        return {
          label: 'Expired',
          className: 'bg-rose-500/15 text-rose-600 hover:bg-rose-500/20'
        };
      case DonationStatus.CANCELLED:
        return {
          label: 'Cancelled',
          className: 'bg-slate-500/15 text-slate-600 hover:bg-slate-500/20'
        };
      default:
        return {
          label: status,
          className: 'bg-slate-500/15 text-slate-600 hover:bg-slate-500/20'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
