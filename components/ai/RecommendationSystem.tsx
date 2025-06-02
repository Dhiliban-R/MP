import React from 'react';

export default function RecommendationSystem() {
  return (
    <div style={{ background: 'var(--card)', borderRadius: 8, padding: 24, marginTop: 32 }}>
      <h2 style={{ color: 'hsl(var(--primary))' }}>AI Recommendations</h2>
      <div style={{ marginTop: 16, color: 'hsl(var(--muted-foreground))' }}>
        [AI Recommendation System Placeholder]<br />
        Personalized donation suggestions will appear here based on user history and preferences.
      </div>
    </div>
  );
}
