import {onRequest} from "firebase-functions/v2/https";
import {onCall, HttpsError} from "firebase-functions/v2/https"; // Import onCall and HttpsError
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue, Timestamp} from "firebase-admin/firestore";
import {getMessaging} from "firebase-admin/messaging";
import * as logger from "firebase-functions/logger";
import * as geofire from 'geofire-common';
import * as nodemailer from 'nodemailer';

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();
const messaging = getMessaging();

// Define secrets (if needed)
// const apiKey = defineSecret("GEOCODING_API_KEY");

// Helper function to calculate impact metrics
const calculateImpactMetrics = (quantity: number, category: string) => {
  // Default conversion factors
  let mealsProvided = 0;
  let foodWasteSaved = 0;
  let carbonFootprint = 0;
  
  // Calculate based on category and quantity
  // These are approximate values and can be adjusted based on research
  switch(category.toLowerCase()) {
    case 'produce':
    case 'fruits':
    case 'vegetables':
      mealsProvided = quantity * 2; // 1kg = ~2 meals
      foodWasteSaved = quantity;
      carbonFootprint = quantity * 2.5; // 1kg food waste = ~2.5kg CO2
      break;
    case 'grains':
    case 'bread':
    case 'bakery':
      mealsProvided = quantity * 4; // 1kg = ~4 meals
      foodWasteSaved = quantity;
      carbonFootprint = quantity * 1.8;
      break;
    case 'dairy':
      mealsProvided = quantity * 3;
      foodWasteSaved = quantity;
      carbonFootprint = quantity * 3.2;
      break;
    case 'meat':
    case 'protein':
      mealsProvided = quantity * 5;
      foodWasteSaved = quantity;
      carbonFootprint = quantity * 5.5;
      break;
    case 'prepared':
    case 'meals':
      mealsProvided = quantity * 1; // 1 prepared meal = 1 meal
      foodWasteSaved = quantity * 0.5;
      carbonFootprint = quantity * 2.2;
      break;
    default:
      // Default for other categories
      mealsProvided = quantity * 2;
      foodWasteSaved = quantity;
      carbonFootprint = quantity * 2.5;
  }
  
  return {
    mealsProvided,
    foodWasteSaved,
    carbonFootprint
  };
};

// Helper function to get FCM tokens for a user
const getUserFcmTokens = async (userId: string) => {
  try {
    const tokensSnapshot = await db.collection('fcmTokens')
      .where('userId', '==', userId)
      .where('active', '!=', false)
      .get();
    
    const tokens: string[] = [];
    tokensSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.token) {
        tokens.push(data.token);
      }
    });
    
    return tokens;
  } catch (error) {
    logger.error('Error getting user FCM tokens:', error);
    return [];
  }
};

// Helper function to send notification to multiple tokens
const sendNotificationToTokens = async (
  tokens: string[], 
  title: string, 
  body: string, 
  data: Record<string, string> = {}
) => {
  if (tokens.length === 0) return;
  
  try {
    // Send to each token individually to handle token failures
    const sendPromises = tokens.map(token => {
      const message = {
        notification: {
          title,
          body,
        },
        data,
        token,
      };
      
      return messaging.send(message)
        .catch(error => {
          // If token is invalid, remove it
          if (error.code === 'messaging/invalid-registration-token' ||
              error.code === 'messaging/registration-token-not-registered') {
            return db.collection('fcmTokens')
              .where('token', '==', token)
              .get()
              .then(snapshot => {
                snapshot.forEach(doc => {
                  doc.ref.update({ active: false, invalidatedAt: Timestamp.now() });
                });
              });
          }
          logger.error(`Error sending message to token ${token}:`, error);
          return Promise.resolve(); // Explicitly return a resolved promise for this path
        });
    });
    
    await Promise.all(sendPromises);
    return true;
  } catch (error) {
    logger.error('Error sending notifications to tokens:', error);
    return false;
  }
};

