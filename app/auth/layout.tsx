import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div
        className="w-full max-w-md"
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 2
        }}
      >
        {children}
      </div>
    </div>
  );
}