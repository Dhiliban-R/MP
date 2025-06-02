'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
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
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ClientWrapper } from '@/components/client-wrapper';


const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

export default function LoginPage() {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      await signIn(values.email, values.password);
      // Navigation is handled in the useAuth hook
    } catch (error: any) {
      console.error('Login error:', error);
      // Extract the error message
      const errorMessage = error.message || 'An unknown error occurred';
      
      if (errorMessage.includes('Invalid email')) {
        setError('Invalid email address.');
      } else if (errorMessage.includes('Incorrect password') || errorMessage.includes('wrong password')) {
        setError('Incorrect password.');
      } else if (errorMessage.includes('User not found') || errorMessage.includes('user-not-found')) {
        setError('User not found. Please check your email or register for an account.');
      } else if (errorMessage.includes('too many requests') || errorMessage.includes('too-many-requests')) {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(
          'Invalid email or password. Please check your credentials and try again.'
        );
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
          <CardTitle className="text-2xl font-heading text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div style={{ minHeight: error ? 'auto' : '0', overflow: 'hidden' }}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>
          <div className="text-center text-sm mt-4">
            <Link href="/auth/forgot-password" className="text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-primary font-medium hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
  );
}