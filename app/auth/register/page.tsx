'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClientWrapper } from '@/components/client-wrapper';


const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  confirmPassword: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  displayName: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  userType: z.enum(['donor', 'recipient'], {
    required_error: 'Please select whether you are a donor or recipient.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const { registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const [success, setSuccess] = useState<boolean>(false); // Add success state

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      userType: undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      await registerUser(
        values.email,
        values.password,
        values.displayName,
        values.userType as 'donor' | 'recipient' as 'donor' | 'recipient'
      );
      // Navigation is handled in the useAuth hook
      setSuccess(true); // Indicate successful registration
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.message || 'An unknown error occurred';

      if (errorMessage.includes('email-already-in-use')) {
        setError('An account with this email already exists. Please use a different email or try logging in.');
      } else if (errorMessage.includes('invalid-email')) {
        setError('Please provide a valid email address.');
      } else if (errorMessage.includes('weak-password')) {
        setError('Password should be at least 6 characters long.');
      } else if (errorMessage.includes('network-request-failed')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Registration failed. Please try again or contact support if the problem persists.');
      }
    } finally {
      setIsLoading(false);
    }
  }



  return (
    <Card className="w-full shadow-lg"
      style={{
        margin: 0,
        border: 'none',
        borderRadius: '12px'
      }}
    >
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Link 
              href="/"
              className="flex items-center gap-2 font-heading font-bold text-xl text-primary"
            >
              FDMS
            </Link>
          </div>
          <CardTitle className="text-2xl font-heading text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            Join our platform to start sharing or receiving food donations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div style={{ minHeight: (error || success) ? 'auto' : '0', overflow: 'hidden' }}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="default" className="bg-green-50 text-green-700 border-green-200 mb-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Registration successful! Please check your email to verify your account.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="you@example.com" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John Doe" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />




              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        {...field} 
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>I am a:</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-2"
                        disabled={isLoading}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="donor" id="donor" />
                          <Label htmlFor="donor" className="font-normal">
                            <span className="font-medium">Donor</span> - I want to donate food
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="recipient" id="recipient" />
                          <Label htmlFor="recipient" className="font-normal">
                            <span className="font-medium">Recipient</span> - I want to receive food donations
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </Form>


        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
  );
}