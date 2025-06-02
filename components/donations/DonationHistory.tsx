'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  Package,
  TrendingUp,
  BarChart3,
  X,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Donation, DonationStatus } from '@/lib/types';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface DonationHistoryProps {
  donations: Donation[];
  onDonationSelect?: (donation: Donation) => void;
  className?: string;
}

interface HistoryFilters {
  search: string;
  status: DonationStatus | 'all';
  category: string;
  dateRange: DateRange | undefined;
  sortBy: 'date' | 'quantity' | 'title';
  sortOrder: 'asc' | 'desc';
}

export const DonationHistory: React.FC<DonationHistoryProps> = ({
  donations,
  onDonationSelect,
  className = ''
}) => {
  const [filters, setFilters] = useState<HistoryFilters>({
    search: '',
    status: 'all',
    category: 'all',
    dateRange: undefined,
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [filteredDonations, setFilteredDonations] = useState<Donation[]>(donations);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique categories
  const categories = Array.from(new Set(donations.map(d => d.category).filter(Boolean)));

  // Filter and sort donations
  useEffect(() => {
    let filtered = [...donations];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(donation =>
        donation.title.toLowerCase().includes(searchLower) ||
        donation.description.toLowerCase().includes(searchLower) ||
        donation.donorName?.toLowerCase().includes(searchLower) ||
        donation.category.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(donation => donation.status === filters.status);
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(donation => donation.category === filters.category);
    }

    // Date range filter
    if (filters.dateRange?.from && filters.dateRange?.to) {
      filtered = filtered.filter(donation => {
        const donationDate = new Date(donation.createdAt);
        return isWithinInterval(donationDate, {
          start: filters.dateRange.from!,
          end: filters.dateRange.to!
        });
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredDonations(filtered);
  }, [donations, filters]);

  const handleFilterChange = (key: keyof HistoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      category: 'all',
      dateRange: undefined,
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const exportData = () => {
    const csvContent = [
      ['Title', 'Category', 'Quantity', 'Status', 'Created Date', 'Expiry Date'].join(','),
      ...filteredDonations.map(donation => [
        `"${donation.title}"`,
        `"${donation.category}"`,
        donation.quantity,
        donation.status,
        format(new Date(donation.createdAt), 'yyyy-MM-dd'),
        format(new Date(donation.expiryDate), 'yyyy-MM-dd')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donation-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: DonationStatus) => {
    switch (status) {
      case DonationStatus.ACTIVE:
        return 'bg-green-100 text-green-800';
      case DonationStatus.RESERVED:
        return 'bg-yellow-100 text-yellow-800';
      case DonationStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case DonationStatus.EXPIRED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.category !== 'all') count++;
    if (filters.dateRange?.from && filters.dateRange?.to) count++;
    return count;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Donation History</span>
            <Badge variant="secondary">{filteredDonations.length} of {donations.length}</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {getActiveFilterCount() > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
                  {getActiveFilterCount()}
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search donations..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value={DonationStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={DonationStatus.RESERVED}>Reserved</SelectItem>
                    <SelectItem value={DonationStatus.COMPLETED}>Completed</SelectItem>
                    <SelectItem value={DonationStatus.EXPIRED}>Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange('sortBy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="quantity">Quantity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2">
                <Label>Order</Label>
                <Button
                  variant="outline"
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full justify-start"
                >
                  {filters.sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4 mr-2" />
                  ) : (
                    <SortDesc className="h-4 w-4 mr-2" />
                  )}
                  {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
              </div>
            </div>

            {/* Date Range */}
            <div className="mt-4 space-y-2">
              <Label>Date Range</Label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(dateRange) => handleFilterChange('dateRange', dateRange)}
              />
            </div>

            {/* Filter Actions */}
            <div className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </Card>
        )}

        <Separator />

        {/* Donation List */}
        <ScrollArea className="h-96">
          <div className="space-y-3">
            {filteredDonations.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No donations found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              filteredDonations.map((donation) => (
                <Card 
                  key={donation.id} 
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onDonationSelect?.(donation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{donation.title}</h3>
                        <Badge className={getStatusColor(donation.status)}>
                          {donation.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {donation.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{donation.quantity} {donation.quantityUnit}</span>
                        <span>{donation.category}</span>
                        <span>{format(new Date(donation.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {donation.donorName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Expires: {format(new Date(donation.expiryDate), 'MMM dd')}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
