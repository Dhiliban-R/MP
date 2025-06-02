import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdminApp } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
const adminApp = initAdminApp();
const auth = getAuth(adminApp);
const db = getFirestore(adminApp);

// Configuration
const CONFIG = {
  REMINDER_RATE_LIMIT: 60 * 1000, // 1 minute between reminder requests
  MAX_DAILY_REMINDERS: 5, // Maximum reminders per day
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  REMINDER_TEMPLATE_NAME: 'verification-reminder',
  SUPPORT_EMAIL: 'support@yourapp.com'
};

/**
 * API route for sending verification reminder emails
 * 
 * This provides a server-side implementation that can be used
 * when Firebase Functions are not available (e.g., during local development)
 */
export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies or request headers
    const authToken = cookies().get('auth_token')?.value || 
      request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the token
    try {
      const decodedToken = await auth.verifyIdToken(authToken);
      const userId = decodedToken.uid;
      
      // Get user data
      const user = await auth.getUser(userId);
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (!userData) {
        return NextResponse.json(
          { error: 'User not found', message: 'User data not found in database' },
          { status: 404 }
        );
      }
      
      // Don't send reminders to already verified users
      if (user.emailVerified || userData.emailVerified) {
        return NextResponse.json({
          success: true,
          message: 'User is already verified'
        });
      }
      
      // Check rate limiting
      const lastReminderSent = userData.lastVerificationReminderSent?.toDate();
      if (lastReminderSent && Date.now() - lastReminderSent.getTime() < CONFIG.REMINDER_RATE_LIMIT) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Please wait at least ${CONFIG.REMINDER_RATE_LIMIT / 1000} seconds between reminder requests`,
            retryAfter: Math.ceil((CONFIG.REMINDER_RATE_LIMIT - (Date.now() - lastReminderSent.getTime())) / 1000)
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((CONFIG.REMINDER_RATE_LIMIT - (Date.now() - lastReminderSent.getTime())) / 1000).toString()
            }
          }
        );
      }
      
      // Check daily reminder limit
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const remindersSentToday = userData.remindersSentToday?.[today] || 0;
      
      if (remindersSentToday >= CONFIG.MAX_DAILY_REMINDERS) {
        return NextResponse.json(
          {
            error: 'Daily limit exceeded',
            message: `You've reached the daily limit of ${CONFIG.MAX_DAILY_REMINDERS} verification reminders`
          },
          { status: 429 }
        );
      }
      
      // Calculate grace period info for the email template
      let gracePeriodRemaining = null;
      if (userData.createdAt) {
        const creationTime = userData.createdAt.toDate();
        const gracePeriodDuration = 24 * 60 * 60 * 1000; // 24 hours
        const now = Date.now();
        const gracePeriodEnd = new Date(creationTime.getTime() + gracePeriodDuration);
        const remainingTime = Math.max(0, gracePeriodEnd.getTime() - now);
        
        if (remainingTime > 0) {
          const hours = Math.floor(remainingTime / (1000 * 60 * 60));
          const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
          gracePeriodRemaining = `${hours}h ${minutes}m`;
        }
      }
      
      // Send email reminder
      await db.collection('mail').add({
        to: user.email,
        template: {
          name: CONFIG.REMINDER_TEMPLATE_NAME,
          data: {
            displayName: userData.displayName || 'User',
            verificationLink: `${CONFIG.APP_URL}/verify-email?uid=${userId}`,
            appName: 'Food Donation Platform',
            supportEmail: CONFIG.SUPPORT_EMAIL,
            reminderNumber: remindersSentToday + 1,
            gracePeriodRemaining,
            currentYear: new Date().getFullYear()
          }
        },
        createdAt: new Date()
      });
      
      // Update reminder metrics
      const remindersSentTodayUpdate = {};
      remindersSentTodayUpdate[`remindersSentToday.${today}`] = (remindersSentToday || 0) + 1;
      
      // Update user document to record the reminder
      await db.collection('users').doc(userId).update({
        lastVerificationReminderSent: new Date(),
        verificationRemindersSent: (userData.verificationRemindersSent || 0) + 1,
        ...remindersSentTodayUpdate
      });
      
      // Update analytics
      try {
        const analyticsRef = db.collection('analytics').doc('verification');
        const analyticsDoc = await analyticsRef.get();
        
        if (analyticsDoc.exists) {
          await analyticsRef.update({
            remindersSent: (analyticsDoc.data()?.remindersSent || 0) + 1,
            [`remindersByMonth.${new Date().getFullYear()}_${new Date().getMonth() + 1}`]: 
              (analyticsDoc.data()?.remindersByMonth?.[`${new Date().getFullYear()}_${new Date().getMonth() + 1}`] || 0) + 1
          });
        } else {
          await analyticsRef.set({
            remindersSent: 1,
            remindersByMonth: {
              [`${new Date().getFullYear()}_${new Date().getMonth() + 1}`]: 1
            }
          });
        }
      } catch (analyticsError) {
        console.error('Error updating reminder analytics:', analyticsError);
      }
      
      return NextResponse.json({
        success: true,
        remainingReminders: CONFIG.MAX_DAILY_REMINDERS - (remindersSentToday + 1)
      });
    } catch (authError) {
      console.error('Error verifying auth token:', authError);
      return NextResponse.json(
        { error: 'Invalid token', message: 'Authentication failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error sending verification reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to send verification reminder' },
      { status: 500 }
    );
  }
}

