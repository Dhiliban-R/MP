
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function TestAuthPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      {user ? (
        <div>
          <p className="text-green-600">✅ Auth context is working!</p>
          <p>User: {user.email}</p>
          <p>Display Name: {user.displayName || 'Not set'}</p>
        </div>
      ) : (
        <div>
          <p className="text-blue-600">ℹ️ No user logged in</p>
          <p>Auth context is working but no user is authenticated</p>
        </div>
      )}
    </div>
  );
}