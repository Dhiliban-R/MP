'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, FileText, AlertTriangle, ShieldCheck, Scale, Users, Clock } from 'lucide-react';

const TermsPage = () => {
  const lastUpdated = "June 15, 2023";

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Terms of Service</h1>
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
              Please read these Terms of Service carefully before using the FDMS platform. By accessing or using our platform, you agree to be bound by these terms. If you do not agree with any part of these terms, you may not use our services.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                FDMS ("we," "us," or "our") provides its services (described below) to you ("you" or "user") subject to the following Terms of Service ("TOS"), which may be updated by us from time to time. We will notify you of any material changes by posting the new Terms of Service on the Site and/or by sending you an email.
              </p>
              <p className="text-gray-700">
                By using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you are using the platform on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms of Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                2. Description of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                FDMS is a platform that connects food donors with recipients in need, facilitating the donation of surplus food. We provide tools for listing donations, browsing available food, matching donors with recipients, and coordinating pickups and deliveries.
              </p>
              <p className="text-gray-700">
                Our services include but are not limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Account creation and management for donors, recipients, and volunteers</li>
                <li>Listing and browsing of available food donations</li>
                <li>Messaging and coordination tools for arranging pickups</li>
                <li>Location-based search and mapping features</li>
                <li>Notification systems for donation opportunities and updates</li>
                <li>Impact tracking and reporting tools</li>
              </ul>
              <p className="text-gray-700">
                We reserve the right to modify, suspend, or discontinue any part of our services at any time, with or without notice to you.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                3. User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="account">
                  <AccordionTrigger className="text-lg font-medium">Account Responsibilities</AccordionTrigger>
                  <AccordionContent className="text-gray-700 space-y-2">
                    <p>You are responsible for maintaining the confidentiality of your account information, including your password, and for all activity that occurs under your account.</p>
                    <p>You agree to notify us immediately of any unauthorized use of your account or any other breach of security.</p>
                    <p>You must provide accurate, current, and complete information during the registration process and keep your account information updated.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="donor">
                  <AccordionTrigger className="text-lg font-medium">Donor Responsibilities</AccordionTrigger>
                  <AccordionContent className="text-gray-700 space-y-2">
                    <p>Donors are responsible for ensuring that all donated food is safe, edible, and meets all applicable health and safety standards.</p>
                    <p>Donors must provide accurate descriptions of donated items, including quantity, type, expiration dates, and any allergen information.</p>
                    <p>Donors must comply with all local, state, and federal regulations regarding food donation.</p>
                    <p>Donors are responsible for being available during the agreed-upon pickup times or providing timely notice if circumstances change.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="recipient">
                  <AccordionTrigger className="text-lg font-medium">Recipient Responsibilities</AccordionTrigger>
                  <AccordionContent className="text-gray-700 space-y-2">
                    <p>Recipients are responsible for properly inspecting, handling, storing, and distributing donated food.</p>
                    <p>Recipients must arrive at pickup locations at the agreed-upon times.</p>
                    <p>Recipients must use donated food for its intended purpose and not for resale or commercial purposes.</p>
                    <p>Recipients must comply with all local, state, and federal regulations regarding food handling and distribution.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="content">
                  <AccordionTrigger className="text-lg font-medium">Content Responsibilities</AccordionTrigger>
                  <AccordionContent className="text-gray-700 space-y-2">
                    <p>You are solely responsible for all content that you upload, post, email, transmit, or otherwise make available via our platform.</p>
                    <p>You agree not to post content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, invasive of another's privacy, or otherwise objectionable.</p>
                    <p>We reserve the right to remove any content that violates these terms or that we find objectionable for any reason.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                4. Disclaimers and Limitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="disclaimer">
                  <AccordionTrigger className="text-lg font-medium">Disclaimer of Warranty</AccordionTrigger>
                  <AccordionContent className="text-gray-700 space-y-2">
                    <p className="font-medium">THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.</p>
                    <p>We do not guarantee that:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>The services will meet your specific requirements</li>
                      <li>The services will be uninterrupted, timely, secure, or error-free</li>
                      <li>The results obtained from using the services will be accurate or reliable</li>
                      <li>Any errors in the services will be corrected</li>
                    </ul>
                    <p>We specifically disclaim any implied warranties of title, merchantability, fitness for a particular purpose, and non-infringement.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="liability">
                  <AccordionTrigger className="text-lg font-medium">Limitation of Liability</AccordionTrigger>
                  <AccordionContent className="text-gray-700 space-y-2">
                    <p className="font-medium">IN NO EVENT SHALL FDMS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</p>
                    <p>This includes, but is not limited to:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Damages for loss of profits, goodwill, use, data, or other intangible losses</li>
                      <li>Damages resulting from food safety issues or foodborne illness</li>
                      <li>Damages related to the conduct of third parties using our platform</li>
                      <li>Damages related to service interruptions or platform errors</li>
                    </ul>
                    <p>Our liability to you for any cause whatsoever and regardless of the form of the action will at all times be limited to the amount paid, if any, by you to us for the services during the term of your use of the platform.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="indemnification">
                  <AccordionTrigger className="text-lg font-medium">Indemnification</AccordionTrigger>
                  <AccordionContent className="text-gray-700 space-y-2">
                    <p>You agree to indemnify, defend, and hold harmless FDMS, its officers, directors, employees, agents, and third parties from and against all losses, expenses, damages, and costs, including reasonable attorneys' fees, resulting from:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>Your violation of these Terms of Service</li>
                      <li>Your violation of any rights of another</li>
                      <li>Your violation of any applicable laws, rules, or regulations</li>
                      <li>Any claim related to your content or food donations</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-red-600" />
                5. Legal Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="governing">
                  <AccordionTrigger className="text-lg font-medium">Governing Law</AccordionTrigger>
                  <AccordionContent className="text-gray-700 space-y-2">
                    <p>These Terms of Service shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of law provisions.</p>
                    <p>Any legal action or proceeding relating to your access to or use of the services shall be instituted in a state or federal court in New York County, New York, and you agree to submit to the personal jurisdiction of such courts.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="disputes">
                  <AccordionTrigger className="text-lg font-medium">Dispute Resolution</AccordionTrigger>
                  <AccordionContent className="text-gray-700 space-y-2">
                    <p>Any dispute arising out of or relating to these Terms of Service shall first be attempted to be resolved through good faith negotiations between the parties.</p>
                    <p>If such negotiations fail, any controversy or claim arising out of or relating to these Terms of Service shall be settled by arbitration in accordance with the rules of the American Arbitration Association.</p>
                    <p>The arbitration shall be conducted in New York, New York, and the judgment on the award rendered by the arbitrator(s) may be entered in any court having jurisdiction thereof.</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="severability">
                  <AccordionTrigger className="text-lg font-medium">Severability</AccordionTrigger>
                  <AccordionContent className="text-gray-700 space-y-2">
                    <p>If any provision of these Terms of Service is found to be invalid or unenforceable, the remaining provisions shall be enforced to the maximum extent possible, and the remaining Terms of Service shall remain in full force and effect.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                6. Changes to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Posting a notice on our website</li>
                <li>Sending an email to the address associated with your account</li>
                <li>Providing a notification within the platform</li>
              </ul>
              <p className="text-gray-700">
                Your continued use of our platform after any such changes constitutes your acceptance of the new Terms of Service. If you do not agree to the revised terms, you must stop using our services.
              </p>
              <p className="text-gray-700">
                It is your responsibility to check our website periodically for changes to these Terms of Service.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center space-y-4 mt-12">
          <p className="text-gray-700 text-center max-w-2xl">
            If you have any questions about these Terms of Service, please contact us at <span className="font-medium">legal@fdms.com</span> or through our Contact page.
          </p>
          <Button asChild>
            <Link href="/contact">
              Contact Us With Questions
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsPage;