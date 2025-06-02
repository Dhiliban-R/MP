import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Updates the email verification status in Firestore
 * This is separated to avoid circular dependencies
 */
export async function updateEmailVerificationStatus(
  uid: string, 
  emailVerified: boolean
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const currentFirestoreEmailVerified = userDocSnap.data().emailVerified;
      
      if (currentFirestoreEmailVerified !== emailVerified) {
        await updateDoc(userDocRef, {
          emailVerified: emailVerified,
          // Set verificationTime if newly verified
          ...(emailVerified && !currentFirestoreEmailVerified && { 
            verificationTime: new Date().toISOString() 
          })
        });
        console.log('Firestore email verification status updated for user:', uid);
      }
    }
  } catch (error) {
    console.error('Error updating email verification status in Firestore:', error);
    throw error;
  }
}