// HTTP function for testing
export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// Firestore trigger for new donations
export const onNewDonation = onDocumentCreated("donations/{donationId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const donationData = snapshot.data();
  const donationId = event.params.donationId;
  logger.info("New donation created:", donationId);

  try {
    // Update analytics data
    const analyticsRef = db.collection('analytics').doc('summary');
    
    // Calculate impact metrics
    const impactMetrics = calculateImpactMetrics(
      donationData.quantity || 1, 
      donationData.category || 'Food'
    );
    
    // Update analytics with new donation and impact metrics
    await analyticsRef.set({
      totalDonations: FieldValue.increment(1),
      activeDonations: FieldValue.increment(1),
      [`donationsByCategory.${donationData.category || 'Food'}`]: FieldValue.increment(1),
      'impactMetrics.mealsProvided': FieldValue.increment(impactMetrics.mealsProvided),
      'impactMetrics.foodWasteSaved': FieldValue.increment(impactMetrics.foodWasteSaved),
      'impactMetrics.carbonFootprint': FieldValue.increment(impactMetrics.carbonFootprint),
    }, { merge: true });
    
    // Update donation trend data
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'short' });
    const year = now.getFullYear();
    const trendKey = `${month} ${year}`;
    
    await analyticsRef.set({
      [`donationTrend.${trendKey}`]: FieldValue.increment(1)
    }, { merge: true });
    
    logger.info("Analytics updated for new donation.");
    
    // Create geohash for location-based queries if coordinates are provided
    // Commenting out as per subtask requirements - client will handle this for now.
    /*
    if (donationData.pickupAddress && 
        typeof donationData.pickupAddress.latitude === 'number' && 
        typeof donationData.pickupAddress.longitude === 'number') {
      
      const lat = donationData.pickupAddress.latitude;
      const lng = donationData.pickupAddress.longitude;
      
      // Calculate geohash and geohash precision
      const geohash = geofire.geohashForLocation([lat, lng]);
      
      // Update the donation with geohash
      await db.collection('donations').doc(donationId).update({
        geohash,
        // Store the location as a GeoPoint for Firestore queries
        geopoint: new admin.firestore.GeoPoint(lat, lng)
      });
      
      logger.info(`Geohash ${geohash} added to donation ${donationId}`);
    }
    */

    // Send notifications to all recipients directly
    logger.info("Attempting to send notifications for new donation to all recipients.");
    const recipientsSnapshot = await db.collection('users').where('role', '==', 'recipient').get();

    if (recipientsSnapshot.empty) {
      logger.info('No recipients found to notify.');
    } else {
      logger.info(`Found ${recipientsSnapshot.size} recipients to notify.`);
      for (const recipientDoc of recipientsSnapshot.docs) {
        // const recipient = recipientDoc.data(); // recipient data not directly used here, id is enough
        const recipientId = recipientDoc.id;
        const tokens = await getUserFcmTokens(recipientId);

        if (tokens.length > 0) {
          const notificationTitle = 'New Donation Available!';
          // Using a more generic body as "near you" might not be accurate without location-based filtering
          const notificationBody = `A new donation "${donationData.title}" has been listed. Check it out!`;
          const notificationDataPayload = {
            donationId,
            type: 'new_donation',
            link: `/recipient/donations/${donationId}` // Link recipient to the specific donation
          };

          await sendNotificationToTokens(tokens, notificationTitle, notificationBody, notificationDataPayload);
          logger.info(`Notification sent to recipient ${recipientId} for new donation ${donationId}`);
        } else {
          logger.info(`Recipient ${recipientId} has no active FCM tokens.`);
        }
      }
    }
    // Old topic-based messaging commented out
    /*
    const message = {
      notification: {
        title: 'New Donation Available!',
        body: `"${donationData.title}" is now available for pickup near you.`,
      },
      data: {
        donationId,
        type: 'new_donation',
        link: `/recipient/donations/${donationId}`
      },
      topic: 'role-recipient', // Send to all recipients
    };
    await messaging.send(message);
    logger.info('Notification sent to recipients for new donation.');
    */
    
  } catch (error) {
    logger.error('Error processing new donation:', error);
  }
});

