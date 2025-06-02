'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Users, Leaf, Award } from 'lucide-react';

const AboutPage = () => {
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
          About Food Donation Management System
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Connecting surplus food with those who need it most, reducing waste and fighting hunger in our communities.
        </p>
        <div className="relative h-[400px] w-full rounded-xl overflow-hidden shadow-xl mb-8">
          <Image
            src="/images/about-hero.svg"
            alt="Food donation volunteers"
            fill
            style={{ objectFit: 'cover' }}
            priority
            className="hover:scale-105 transition-transform duration-500"
          />
        </div>
      </motion.section>

      {/* Our Mission */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-16"
      >
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-4 text-green-600">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-4">
              At FDMS, we believe that no good food should go to waste while people go hungry. Our mission is to create an efficient and accessible platform that connects food donors with recipients, making it easy to share surplus food with those who need it most.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              We're committed to reducing food waste, fighting hunger, and building stronger communities through the power of sharing and technology.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                <Heart size={20} className="text-red-500" />
                <span className="font-medium">Fighting Hunger</span>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                <Leaf size={20} className="text-green-500" />
                <span className="font-medium">Reducing Waste</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full">
                <Users size={20} className="text-blue-500" />
                <span className="font-medium">Building Community</span>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 relative h-[350px] rounded-xl overflow-hidden shadow-lg">
            <Image
              src="/images/mission.svg"
              alt="Food donation mission"
              fill
              style={{ objectFit: 'cover' }}
              className="hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </motion.section>

      {/* Our Vision */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-16"
      >
        <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-4 text-blue-600">Our Vision</h2>
            <p className="text-lg text-gray-700 mb-4">
              We envision a world where no food goes to waste and everyone has access to nutritious meals. By providing a seamless and transparent platform for food donation, we aim to minimize environmental impact, support local communities, and address food insecurity.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Our goal is to create a global network of food sharing that transforms how we think about surplus food - not as waste, but as a valuable resource that can nourish people and communities.
            </p>
            <p className="text-lg text-gray-700 mb-6">
              Through technology and community engagement, we're working toward a future where food waste is eliminated and hunger is a thing of the past.
            </p>
            <Button asChild>
              <Link href="/how-it-works">
                Learn How It Works <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="md:w-1/2 relative h-[350px] rounded-xl overflow-hidden shadow-lg">
            <Image 
              src="/images/vision.jpg" 
              alt="Our vision" 
              fill
              style={{ objectFit: 'cover' }}
              className="hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </motion.section>

      {/* Impact */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">Our Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-green-600">10K+</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Meals Provided</h3>
              <p className="text-gray-600">
                Over ten thousand meals have been shared through our platform, feeding those in need.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-blue-600">5T</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Food Waste Saved</h3>
              <p className="text-gray-600">
                Five tons of perfectly good food diverted from landfills to people's plates.
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-amber-600">500+</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Active Donors</h3>
              <p className="text-gray-600">
                A growing community of restaurants, grocers, and individuals sharing surplus food.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.section>

      {/* Team */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mb-16"
      >
        <h2 className="text-3xl font-bold mb-8 text-center">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              name: "Kirupa Shankar K.M",
              role: "Founder & CEO",
              image: "/images/team-1.svg",
              bio: "Former food bank director with 10+ years in nonprofit management"
            },
            {
              name: "Dhiliban Raja",
              role: "CTO",
              image: "/images/team-2.svg",
              bio: "Tech entrepreneur with a passion for social impact solutions"
            },
            {
              name: "Yashwand Velmurugan",
              role: "Community Director",
              image: "/images/team-3.svg",
              bio: "Community organizer and food justice advocate"
            },
            {
              name: "Ashwin R",
              role: "Operations Manager",
              image: "/images/team-4.svg",
              bio: "Supply chain expert with experience in food distribution"
            }
          ].map((member, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-[200px]">
                <Image 
                  src={member.image} 
                  alt={member.name} 
                  fill
                  style={{ objectFit: 'cover' }}
                  className="hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardContent className="pt-4">
                <h3 className="text-lg font-semibold">{member.name}</h3>
                <p className="text-sm text-green-600 mb-2">{member.role}</p>
                <p className="text-sm text-gray-600">{member.bio}</p>
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
        transition={{ duration: 0.5, delay: 0.7 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 md:p-12 text-center"
      >
        <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8">
          Whether you're a restaurant with surplus food, a nonprofit serving those in need, or an individual who wants to make a difference, there's a place for you in our community.
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

export default AboutPage;