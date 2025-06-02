#!/usr/bin/env node

/**
 * Script to clear rate limiting data for development
 * This helps when you get rate limited during development
 */

const http = require('http');

async function clearRateLimits() {
  console.log('🧹 Clearing rate limit data...');

  try {
    // Try to call the development API endpoint
    const postData = JSON.stringify({});

    const options = {
      hostname: 'localhost',
      port: 3001, // Adjust port if needed
      path: '/api/dev/clear-rate-limits',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('✅ Rate limit data cleared successfully!');
            console.log(`📊 Stats: ${JSON.stringify(response.stats, null, 2)}`);
          } else {
            console.log('⚠️  Failed to clear rate limits:', response.error);
          }
        } catch (error) {
          console.log('⚠️  Error parsing response:', error.message);
        }
      });
    });

    req.on('error', (error) => {
      console.log('⚠️  Could not connect to development server:', error.message);
      console.log('💡 Make sure your development server is running on port 3001');
      console.log('💡 Alternatively, restart your development server to clear rate limits');
    });

    req.write(postData);
    req.end();

  } catch (error) {
    console.log('⚠️  Error:', error.message);
    console.log('💡 Try restarting your development server to clear rate limits');
  }
}

clearRateLimits();