// Firestore trigger for donation status updates
export const onDonationStatusUpdate = onDocumentUpdated("donations/{donationId}", async (event) => {
  const oldData = event.data?.before.data();
  const newData = event.data?.after.data();

  if (!oldData || !newData || oldData.status === newData.status) {
    return; // Only proceed if status has changed
  }

  const donationId = event.params.donationId;
  const donationTitle = newData.title;
  const donorId = newData.donorId;
  const recipientId = newData.reservedBy;
  const oldStatus = oldData.status;
  const newStatus = newData.status;

  logger.info(`Donation ${donationId} status changed from ${oldStatus} to ${newStatus}`);

  try {
    // Update analytics based on status change
    const analyticsRef = db.collection('analytics').doc('summary');
    
    // Decrement counter for old status
    if (oldStatus === 'active') {
      await analyticsRef.update({
        activeDonations: FieldValue.increment(-1)
      });
    }
    
    // Increment counter for new status
    if (newStatus === 'completed') {
      await analyticsRef.update({
        completedDonations: FieldValue.increment(1)
      });
    } else if (newStatus === 'active') {
      await analyticsRef.update({
        activeDonations: FieldValue.increment(1)
      });
    }
    
    // Prepare notification data
    let donorNotificationTitle = '';
    let donorNotificationBody = '';
    let recipientNotificationTitle = '';
    let recipientNotificationBody = '';
    let notificationType = 'info';
    let donorLink = `/donor/donations/${donationId}`;
    let recipientLink = `/recipient/donations/${donationId}`;
    
    switch (newStatus) {
      case 'reserved':
        donorNotificationTitle = 'Donation Reserved!';
        donorNotificationBody = `Your donation "${donationTitle}" has been reserved by a recipient.`;
        recipientNotificationTitle = 'Reservation Confirmed!';
        recipientNotificationBody = `You have successfully reserved "${donationTitle}". Please arrange pickup soon.`;
        notificationType = 'success';
        break;
      case 'completed':
        donorNotificationTitle = 'Donation Picked Up!';
        donorNotificationBody = `Your donation "${donationTitle}" has been successfully picked up.`;
        recipientNotificationTitle = 'Pickup Completed!';
        recipientNotificationBody = `You have successfully picked up "${donationTitle}". Thank you!`;
        notificationType = 'success';
        recipientLink = `/recipient/donations/history`;
        break;
      case 'cancelled':
        donorNotificationTitle = 'Donation Cancelled!';
        donorNotificationBody = `The reservation for "${donationTitle}" has been cancelled.`;
        recipientNotificationTitle = 'Reservation Cancelled!';
        recipientNotificationBody = `The reservation for "${donationTitle}" has been cancelled.`;
        notificationType = 'warning';
        recipientLink = `/recipient/donations/available`;
        break;
      case 'expired':
        donorNotificationTitle = 'Donation Expired!';
        donorNotificationBody = `Your donation "${donationTitle}" has expired.`;
        notificationType = 'warning';
        break;
      default:
        // No specific notification for other status changes
        return;
    }
    
    // Get FCM tokens for donor
    const donorTokens = await getUserFcmTokens(donorId);
    
    // Send notification to donor
    if (donorTokens.length > 0) {
      await sendNotificationToTokens(
        donorTokens,
        donorNotificationTitle,
        donorNotificationBody,
        {
          donationId,
          type: notificationType,
          link: donorLink,
          userId: donorId,
          relatedEntityId: donationId,
          relatedEntityType: 'donation'
        }
      );
      logger.info(`Notification sent to donor ${donorId} for status change to ${newStatus}.`);
    }
    
    // Send notification to recipient if applicable
    if (recipientId && (newStatus === 'reserved' || newStatus === 'completed' || newStatus === 'cancelled')) {
      const recipientTokens = await getUserFcmTokens(recipientId);
      
      if (recipientTokens.length > 0) {
        await sendNotificationToTokens(
          recipientTokens,
          recipientNotificationTitle,
          recipientNotificationBody,
          {
            donationId,
            type: notificationType,
            link: recipientLink,
            userId: recipientId,
            relatedEntityId: donationId,
            relatedEntityType: 'donation'
          }
        );
        logger.info(`Notification sent to recipient ${recipientId} for status change to ${newStatus}.`);
      }
    }
    
    // Create in-app notifications in Firestore
    // For donor
    await db.collection('notifications').add({
      userId: donorId,
      title: donorNotificationTitle,
      message: donorNotificationBody,
      type: notificationType,
      read: false,
      createdAt: Timestamp.now(),
      link: donorLink,
      relatedEntityId: donationId,
      relatedEntityType: 'donation'
    });
    
    // For recipient
    if (recipientId && (newStatus === 'reserved' || newStatus === 'completed' || newStatus === 'cancelled')) {
      await db.collection('notifications').add({
        userId: recipientId,
        title: recipientNotificationTitle,
        message: recipientNotificationBody,
        type: notificationType,
        read: false,
        createdAt: Timestamp.now(),
        link: recipientLink,
        relatedEntityId: donationId,
        relatedEntityType: 'donation'
      });
    }
    
  } catch (error) {
    logger.error(`Error processing donation status update for ${donationId}:`, error);
  }
});

