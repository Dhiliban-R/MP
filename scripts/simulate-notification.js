const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

async function simulateNotification() {
  try {
    const notification = {
      title: 'Test Notification',
      body: 'This is a test notification.',
      topic: 'test-topic',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('notifications').add(notification);
    console.log('Test notification added successfully.');
  } catch (error) {
    console.error('Error adding test notification:', error);
  }
}

simulateNotification();
