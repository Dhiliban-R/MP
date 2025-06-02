const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Example Cloud Function: Send Notification
exports.sendNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snapshot, context) => {
    const notification = snapshot.data();

    // Logic to send notification (e.g., Firebase Cloud Messaging)
    const payload = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
    };

    try {
      await admin.messaging().sendToTopic(notification.topic, payload);
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });
