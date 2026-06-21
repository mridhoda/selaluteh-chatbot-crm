/**
 * Test Google Maps API key dengan real Geocoding API call.
 * Usage: node scripts/test-google-maps.js
 */
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const query = encodeURIComponent('Jalan Biawan, Samarinda, Indonesia');
const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GOOGLE_MAPS_API_KEY}&region=id&language=id`;

console.log('Testing Google Geocoding API...');
console.log('URL:', url.replace(GOOGLE_MAPS_API_KEY, '***'));

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('Status:', data.status);
    if (data.status === 'OK') {
      const result = data.results[0];
      console.log('Formatted address:', result.formatted_address);
      console.log('Location:', result.geometry.location);
      console.log('✅ Google Maps API key works!');
    } else {
      console.error('❌ API Error:', data.error_message || data.status);
    }
  })
  .catch(err => console.error('❌ Network Error:', err.message));
