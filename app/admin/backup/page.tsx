'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import BackupManager from '@/components/admin/BackupManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  ArrowLeft,
  Database,
  Download,
  Upload,
  Clock,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminBackupPage() {
  const { user, loading, isAuthorized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isAuthorized('admin'))) {
      router.push('/auth/login');
    }
  }, [user, loading, isAuthorized, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAuthorized('admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">Backup & Data Management</h1>
          <p className="text-lg text-muted-foreground">
            Secure your data with comprehensive backup and recovery tools
          </p>
        </div>

        {/* Important Information */}
        <div className="grid gap-4 mb-8">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Backup Best Practices:</strong> Regular backups ensure data safety. 
              We recommend creating weekly full backups and daily incremental backups for critical data.
            </AlertDescription>
          </Alert>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Notice:</strong> Backup files contain sensitive user data. 
              Store them securely and follow your organization's data protection policies.
            </AlertDescription>
          </Alert>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Performance Impact:</strong> Large backups may temporarily affect system performance. 
              Consider scheduling backups during low-usage periods.
            </AlertDescription>
          </Alert>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Database className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">6</p>
                  <p className="text-xs text-muted-foreground">Data Collections</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Download className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">JSON/CSV</p>
                  <p className="text-xs text-muted-foreground">Export Formats</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">Auto</p>
                  <p className="text-xs text-muted-foreground">Scheduled Backups</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">Secure</p>
                  <p className="text-xs text-muted-foreground">Data Protection</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Backup Manager Component */}
        <BackupManager />

        {/* Additional Information */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>👥</span> Users
                  </span>
                  <span className="text-sm text-muted-foreground">Profile & authentication data</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>🎁</span> Donations
                  </span>
                  <span className="text-sm text-muted-foreground">Food donation records</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>📋</span> Reservations
                  </span>
                  <span className="text-sm text-muted-foreground">Pickup reservations</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>🔔</span> Notifications
                  </span>
                  <span className="text-sm text-muted-foreground">System notifications</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>📊</span> Analytics
                  </span>
                  <span className="text-sm text-muted-foreground">Usage statistics</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    <span>💬</span> Chat Messages
                  </span>
                  <span className="text-sm text-muted-foreground">Communication logs</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Data Encryption</p>
                    <p className="text-sm text-muted-foreground">All backups are encrypted in transit and at rest</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Access Control</p>
                    <p className="text-sm text-muted-foreground">Only authorized administrators can create backups</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Audit Trail</p>
                    <p className="text-sm text-muted-foreground">All backup operations are logged and tracked</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">GDPR Compliant</p>
                    <p className="text-sm text-muted-foreground">Backup processes respect data protection regulations</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            For technical support or questions about backup procedures, 
            contact your system administrator or IT support team.
          </p>
        </div>
      </div>
    </div>
  );
}