// Scheduled function to check for expired donations
export const checkExpiredDonations = onSchedule("every 1 hours", async (event) => {
  try {
    const now = Timestamp.now();
    
    // Query for active donations that have expired
    const expiredDonationsQuery = await db.collection('donations')
      .where('status', '==', 'active')
      .where('expiryDate', '<', now)
      .get();
    
    if (expiredDonationsQuery.empty) {
      logger.info('No expired donations found.');
      return;
    }
    
    logger.info(`Found ${expiredDonationsQuery.size} expired donations.`);
    
    // Update each expired donation
    const batch = db.batch();
    const notificationPromises: Promise<any>[] = [];
    
    expiredDonationsQuery.forEach(doc => {
      const donationData = doc.data();
      
      // Update donation status
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: now
      });
      
      // Create notification for donor
      notificationPromises.push(
        db.collection('notifications').add({
          userId: donationData.donorId,
          title: 'Donation Expired',
          message: `Your donation "${donationData.title}" has expired.`,
          type: 'warning',
          read: false,
          createdAt: now,
          link: `/donor/donations/${doc.id}`,
          relatedEntityId: doc.id,
          relatedEntityType: 'donation'
        })
      );
      
      // Send push notification to donor
      notificationPromises.push(
        getUserFcmTokens(donationData.donorId).then(tokens => {
          if (tokens.length > 0) {
            return sendNotificationToTokens(
              tokens,
              'Donation Expired',
              `Your donation "${donationData.title}" has expired.`,
              {
                donationId: doc.id,
                type: 'warning',
                link: `/donor/donations/${doc.id}`,
                userId: donationData.donorId,
                relatedEntityId: doc.id,
                relatedEntityType: 'donation'
              }
            );
          }
          return Promise.resolve(); // Explicitly return a resolved promise if no tokens
        })
      );
    });
    
    // Commit the batch update
    await batch.commit();
    
    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);
    
    // Update analytics
    const analyticsRef = db.collection('analytics').doc('summary');
    await analyticsRef.update({
      activeDonations: FieldValue.increment(-expiredDonationsQuery.size),
      expiredDonations: FieldValue.increment(expiredDonationsQuery.size)
    });
    
    logger.info(`Successfully processed ${expiredDonationsQuery.size} expired donations.`);
  } catch (error) {
    logger.error('Error checking for expired donations:', error);
  }
});

