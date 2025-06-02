#!/usr/bin/env node

/**
 * Google Maps API Configuration Verification Script
 * This script verifies that Google Maps API is properly configured and accessible
 */

const https = require('https');
const fs = require('fs');

console.log('🗺️  Google Maps API Configuration Verification\n');

// Load environment variables manually
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  console.error('❌ Error reading .env.local file:', error.message);
  console.log('📝 Make sure you have a .env.local file with your Google Maps API key');
  process.exit(1);
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Check if API key is set
if (!GOOGLE_MAPS_API_KEY) {
  console.log('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in .env.local');
  console.log('\n📝 To fix this:');
  console.log('1. Get an API key from Google Cloud Console');
  console.log('2. Add it to your .env.local file:');
  console.log('   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here');
  process.exit(1);
}

if (GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here' || GOOGLE_MAPS_API_KEY === 'demo_google_maps_api_key') {
  console.log('❌ Google Maps API key appears to be a placeholder');
  console.log('📝 Please replace with your actual API key from Google Cloud Console');
  process.exit(1);
}

console.log(`✅ Google Maps API Key found: ${GOOGLE_MAPS_API_KEY.substring(0, 20)}...`);

// Required APIs to check
const requiredApis = [
  {
    name: 'Maps JavaScript API',
    endpoint: 'https://maps.googleapis.com/maps/api/js',
    params: `key=${GOOGLE_MAPS_API_KEY}&libraries=places`,
    description: 'Required for displaying interactive maps',
    expectsJavaScript: true
  },
  {
    name: 'Geocoding API',
    endpoint: 'https://maps.googleapis.com/maps/api/geocode/json',
    params: `address=New+York&key=${GOOGLE_MAPS_API_KEY}`,
    description: 'Required for converting addresses to coordinates'
  },
  {
    name: 'Places API',
    endpoint: 'https://maps.googleapis.com/maps/api/place/textsearch/json',
    params: `query=restaurant&key=${GOOGLE_MAPS_API_KEY}`,
    description: 'Required for location search and autocomplete'
  }
];

// Function to test API endpoint
function testApiEndpoint(api) {
  return new Promise((resolve) => {
    const url = `${api.endpoint}?${api.params}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          // Handle Maps JavaScript API (returns JavaScript, not JSON)
          if (api.expectsJavaScript) {
            if (data.includes('google.maps') || data.includes('initMap') || data.length > 1000) {
              console.log(`✅ ${api.name}: Working correctly`);
              resolve({ success: true, api: api.name });
            } else if (data.includes('REQUEST_DENIED') || data.includes('API_KEY_INVALID')) {
              console.log(`❌ ${api.name}: Access denied - API may not be enabled or key is invalid`);
              resolve({ success: false, api: api.name, error: 'ACCESS_DENIED' });
            } else {
              console.log(`⚠️  ${api.name}: Unexpected response`);
              resolve({ success: false, api: api.name, error: 'UNEXPECTED_RESPONSE' });
            }
            return;
          }

          // Handle JSON APIs
          try {
            const response = JSON.parse(data);

            if (response.status === 'OK' || response.results) {
              console.log(`✅ ${api.name}: Working correctly`);
              resolve({ success: true, api: api.name });
            } else if (response.status === 'REQUEST_DENIED') {
              console.log(`❌ ${api.name}: Access denied - API may not be enabled`);
              console.log(`   Error: ${response.error_message || 'Unknown error'}`);
              resolve({ success: false, api: api.name, error: 'ACCESS_DENIED' });
            } else {
              console.log(`⚠️  ${api.name}: Unexpected response status: ${response.status}`);
              resolve({ success: false, api: api.name, error: response.status });
            }
          } catch (error) {
            console.log(`❌ ${api.name}: Invalid JSON response`);
            resolve({ success: false, api: api.name, error: 'INVALID_JSON' });
          }
        } else {
          console.log(`❌ ${api.name}: HTTP ${res.statusCode}`);
          resolve({ success: false, api: api.name, error: `HTTP_${res.statusCode}` });
        }
      });
    }).on('error', (error) => {
      console.log(`❌ ${api.name}: Network error - ${error.message}`);
      resolve({ success: false, api: api.name, error: 'NETWORK_ERROR' });
    });
  });
}

// Test all APIs
async function testAllApis() {
  console.log('\n🔍 Testing Google Maps APIs...\n');
  
  const results = [];
  
  for (const api of requiredApis) {
    console.log(`Testing ${api.name}...`);
    const result = await testApiEndpoint(api);
    results.push(result);
  }
  
  console.log('\n' + '='.repeat(60));
  
  const successfulApis = results.filter(r => r.success);
  const failedApis = results.filter(r => !r.success);
  
  if (successfulApis.length === requiredApis.length) {
    console.log('🎉 All Google Maps APIs are working correctly!');
    console.log('🚀 Your Google Maps configuration is ready for use.');
  } else {
    console.log(`⚠️  ${failedApis.length} out of ${requiredApis.length} APIs failed`);
    
    if (failedApis.some(api => api.error === 'ACCESS_DENIED')) {
      console.log('\n📝 To fix API access issues:');
      console.log('1. Go to Google Cloud Console > APIs & Services > Library');
      console.log('2. Enable the following APIs:');
      failedApis.forEach(api => {
        const requiredApi = requiredApis.find(r => r.name === api.api);
        if (requiredApi) {
          console.log(`   - ${api.api}`);
        }
      });
      console.log('3. Wait a few minutes for changes to take effect');
    }
    
    console.log('\n📋 API Status Summary:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const error = result.error ? ` (${result.error})` : '';
      console.log(`${status} ${result.api}${error}`);
    });
  }
  
  console.log('\n📚 Required APIs for FDMS:');
  requiredApis.forEach(api => {
    console.log(`• ${api.name}: ${api.description}`);
  });
  
  console.log('\n🔗 Useful Links:');
  console.log('• Google Cloud Console: https://console.cloud.google.com/');
  console.log('• Enable APIs: https://console.cloud.google.com/apis/library');
  console.log('• API Credentials: https://console.cloud.google.com/apis/credentials');
  console.log('• Maps JavaScript API: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com');
  console.log('• Places API: https://console.cloud.google.com/apis/library/places-backend.googleapis.com');
  console.log('• Geocoding API: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com');
}

// Run the tests
testAllApis().catch(error => {
  console.error('❌ Error running API tests:', error);
  process.exit(1);
});
