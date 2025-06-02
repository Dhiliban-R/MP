'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Utensils, Building2, Users, MapPin, Calendar, BarChart } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: "Donors List Surplus Food",
    description:
      "Businesses and individuals with surplus food can easily create a listing on our platform. They provide details such as the type of food, quantity, expiry date, and preferred pickup location.",
    icon: <Utensils className="h-6 w-6 text-green-500" />,
    image: "/images/donor-listing.jpg"
  },
  {
    number: 2,
    title: "Recipients Browse Available Donations",
    description:
      "Local charities and organizations can browse the available food donations on our platform. They can filter by location, food type, and other criteria to find donations that meet their needs.",
    icon: <Building2 className="h-6 w-6 text-blue-500" />,
    image: "/images/recipient-browsing.jpg"
  },
  {
    number: 3,
    title: "Matching and Coordination",
    description:
      "Our system intelligently matches donors with recipients based on their preferences and requirements. Once a match is made, we provide tools for coordinating the pickup and delivery of the food.",
    icon: <Users className="h-6 w-6 text-purple-500" />,
    image: "/images/matching.jpg"
  },
  {
    number: 4,
    title: "Pickup and Delivery",
    description:
      "Donors and recipients coordinate the pickup and delivery of the food. Our platform provides tools for scheduling pickups, tracking deliveries, and communicating with each other.",
    icon: <MapPin className="h-6 w-6 text-red-500" />,
    image: "/images/pickup.jpg"
  },
  {
    number: 5,
    title: "Impact Measurement",
    description:
      "We track the impact of food donations on our platform, measuring metrics such as the amount of food waste diverted from landfills, the number of meals provided, and the carbon footprint reduced.",
    icon: <BarChart className="h-6 w-6 text-amber-500" />,
    image: "/images/impact.jpg"
  },
];

const userTypes = [
  {
    id: "donors",
    title: "For Donors",
    description: "Restaurants, grocery stores, caterers, and individuals with surplus food",
    steps: [
      "Create an account and verify your identity",
      "List your surplus food with details like quantity, type, and expiry",
      "Set pickup availability and location",
      "Receive notifications when a recipient is interested",
      "Coordinate pickup and complete the donation",
      "Track your impact and receive donation receipts"
    ],
    image: "/images/donor-dashboard.jpg",
    cta: "Start Donating"
  },
  {
    id: "recipients",
    title: "For Recipients",
    description: "Food banks, shelters, community organizations, and other nonprofits",
    steps: [
      "Create an account and verify your organization",
      "Browse available donations in your area",
      "Filter by food type, quantity, and pickup location",
      "Reserve donations that meet your needs",
      "Coordinate pickup with the donor",
      "Track received donations and manage your inventory"
    ],
    image: "/images/recipient-dashboard.svg",
    cta: "Find Donations"
  },
  {
    id: "volunteers",
    title: "For Volunteers",
    description: "Individuals who want to help with transportation and logistics",
    steps: [
      "Create a volunteer account and set your availability",
      "Browse delivery opportunities in your area",
      "Sign up for deliveries that fit your schedule",
      "Receive pickup and delivery instructions",
      "Transport food from donors to recipients",
      "Track your volunteer hours and impact"
    ],
    image: "/images/volunteer-dashboard.svg",
    cta: "Become a Volunteer"
  }
];

const HowItWorksPage = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          How FDMS Works
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Our platform makes it easy to connect food donors with recipients, reducing waste and fighting hunger through a simple, efficient process.
        </p>
        <div className="relative h-[400px] w-full rounded-xl overflow-hidden shadow-xl mb-8">
          <Image 
            src="/images/how-it-works-hero.jpg" 
            alt="Food donation process" 
            fill
            style={{ objectFit: 'cover' }}
            priority
            className="hover:scale-105 transition-transform duration-500"
          />
        </div>
      </motion.section>

      {/* Process Steps */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">The FDMS Process</h2>
        <div className="grid gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 relative h-[200px] md:h-auto">
                    <Image 
                      src={step.image} 
                      alt={step.title} 
                      fill
                      style={{ objectFit: 'cover' }}
                      className="hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="md:w-2/3">
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-lg">
                        {step.number}
                      </div>
                      <div className="flex items-center gap-2">
                        {step.icon}
                        <CardTitle className="text-2xl font-semibold">{step.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg text-gray-700 leading-relaxed">{step.description}</p>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* User-specific Guides */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">How to Use FDMS</h2>
        <Tabs defaultValue="donors" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            {userTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.id} className="text-lg py-3">
                {type.title}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {userTypes.map((type) => (
            <TabsContent key={type.id} value={type.id}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="md:w-1/2">
                  <h3 className="text-2xl font-semibold mb-3">{type.title}</h3>
                  <p className="text-lg text-gray-600 mb-6">{type.description}</p>
                  
                  <div className="space-y-4 mb-8">
                    {type.steps.map((step, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <p className="text-lg text-gray-700">{step}</p>
                      </div>
                    ))}
                  </div>
                  
                  <Button size="lg" asChild>
                    <Link href="/auth/register">
                      {type.cta} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="md:w-1/2 relative h-[350px] rounded-xl overflow-hidden shadow-lg">
                  <Image 
                    src={type.image} 
                    alt={type.title} 
                    fill
                    style={{ objectFit: 'cover' }}
                    className="hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </motion.section>

      {/* FAQ Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              question: "What types of food can be donated?",
              answer: "Most types of fresh, packaged, and prepared foods can be donated, as long as they are still safe for consumption. This includes produce, dairy, baked goods, prepared meals, canned goods, and more. All food must meet safety standards and not be expired."
            },
            {
              question: "How do you ensure food safety?",
              answer: "We require donors to follow food safety guidelines and provide accurate information about the food being donated. Recipients are trained to inspect donations upon receipt and follow proper food handling procedures. Our platform also includes features for reporting any safety concerns."
            },
            {
              question: "Is there a minimum donation amount?",
              answer: "No, there is no minimum donation amount. We welcome donations of all sizes, from a few extra meals to large quantities of surplus food. Our goal is to make it easy for anyone to donate, regardless of the quantity."
            },
            {
              question: "How far in advance should I list a donation?",
              answer: "We recommend listing donations as soon as you know they will be available. For perishable items, at least 24-48 hours notice is ideal to allow recipients time to arrange pickup. For non-perishable items, longer lead times are fine."
            },
            {
              question: "Can I donate as an individual?",
              answer: "Yes! While many of our donors are businesses, we welcome individuals who have surplus food to donate. This could be from events, gardening, or simply having extra groceries that would otherwise go to waste."
            },
            {
              question: "How do I know my donation is going to a legitimate organization?",
              answer: "All recipient organizations on our platform go through a verification process to confirm their legitimacy and need for food donations. We verify nonprofit status, food handling capabilities, and other relevant credentials."
            }
          ].map((faq, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12 text-center"
      >
        <h2 className="text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8">
          Join our community today and be part of the solution to food waste and hunger. Whether you're donating food, receiving donations, or volunteering, every action counts.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/register">
              Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact">
              Contact Us
            </Link>
          </Button>
        </div>
      </motion.section>
    </div>
  );
};

export default HowItWorksPage;