// Function to handle image optimization when images are uploaded
export const optimizeUploadedImage = onDocumentCreated("donations/{donationId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  
  const donationData = snapshot.data();
  const donationId = event.params.donationId;
  
  // Check if donation has images
  if (!donationData.imageUrls || donationData.imageUrls.length === 0) {
    logger.info(`Donation ${donationId} has no images to optimize.`);
    return;
  }
  
  try {
    logger.info(`Processing ${donationData.imageUrls.length} images for donation ${donationId}`);
    
    // In a real implementation, you would:
    // 1. Download each image
    // 2. Resize/optimize it
    // 3. Upload the optimized version
    // 4. Update the donation with the new URLs
    
    // For now, we'll just log that we would optimize the images
    donationData.imageUrls.forEach((url: string, index: number) => {
      logger.info(`Would optimize image ${index + 1}: ${url}`);
    });
    
    logger.info(`Image optimization for donation ${donationId} would be completed.`);
  } catch (error) {
    logger.error(`Error optimizing images for donation ${donationId}:`, error);
  }
});

// Function to handle user registration and setup
export const onNewUser = onDocumentCreated("users/{userId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  
  const userData = snapshot.data();
  const userId = event.params.userId;
  
  try {
    // Update analytics
    const analyticsRef = db.collection('analytics').doc('summary');
    
    if (userData.role === 'donor') {
      await analyticsRef.update({
        totalDonors: FieldValue.increment(1)
      });
    } else if (userData.role === 'recipient') {
      await analyticsRef.update({
        totalRecipients: FieldValue.increment(1)
      });
    }
    
    // Create welcome notification
    await db.collection('notifications').add({
      userId,
      title: 'Welcome to Food Sharing Platform!',
      message: `Thank you for joining our community, ${userData.displayName || 'User'}! We're excited to have you with us.`,
      type: 'success',
      read: false,
      createdAt: Timestamp.now(),
      link: userData.role === 'donor' ? '/donor/dashboard' : '/recipient/dashboard',
    });
    
    logger.info(`New user ${userId} with role ${userData.role} has been processed.`);
  } catch (error) {
    logger.error(`Error processing new user ${userId}:`, error);
  }
});

// Function to handle notification creation and send push notifications
export const onNewNotification = onDocumentCreated("notifications/{notificationId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  
  const notificationData = snapshot.data();
  const notificationId = event.params.notificationId;
  
  // Skip if this is a system-generated notification (to avoid infinite loops)
  if (notificationData.systemGenerated) return;
  
  try {
    const userId = notificationData.userId;
    if (!userId) {
      logger.error(`Notification ${notificationId} has no userId.`);
      return;
    }
    
    // Get user's FCM tokens
    const tokens = await getUserFcmTokens(userId);
    
    if (tokens.length === 0) {
      logger.info(`User ${userId} has no FCM tokens for notification ${notificationId}.`);
      return;
    }
    
    // Send push notification
    await sendNotificationToTokens(
      tokens,
      notificationData.title,
      notificationData.message,
      {
        notificationId,
        type: notificationData.type || 'info',
        link: notificationData.link || '',
        userId,
        relatedEntityId: notificationData.relatedEntityId || '',
        relatedEntityType: notificationData.relatedEntityType || ''
      }
    );
    
    logger.info(`Push notification sent to user ${userId} for notification ${notificationId}.`);
  } catch (error) {
    logger.error(`Error sending push notification for ${notificationId}:`, error);
  }
});

// Email configuration
const createEmailTransporter = () => {
  // Configure your email service here
  // For Gmail, you would use:
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });

  // For other services like SendGrid, Mailgun, etc., configure accordingly
  // Example for SendGrid:
  // return nodemailer.createTransporter({
  //   host: 'smtp.sendgrid.net',
  //   port: 587,
  //   auth: {
  //     user: 'apikey',
  //     pass: process.env.SENDGRID_API_KEY
  //   }
  // });
};

