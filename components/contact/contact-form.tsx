"use client";

import React, { useState } from "react";
import { Input, Textarea } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const ContactForm = () => {
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    subject: "", 
    inquiryType: "",
    message: "" 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, inquiryType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormStatus({ type: null, message: "" });

    // Simulate API call with a delay
    setTimeout(() => {
      try {
        // In a real app, this would be an actual API call
        // const response = await fetch("/api/contact", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(formData),
        // });

        // if (response.ok) {
        setFormStatus({ 
          type: 'success', 
          message: "Your message has been sent successfully! Our team will get back to you soon." 
        });
        setFormData({ name: "", email: "", subject: "", inquiryType: "", message: "" });
        // } else {
        //   throw new Error("Failed to send message.");
        // }
      } catch (error) {
        console.error(error);
        setFormStatus({ 
          type: 'error', 
          message: "An error occurred while sending your message. Please try again later." 
        });
      } finally {
        setIsSubmitting(false);
      }
    }, 1500);
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {formStatus.type === 'success' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            {formStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {formStatus.type === 'error' && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">
            {formStatus.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-gray-700">
            Subject <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
            placeholder="How can we help you?"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="inquiryType" className="text-gray-700">
            Inquiry Type <span className="text-red-500">*</span>
          </Label>
          <Select value={formData.inquiryType} onValueChange={handleSelectChange} required>
            <SelectTrigger id="inquiryType" className="w-full rounded-md border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all">
              <SelectValue placeholder="Select an inquiry type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Inquiry</SelectItem>
              <SelectItem value="support">Technical Support</SelectItem>
              <SelectItem value="donation">Donation Question</SelectItem>
              <SelectItem value="partnership">Partnership Opportunity</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-gray-700">
          Message <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={handleChange}
          rows={6}
          className="w-full rounded-md border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200 transition-all"
          placeholder="Please provide details about your inquiry..."
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="text-red-500">*</span> Required fields
        </p>
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Message"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ContactForm;
