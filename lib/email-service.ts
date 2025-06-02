import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
}

export interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  templateId?: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  error?: string;
  createdAt: Date;
}

/**
 * Email templates for different notification types
 */
export const EMAIL_TEMPLATES = {
  DONATION_RESERVED: {
    id: 'donation-reserved',
    name: 'Donation Reserved',
    subject: 'Your donation "{{donationTitle}}" has been reserved',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #28a745; margin: 0;">Food Donation Management System</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333;">Great news! Your donation has been reserved</h2>
          
          <p>Hello {{donorName}},</p>
          
          <p>We're excited to let you know that your donation <strong>"{{donationTitle}}"</strong> has been reserved by {{recipientName}}.</p>
          
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Donation Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Title:</strong> {{donationTitle}}</li>
              <li><strong>Quantity:</strong> {{quantity}} {{quantityUnit}}</li>
              <li><strong>Category:</strong> {{category}}</li>
              <li><strong>Reserved by:</strong> {{recipientName}}</li>
              <li><strong>Reserved on:</strong> {{reservedDate}}</li>
            </ul>
          </div>
          
          <p>The recipient will contact you soon to arrange pickup. If you have any questions, please don't hesitate to reach out.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{donationUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Donation Details</a>
          </div>
          
          <p>Thank you for making a difference in your community!</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>This is an automated message from the Food Donation Management System.</p>
          <p>If you no longer wish to receive these notifications, you can update your preferences in your account settings.</p>
        </div>
      </div>
    `,
    textContent: `
Hello {{donorName}},

Great news! Your donation "{{donationTitle}}" has been reserved by {{recipientName}}.

Donation Details:
- Title: {{donationTitle}}
- Quantity: {{quantity}} {{quantityUnit}}
- Category: {{category}}
- Reserved by: {{recipientName}}
- Reserved on: {{reservedDate}}

The recipient will contact you soon to arrange pickup. If you have any questions, please don't hesitate to reach out.

View donation details: {{donationUrl}}

Thank you for making a difference in your community!

---
This is an automated message from the Food Donation Management System.
    `,
    variables: ['donorName', 'donationTitle', 'quantity', 'quantityUnit', 'category', 'recipientName', 'reservedDate', 'donationUrl']
  },

  DONATION_COMPLETED: {
    id: 'donation-completed',
    name: 'Donation Completed',
    subject: 'Your donation "{{donationTitle}}" has been completed',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #28a745; margin: 0;">Food Donation Management System</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #28a745;">🎉 Donation Successfully Completed!</h2>
          
          <p>Hello {{donorName}},</p>
          
          <p>Wonderful news! Your donation <strong>"{{donationTitle}}"</strong> has been successfully picked up by {{recipientName}}.</p>
          
          <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="margin-top: 0; color: #155724;">Impact Summary:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #155724;">
              <li>You donated {{quantity}} {{quantityUnit}} of {{category}}</li>
              <li>Completed on: {{completedDate}}</li>
              <li>This donation helped feed people in your community</li>
            </ul>
          </div>
          
          <p>Your generosity makes a real difference! Thank you for contributing to reducing food waste and helping those in need.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Your Dashboard</a>
          </div>
          
          <p>We hope you'll consider making more donations in the future. Every contribution counts!</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>This is an automated message from the Food Donation Management System.</p>
        </div>
      </div>
    `,
    textContent: `
Hello {{donorName}},

Wonderful news! Your donation "{{donationTitle}}" has been successfully picked up by {{recipientName}}.

Impact Summary:
- You donated {{quantity}} {{quantityUnit}} of {{category}}
- Completed on: {{completedDate}}
- This donation helped feed people in your community

Your generosity makes a real difference! Thank you for contributing to reducing food waste and helping those in need.

View your dashboard: {{dashboardUrl}}

We hope you'll consider making more donations in the future. Every contribution counts!

---
This is an automated message from the Food Donation Management System.
    `,
    variables: ['donorName', 'donationTitle', 'quantity', 'quantityUnit', 'category', 'recipientName', 'completedDate', 'dashboardUrl']
  },

  RESERVATION_CONFIRMATION: {
    id: 'reservation-confirmation',
    name: 'Reservation Confirmation',
    subject: 'Reservation confirmed for "{{donationTitle}}"',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #007bff; margin: 0;">Food Donation Management System</h1>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #007bff;">Reservation Confirmed!</h2>
          
          <p>Hello {{recipientName}},</p>
          
          <p>Your reservation for <strong>"{{donationTitle}}"</strong> has been confirmed!</p>
          
          <div style="background-color: #cce5ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #004085;">Pickup Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Donation:</strong> {{donationTitle}}</li>
              <li><strong>Quantity:</strong> {{quantity}} {{quantityUnit}}</li>
              <li><strong>Donor:</strong> {{donorName}}</li>
              <li><strong>Pickup Address:</strong> {{pickupAddress}}</li>
              <li><strong>Instructions:</strong> {{pickupInstructions}}</li>
              <li><strong>Expires:</strong> {{expiryDate}}</li>
            </ul>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Contact the donor to arrange a convenient pickup time</li>
            <li>Arrive at the specified pickup location</li>
            <li>Mark the donation as completed after pickup</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{donationUrl}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Donation Details</a>
          </div>
          
          <p>Thank you for helping reduce food waste in your community!</p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
          <p>This is an automated message from the Food Donation Management System.</p>
        </div>
      </div>
    `,
    textContent: `
Hello {{recipientName}},

Your reservation for "{{donationTitle}}" has been confirmed!

Pickup Details:
- Donation: {{donationTitle}}
- Quantity: {{quantity}} {{quantityUnit}}
- Donor: {{donorName}}
- Pickup Address: {{pickupAddress}}
- Instructions: {{pickupInstructions}}
- Expires: {{expiryDate}}

Next Steps:
1. Contact the donor to arrange a convenient pickup time
2. Arrive at the specified pickup location
3. Mark the donation as completed after pickup

View donation details: {{donationUrl}}

Thank you for helping reduce food waste in your community!

---
This is an automated message from the Food Donation Management System.
    `,
    variables: ['recipientName', 'donationTitle', 'quantity', 'quantityUnit', 'donorName', 'pickupAddress', 'pickupInstructions', 'expiryDate', 'donationUrl']
  }
};

/**
 * Queue an email to be sent
 */
export const queueEmail = async (emailData: EmailData): Promise<string> => {
  try {
    const emailDoc = {
      ...emailData,
      status: 'pending',
      createdAt: serverTimestamp(),
      retryCount: 0,
      maxRetries: 3
    };

    const docRef = await addDoc(collection(db, 'emailQueue'), emailDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error queuing email:', error);
    throw error;
  }
};

/**
 * Send email using template
 */
export const sendTemplatedEmail = async (
  templateId: string,
  to: string,
  variables: Record<string, string>
): Promise<string> => {
  try {
    const template = EMAIL_TEMPLATES[templateId as keyof typeof EMAIL_TEMPLATES];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Replace variables in template
    let htmlContent = template.htmlContent;
    let textContent = template.textContent;
    let subject = template.subject;

    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
    });

    return await queueEmail({
      to,
      subject,
      htmlContent,
      textContent,
      templateId,
      variables
    });
  } catch (error) {
    console.error('Error sending templated email:', error);
    throw error;
  }
};

/**
 * Send donation notification emails
 */
export const sendDonationNotificationEmail = async (
  type: 'reserved' | 'completed' | 'reservation_confirmation',
  donationData: any,
  recipientEmail: string,
  donorEmail?: string
): Promise<void> => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    if (type === 'reserved' && donorEmail) {
      await sendTemplatedEmail('DONATION_RESERVED', donorEmail, {
        donorName: donationData.donorName,
        donationTitle: donationData.title,
        quantity: donationData.quantity.toString(),
        quantityUnit: donationData.quantityUnit,
        category: donationData.category,
        recipientName: donationData.recipientName,
        reservedDate: new Date().toLocaleDateString(),
        donationUrl: `${baseUrl}/donor/donations/${donationData.id}`
      });
    }

    if (type === 'completed' && donorEmail) {
      await sendTemplatedEmail('DONATION_COMPLETED', donorEmail, {
        donorName: donationData.donorName,
        donationTitle: donationData.title,
        quantity: donationData.quantity.toString(),
        quantityUnit: donationData.quantityUnit,
        category: donationData.category,
        recipientName: donationData.recipientName,
        completedDate: new Date().toLocaleDateString(),
        dashboardUrl: `${baseUrl}/donor/dashboard`
      });
    }

    if (type === 'reservation_confirmation') {
      await sendTemplatedEmail('RESERVATION_CONFIRMATION', recipientEmail, {
        recipientName: donationData.recipientName,
        donationTitle: donationData.title,
        quantity: donationData.quantity.toString(),
        quantityUnit: donationData.quantityUnit,
        donorName: donationData.donorName,
        pickupAddress: donationData.pickupAddress?.street || 'Address not provided',
        pickupInstructions: donationData.pickupInstructions || 'No special instructions',
        expiryDate: new Date(donationData.expiryDate).toLocaleDateString(),
        donationUrl: `${baseUrl}/recipient/donations/${donationData.id}`
      });
    }
  } catch (error) {
    console.error('Error sending donation notification email:', error);
    throw error;
  }
};
