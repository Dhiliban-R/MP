'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DatePicker } from '@/components/ui/date-picker';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  Upload, 
  Database, 
  Calendar,
  FileText,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Shield,
  Settings
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { 
  createBackup, 
  getBackupHistory, 
  deleteBackup, 
  BackupOptions, 
  BackupMetadata 
} from '@/lib/backup-service';

interface BackupManagerProps {
  className?: string;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ className = '' }) => {
  const authContext = useAuth();
  const user = authContext?.user;
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backupHistory, setBackupHistory] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);

  // Backup options state
  const [backupOptions, setBackupOptions] = useState<BackupOptions>({
    includeUsers: true,
    includeDonations: true,
    includeReservations: true,
    includeNotifications: false,
    includeAnalytics: true,
    includeChats: false,
    format: 'json',
    compression: false
  });

  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({
    start: undefined,
    end: undefined
  });

  useEffect(() => {
    loadBackupHistory();
  }, []);

  const loadBackupHistory = async () => {
    try {
      setLoading(true);
      const history = await getBackupHistory();
      setBackupHistory(history);
    } catch (error) {
      console.error('Error loading backup history:', error);
      toast.error('Failed to load backup history');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!user) {
      toast.error('You must be logged in to create backups');
      return;
    }

    setIsCreatingBackup(true);
    try {
      const options: BackupOptions = {
        ...backupOptions,
        dateRange: dateRange.start && dateRange.end ? {
          start: dateRange.start,
          end: dateRange.end
        } : undefined
      };

      await createBackup(options, user.uid);
      await loadBackupHistory(); // Refresh the history
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      await deleteBackup(backupId);
      await loadBackupHistory(); // Refresh the history
    } catch (error) {
      console.error('Error deleting backup:', error);
    }
  };

  const updateBackupOption = (key: keyof BackupOptions, value: any) => {
    setBackupOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSelectedCollectionsCount = (): number => {
    return Object.values(backupOptions).filter(value => value === true).length;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Backup & Data Management</h2>
          <p className="text-muted-foreground">Create, manage, and restore system backups</p>
        </div>
        <Button
          onClick={loadBackupHistory}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Create Backup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Create New Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collections Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Select Data to Include</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'includeUsers', label: 'Users', icon: '👥' },
                { key: 'includeDonations', label: 'Donations', icon: '🎁' },
                { key: 'includeReservations', label: 'Reservations', icon: '📋' },
                { key: 'includeNotifications', label: 'Notifications', icon: '🔔' },
                { key: 'includeAnalytics', label: 'Analytics', icon: '📊' },
                { key: 'includeChats', label: 'Chat Messages', icon: '💬' }
              ].map(({ key, label, icon }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={backupOptions[key as keyof BackupOptions] as boolean}
                    onCheckedChange={(checked) => updateBackupOption(key as keyof BackupOptions, checked)}
                  />
                  <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                    <span>{icon}</span>
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {getSelectedCollectionsCount()} collections selected
            </div>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <DatePicker
                  date={dateRange.start}
                  onDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <DatePicker
                  date={dateRange.end}
                  onDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Leave empty to include all data
            </div>
          </div>

          <Separator />

          {/* Format Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="format">Export Format</Label>
              <Select
                value={backupOptions.format}
                onValueChange={(value: 'json' | 'csv') => updateBackupOption('format', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON (Recommended)</SelectItem>
                  <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="compression"
                checked={backupOptions.compression}
                onCheckedChange={(checked) => updateBackupOption('compression', checked)}
              />
              <Label htmlFor="compression">Enable compression</Label>
            </div>
          </div>

          {/* Create Backup Button */}
          <Button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup || getSelectedCollectionsCount() === 0}
            className="w-full"
            size="lg"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating Backup...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Create & Download Backup
              </>
            )}
          </Button>

          {getSelectedCollectionsCount() === 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please select at least one data collection to include in the backup.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading backup history...
            </div>
          ) : backupHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backups found</p>
              <p className="text-sm">Create your first backup to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {backupHistory.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(backup.status)}
                        <span className="font-medium">
                          Backup - {format(backup.createdAt, 'MMM dd, yyyy HH:mm')}
                        </span>
                        <Badge variant="outline">{backup.format.toUpperCase()}</Badge>
                        {backup.compressed && <Badge variant="secondary">Compressed</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{backup.recordCount.toLocaleString()} records • {formatFileSize(backup.size)}</p>
                        <p>Collections: {backup.collections.join(', ')}</p>
                        <p>Created {formatDistanceToNow(backup.createdAt, { addSuffix: true })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {backup.status === 'completed' && backup.downloadUrl && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBackup(backup.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Total Backups</Label>
              <p className="text-lg font-semibold">{backupHistory.length}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Total Size</Label>
              <p className="text-lg font-semibold">
                {formatFileSize(backupHistory.reduce((sum, backup) => sum + backup.size, 0))}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Last Backup</Label>
              <p className="text-lg font-semibold">
                {backupHistory.length > 0 
                  ? formatDistanceToNow(backupHistory[0].createdAt, { addSuffix: true })
                  : 'Never'
                }
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Success Rate</Label>
              <p className="text-lg font-semibold">
                {backupHistory.length > 0 
                  ? Math.round((backupHistory.filter(b => b.status === 'completed').length / backupHistory.length) * 100)
                  : 0
                }%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupManager;
