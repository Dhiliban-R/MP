'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPassword } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
});

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await resetPassword(values.email);
      setSuccess(true);
      form.reset();
    } catch (error: any) {
      console.error('Password reset error:', error);
      const errorMessage = error.message || 'An unknown error occurred';

      if (errorMessage.includes('user-not-found') || errorMessage.includes('auth/user-not-found')) {
        setError('No account found with that email address.');
      } else if (errorMessage.includes('invalid-email') || errorMessage.includes('auth/invalid-email')) {
        setError('Please enter a valid email address.');
      } else if (errorMessage.includes('network-request-failed') || errorMessage.includes('auth/network-request-failed')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('There was an error sending the password reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Link 
              href="/"
              className="flex items-center gap-2 font-heading font-bold text-xl text-primary"
            >
              FDMS
            </Link>
          </div>
          <CardTitle className="text-2xl font-heading text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert variant="default" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Password reset email sent. Please check your inbox and follow the instructions.
              </AlertDescription>
            </Alert>
          )}
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
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}