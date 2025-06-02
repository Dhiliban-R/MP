'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ContactForm from "@/components/contact/contact-form";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageSquare, HelpCircle } from 'lucide-react';

const ContactPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-green-600">Get in Touch</h2>
            <p className="text-lg text-gray-700 mb-8">
              We'd love to hear from you! Whether you have a question about our platform, need help with your account, or want to provide feedback, our team is here to assist you.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Email Us</h3>
                  <p className="text-gray-600 mb-1">For general inquiries:</p>
                  <p className="text-gray-800 font-medium">info@fdms.com</p>
                  <p className="text-gray-600 mb-1 mt-2">For support:</p>
                  <p className="text-gray-800 font-medium">support@fdms.com</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Call Us</h3>
                  <p className="text-gray-600 mb-1">Customer Support:</p>
                  <p className="text-gray-800 font-medium">(555) 123-4567</p>
                  <p className="text-gray-600 mb-1 mt-2">Partnerships:</p>
                  <p className="text-gray-800 font-medium">(555) 987-6543</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Visit Us</h3>
                  <p className="text-gray-600 mb-1">Our Headquarters:</p>
                  <p className="text-gray-800 font-medium">
                    123 Food Sharing Street<br />
                    Suite 456<br />
                    New York, NY 10001
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Hours of Operation</h3>
                  <p className="text-gray-600 mb-1">Customer Support:</p>
                  <p className="text-gray-800 font-medium">
                    Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                    Saturday: 10:00 AM - 2:00 PM EST<br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative h-[300px] w-full rounded-xl overflow-hidden shadow-lg">
              <Image
                src="/images/map.svg"
                alt="Office location map"
                fill
                style={{ objectFit: 'cover' }}
                className="hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                  <CardTitle>Send Us a Message</CardTitle>
                </div>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                question: "How quickly will I receive a response?",
                answer: "We strive to respond to all inquiries within 24-48 hours during business days. For urgent matters, please call our customer support line."
              },
              {
                question: "Can I visit your office without an appointment?",
                answer: "We recommend scheduling an appointment before visiting our office to ensure that the appropriate team member is available to assist you."
              },
              {
                question: "How can I report a technical issue?",
                answer: "Technical issues can be reported through the contact form by selecting 'Technical Support' from the dropdown menu, or by emailing support@fdms.com with details about the issue."
              },
              {
                question: "I'm interested in partnering with FDMS. Who should I contact?",
                answer: "For partnership inquiries, please email partnerships@fdms.com or call our partnerships line at (555) 987-6543. We're always looking for organizations that share our mission."
              }
            ].map((faq, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <HelpCircle className="h-5 w-5 text-blue-600" />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8">
            Follow us on social media to stay updated on our latest news, events, and success stories. Join the conversation and be part of our mission to reduce food waste and fight hunger.
          </p>
          <div className="flex justify-center gap-6">
            {['facebook', 'twitter', 'instagram', 'linkedin'].map((platform) => (
              <Link 
                key={platform} 
                href={`https://www.${platform}.com/fdms`}
                className="bg-white p-4 rounded-full shadow-md hover:shadow-lg transition-shadow"
              >
                <Image
                  src={`/images/${platform}-icon.svg`}
                  alt={`${platform} icon`}
                  width={24}
                  height={24}
                />
              </Link>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ContactPage;