// Function to process email queue
export const processEmailQueue = onSchedule("every 1 minutes", async (event) => {
  try {
    // Get pending emails from queue
    const emailQueueQuery = await db.collection('emailQueue')
      .where('status', '==', 'pending')
      .where('retryCount', '<', 3)
      .limit(10) // Process 10 emails at a time
      .get();

    if (emailQueueQuery.empty) {
      logger.info('No pending emails in queue.');
      return;
    }

    logger.info(`Processing ${emailQueueQuery.size} emails from queue.`);

    const transporter = createEmailTransporter();
    const batch = db.batch();

    for (const emailDoc of emailQueueQuery.docs) {
      const emailData = emailDoc.data();

      try {
        // Send email
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@fdms.com',
          to: emailData.to,
          subject: emailData.subject,
          html: emailData.htmlContent,
          text: emailData.textContent
        });

        // Mark as sent
        batch.update(emailDoc.ref, {
          status: 'sent',
          sentAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });

        logger.info(`Email sent successfully to ${emailData.to}`);
      } catch (error) {
        logger.error(`Error sending email to ${emailData.to}:`, error);

        // Increment retry count
        const newRetryCount = (emailData.retryCount || 0) + 1;
        const updateData: any = {
          retryCount: newRetryCount,
          updatedAt: Timestamp.now(),
          lastError: error.message
        };

        // Mark as failed if max retries reached
        if (newRetryCount >= 3) {
          updateData.status = 'failed';
          updateData.failedAt = Timestamp.now();
        }

        batch.update(emailDoc.ref, updateData);
      }
    }

    await batch.commit();
    logger.info('Email queue processing completed.');
  } catch (error) {
    logger.error('Error processing email queue:', error);
  }
});

// Function to send email when donation status changes
export const sendDonationStatusEmail = onDocumentUpdated("donations/{donationId}", async (event) => {
  const oldData = event.data?.before.data();
  const newData = event.data?.after.data();

  if (!oldData || !newData || oldData.status === newData.status) {
    return; // Only proceed if status has changed
  }

  const donationId = event.params.donationId;
  const oldStatus = oldData.status;
  const newStatus = newData.status;

  try {
    // Get user emails
    const donorDoc = await db.collection('users').doc(newData.donorId).get();
    const donorData = donorDoc.data();

    let recipientData = null;
    if (newData.reservedBy) {
      const recipientDoc = await db.collection('users').doc(newData.reservedBy).get();
      recipientData = recipientDoc.data();
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com';

    // Send emails based on status change
    if (newStatus === 'reserved' && donorData?.email) {
      await db.collection('emailQueue').add({
        to: donorData.email,
        subject: `Your donation "${newData.title}" has been reserved`,
        templateId: 'DONATION_RESERVED',
        variables: {
          donorName: donorData.displayName || 'Donor',
          donationTitle: newData.title,
          quantity: newData.quantity.toString(),
          quantityUnit: newData.quantityUnit,
          category: newData.category,
          recipientName: recipientData?.displayName || 'Recipient',
          reservedDate: new Date().toLocaleDateString(),
          donationUrl: `${baseUrl}/donor/donations/${donationId}`
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        retryCount: 0,
        maxRetries: 3
      });
    }

    if (newStatus === 'reserved' && recipientData?.email) {
      await db.collection('emailQueue').add({
        to: recipientData.email,
        subject: `Reservation confirmed for "${newData.title}"`,
        templateId: 'RESERVATION_CONFIRMATION',
        variables: {
          recipientName: recipientData.displayName || 'Recipient',
          donationTitle: newData.title,
          quantity: newData.quantity.toString(),
          quantityUnit: newData.quantityUnit,
          donorName: donorData?.displayName || 'Donor',
          pickupAddress: newData.pickupAddress?.street || 'Address not provided',
          pickupInstructions: newData.pickupInstructions || 'No special instructions',
          expiryDate: new Date(newData.expiryDate.toDate()).toLocaleDateString(),
          donationUrl: `${baseUrl}/recipient/donations/${donationId}`
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        retryCount: 0,
        maxRetries: 3
      });
    }

    if (newStatus === 'completed' && donorData?.email) {
      await db.collection('emailQueue').add({
        to: donorData.email,
        subject: `Your donation "${newData.title}" has been completed`,
        templateId: 'DONATION_COMPLETED',
        variables: {
          donorName: donorData.displayName || 'Donor',
          donationTitle: newData.title,
          quantity: newData.quantity.toString(),
          quantityUnit: newData.quantityUnit,
          category: newData.category,
          recipientName: recipientData?.displayName || 'Recipient',
          completedDate: new Date().toLocaleDateString(),
          dashboardUrl: `${baseUrl}/donor/dashboard`
        },
        status: 'pending',
        createdAt: Timestamp.now(),
        retryCount: 0,
        maxRetries: 3
      });
    }

    logger.info(`Email notifications queued for donation ${donationId} status change to ${newStatus}`);
  } catch (error) {
    logger.error(`Error queuing email notifications for donation ${donationId}:`, error);
  }
});

// Callable function to delete a user account
export const deleteUserAccount = onCall(async (request) => {
  // Destructure data and auth from the request object for v2 onCall
  const data = request.data;
  const context = request.auth;

  logger.info("deleteUserAccount function called", {data, authContextUid: context?.uid});

  // 1. Authentication: Check if the caller is an admin
  // Roles are custom claims, ensure they are set on the user's token
  if (!context || context.token.role !== "admin") {
    logger.error("Unauthorized attempt to delete user:", {
      uid: context?.uid,
      role: context?.token.role,
      targetUid: data.userIdToDelete,
    });
    throw new HttpsError("unauthenticated", "Permission denied. Only admins can delete users.");
  }

  const userIdToDelete = data.userIdToDelete;

  // 2. Validate input
  if (!userIdToDelete || typeof userIdToDelete !== "string") {
    logger.error("Invalid or missing userIdToDelete in request data.", {userIdToDelete});
    throw new HttpsError("invalid-argument", "The function must be called with a valid \"userIdToDelete\" string argument.");
  }

  try {
    logger.info(`Attempting to delete user: ${userIdToDelete}`);

    // 3. Delete from Firebase Authentication
    await admin.auth().deleteUser(userIdToDelete);
    logger.info(`Successfully deleted user ${userIdToDelete} from Firebase Authentication.`);

    // 4. Delete from Firestore 'users' collection
    await db.collection("users").doc(userIdToDelete).delete();
    logger.info(`Successfully deleted user ${userIdToDelete} from Firestore 'users' collection.`);

    // 5. Delete associated FCM tokens
    const fcmTokensQuery = await db.collection("fcmTokens").where("userId", "==", userIdToDelete).get();
    if (!fcmTokensQuery.empty) {
      const batch = db.batch();
      fcmTokensQuery.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      logger.info(`Deleted ${fcmTokensQuery.size} FCM tokens for user ${userIdToDelete}.`);
    } else {
      logger.info(`No FCM tokens found for user ${userIdToDelete}.`);
    }

    // 6. Consider deleting other user-associated data (e.g., donations, reservations).
    // This requires careful planning based on data relationships and retention policies.
    // Example: Delete donations made by this user (if applicable)
    // const userDonationsQuery = await db.collection("donations").where("donorId", "==", userIdToDelete).get();
    // if (!userDonationsQuery.empty) {
    //   const donationBatch = db.batch();
    //   userDonationsQuery.docs.forEach(doc => donationBatch.delete(doc.ref));
    //   await donationBatch.commit();
    //   logger.info(`Deleted ${userDonationsQuery.size} donations for user ${userIdToDelete}.`);
    // }

    return {message: `User ${userIdToDelete} successfully deleted.`};

  } catch (error: any) {
    logger.error(`Error deleting user ${userIdToDelete}:`, error);
    if (error.code === "auth/user-not-found") {
      // If user not found in Auth, it might have been already deleted or never existed.
      // We can still attempt to clean up Firestore records.
      // For this example, we'll throw an error, but this behavior can be adjusted.
      throw new HttpsError("not-found", `User ${userIdToDelete} not found in Firebase Authentication.`);
    } else if (error instanceof HttpsError) { // Re-throw HttpsError
      throw error;
    } else { // Handle other errors
      throw new HttpsError("internal", `Failed to delete user ${userIdToDelete}.`, {details: error.message});
    }
  }
});
