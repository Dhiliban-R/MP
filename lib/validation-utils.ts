'use client';

import { z } from 'zod';

/**
 * Comprehensive validation utilities for forms and user input
 */

// Email validation with comprehensive checks
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .refine(
    (email) => {
      // Additional email validation rules
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    },
    'Please enter a valid email address'
  );

// Password validation with strength requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password is too long')
  .refine(
    (password) => /[A-Z]/.test(password),
    'Password must contain at least one uppercase letter'
  )
  .refine(
    (password) => /[a-z]/.test(password),
    'Password must contain at least one lowercase letter'
  )
  .refine(
    (password) => /\d/.test(password),
    'Password must contain at least one number'
  )
  .refine(
    (password) => /[!@#$%^&*(),.?":{}|<>]/.test(password),
    'Password must contain at least one special character'
  );

// Phone number validation
export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .refine(
    (phone) => {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    },
    'Please enter a valid phone number'
  );

// Name validation
export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters long')
  .max(50, 'Name is too long')
  .refine(
    (name) => /^[a-zA-Z\s\-'\.]+$/.test(name),
    'Name can only contain letters, spaces, hyphens, apostrophes, and periods'
  );

// Organization name validation
export const organizationSchema = z
  .string()
  .min(2, 'Organization name must be at least 2 characters long')
  .max(100, 'Organization name is too long')
  .refine(
    (name) => /^[a-zA-Z0-9\s\-'\.&,]+$/.test(name),
    'Organization name contains invalid characters'
  );

// Address validation
export const addressSchema = z.object({
  street: z.string().min(5, 'Street address must be at least 5 characters long'),
  city: z.string().min(2, 'City must be at least 2 characters long'),
  state: z.string().min(2, 'State must be at least 2 characters long'),
  zipCode: z.string().refine(
    (zip) => /^\d{5}(-\d{4})?$/.test(zip),
    'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)'
  ),
  country: z.string().min(2, 'Country is required')
});

// Donation form validation
export const donationSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long').max(100, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters long').max(500, 'Description is too long'),
  category: z.enum(['fresh-produce', 'bakery', 'prepared-food', 'canned-goods', 'dairy', 'other'], {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10000, 'Quantity is too large'),
  quantityUnit: z.string().min(1, 'Quantity unit is required'),
  expiryDate: z.date().refine(
    (date) => date > new Date(),
    'Expiry date must be in the future'
  ),
  pickupInstructions: z.string().max(300, 'Pickup instructions are too long').optional(),
  allergens: z.array(z.string()).optional(),
  dietaryInfo: z.array(z.string()).optional()
});

// Real-time validation helper
export function createRealTimeValidator<T>(schema: z.ZodSchema<T>) {
  return {
    validate: (data: unknown): { success: boolean; errors: Record<string, string>; data?: T } => {
      try {
        const result = schema.parse(data);
        return { success: true, errors: {}, data: result };
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors: Record<string, string> = {};
          error.errors.forEach((err) => {
            const path = err.path.join('.');
            errors[path] = err.message;
          });
          return { success: false, errors };
        }
        return { success: false, errors: { general: 'Validation failed' } };
      }
    },
    
    validateField: (fieldName: string, value: unknown): { isValid: boolean; error?: string } => {
      try {
        // Extract field schema if possible
        const fieldSchema = (schema as any).shape?.[fieldName];
        if (fieldSchema) {
          fieldSchema.parse(value);
          return { isValid: true };
        }
        return { isValid: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return { isValid: false, error: error.errors[0]?.message };
        }
        return { isValid: false, error: 'Invalid value' };
      }
    }
  };
}

// Password strength checker
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  if (password.length >= 12) score += 1;

  return {
    score,
    feedback,
    isStrong: score >= 4
  };
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

// File validation
export function validateFile(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    maxFiles?: number;
  } = {}
): { isValid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;

  if (file.size > maxSize) {
    return { isValid: false, error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` };
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
  }

  return { isValid: true };
}

// Form validation schemas export
export const validationSchemas = {
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  name: nameSchema,
  organization: organizationSchema,
  address: addressSchema,
  donation: donationSchema
};
