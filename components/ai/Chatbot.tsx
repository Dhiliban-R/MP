import React from 'react';

export default function Chatbot() {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
      <div style={{ background: 'var(--card)', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: 16, minWidth: 280 }}>
        <h3 style={{ color: 'hsl(var(--secondary-purple))', marginBottom: 8 }}>AI Chatbot</h3>
        <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14 }}>
          [Chatbot Placeholder]<br />
          Ask questions or get help with the platform here.
        </div>
      </div>
    </div>
  );
}
