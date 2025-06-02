'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon?: ReactNode;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendDirection = 'up',
  className
}: StatsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <div>{icon}</div>}
        </div>
        <div className="mt-2">
          <p className="text-3xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-xs">
            {trendDirection === 'up' ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : trendDirection === 'down' ? (
              <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
            ) : null}
            <span
              className={cn(
                trendDirection === 'up' ? 'text-green-500' : 
                trendDirection === 'down' ? 'text-rose-500' : 'text-muted-foreground'
              )}
            >
              {trend}
            </span>
            <span className="ml-1 text-muted-foreground">vs. last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
