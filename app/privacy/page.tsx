'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Shield, Lock, Eye, FileText, Bell, Users } from 'lucide-react';

const PrivacyPage = () => {
  const lastUpdated = "June 15, 2023";

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 mb-4">Last Updated: {lastUpdated}</p>
            <p className="text-lg text-gray-700 mb-6">
              At FDMS, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </CardContent>
        </Card>

        <Tabs defaultValue="collection" className="mb-12">
          <TabsList className="grid grid-cols-6 h-auto">
            <TabsTrigger value="collection" className="flex flex-col py-3 px-2 h-auto">
              <Shield className="h-5 w-5 mb-1" />
              <span className="text-xs">Collection</span>
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex flex-col py-3 px-2 h-auto">
              <Eye className="h-5 w-5 mb-1" />
              <span className="text-xs">Usage</span>
            </TabsTrigger>
            <TabsTrigger value="disclosure" className="flex flex-col py-3 px-2 h-auto">
              <Users className="h-5 w-5 mb-1" />
              <span className="text-xs">Disclosure</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex flex-col py-3 px-2 h-auto">
              <Lock className="h-5 w-5 mb-1" />
              <span className="text-xs">Security</span>
            </TabsTrigger>
            <TabsTrigger value="cookies" className="flex flex-col py-3 px-2 h-auto">
              <FileText className="h-5 w-5 mb-1" />
              <span className="text-xs">Cookies</span>
            </TabsTrigger>
            <TabsTrigger value="choices" className="flex flex-col py-3 px-2 h-auto">
              <Bell className="h-5 w-5 mb-1" />
              <span className="text-xs">Your Choices</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Information Collection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  We collect information that you provide directly to us when you:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Register for an account</li>
                  <li>Fill out a form</li>
                  <li>Make a donation or receive a donation</li>
                  <li>Communicate with other users</li>
                  <li>Contact our support team</li>
                  <li>Respond to surveys or communications</li>
                </ul>
                
                <p className="text-gray-700 pt-4">
                  The types of information we may collect include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Personal Identifiers:</strong> Name, email address, postal address, phone number, and organization name (if applicable)</li>
                  <li><strong>Account Information:</strong> Username, password, account preferences, and user role (donor, recipient, volunteer)</li>
                  <li><strong>Profile Information:</strong> Profile picture, bio, and other information you choose to add to your profile</li>
                  <li><strong>Transaction Information:</strong> Records of donations, pickups, and other activities on the platform</li>
                  <li><strong>Location Information:</strong> With your consent, we collect precise location data to show nearby donations and facilitate pickups</li>
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, and other technical information about your device</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Information Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  We use the information we collect for various purposes, including to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Provide, maintain, and improve our platform</li>
                  <li>Process and facilitate donations and pickups</li>
                  <li>Connect donors with recipients based on location and preferences</li>
                  <li>Send notifications about donation opportunities, pickups, and platform updates</li>
                  <li>Communicate with you about your account, respond to inquiries, and provide customer support</li>
                  <li>Monitor and analyze usage patterns and trends to improve user experience</li>
                  <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                  <li>Enforce our terms of service and protect the rights, property, or safety of our users</li>
                  <li>Comply with legal obligations and respond to lawful requests from public authorities</li>
                </ul>
                
                <p className="text-gray-700 pt-4">
                  We may use aggregated or de-identified information, which cannot reasonably be used to identify you, for various purposes, including research, analysis, and improving our platform.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disclosure" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  Information Sharing and Disclosure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>With Other Users:</strong> When you create a donation or reserve a donation, certain information is shared with the other party to facilitate the transaction</li>
                  <li><strong>Service Providers:</strong> We may share information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
                  <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction</li>
                  <li><strong>Legal Requirements:</strong> We may disclose information if required to do so by law or in response to valid requests by public authorities</li>
                  <li><strong>Protection of Rights:</strong> We may disclose information when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, investigate fraud, or respond to a government request</li>
                </ul>
                
                <p className="text-gray-700 pt-4">
                  We may also share aggregated or de-identified information, which cannot reasonably be used to identify you, with third parties for research, marketing, analytics, and other purposes.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.
                </p>
                
                <p className="text-gray-700">
                  Our security measures include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Encryption of sensitive data both in transit and at rest</li>
                  <li>Regular security assessments and penetration testing</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Regular security training for our team members</li>
                  <li>Monitoring for suspicious activities and unauthorized access attempts</li>
                  <li>Data minimization practices to limit the collection of personal information</li>
                </ul>
                
                <p className="text-gray-700 pt-4">
                  We regularly review and update our security practices to enhance protection. If you have reason to believe that your interaction with us is no longer secure, please immediately notify us by contacting us at privacy@fdms.com.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cookies" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" />
                  Cookies and Tracking Technologies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  We use cookies and similar tracking technologies to track activity on our platform and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier.
                </p>
                
                <p className="text-gray-700">
                  Types of cookies we use:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Essential Cookies:</strong> Necessary for the platform to function properly</li>
                  <li><strong>Preference Cookies:</strong> Enable the platform to remember your preferences and settings</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with the platform</li>
                  <li><strong>Marketing Cookies:</strong> Used to track visitors across websites to display relevant advertisements</li>
                </ul>
                
                <p className="text-gray-700 pt-4">
                  You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.
                </p>
                
                <p className="text-gray-700 pt-4">
                  We also use third-party analytics services, such as Google Analytics, to collect information about your use of the platform, which helps us improve it. These third-party service providers may use cookies and other technologies to collect information about your use of the platform and other websites and online services.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="choices" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-green-600" />
                  Your Privacy Choices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  You have several choices regarding your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Account Information:</strong> You can update, correct, or delete your account information at any time by logging into your account settings</li>
                  <li><strong>Location Information:</strong> You can control whether we collect precise location information through your device settings</li>
                  <li><strong>Cookies:</strong> You can manage your cookie preferences through your browser settings</li>
                  <li><strong>Marketing Communications:</strong> You can opt out of receiving promotional emails by following the instructions in those emails or by adjusting your notification settings</li>
                  <li><strong>Do Not Track:</strong> We respond to Do Not Track signals. When we detect a Do Not Track signal, we disable tracking technologies used for behavioral advertising purposes</li>
                </ul>
                
                <p className="text-gray-700 pt-4">
                  <strong>Data Retention:</strong> We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
                </p>
                
                <p className="text-gray-700 pt-4">
                  <strong>Children's Privacy:</strong> Our platform is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
                </p>
                
                <p className="text-gray-700 pt-4">
                  <strong>International Data Transfers:</strong> Your information may be transferred to, and maintained on, computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ from those in your jurisdiction.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>By email: privacy@fdms.com</li>
                <li>By phone: (555) 123-4567</li>
                <li>By mail: FDMS Privacy Team, 123 Main Street, Anytown, USA 12345</li>
              </ul>
            </CardContent>
          </Card>

          <div className="flex justify-center mt-8">
            <Button asChild>
              <Link href="/contact">
                Contact Us With Privacy Questions
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPage;
