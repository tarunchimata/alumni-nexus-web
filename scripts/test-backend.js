// Quick test script to check if backend is running
async function testBackend() {
  try {
    console.log('Testing backend at http://localhost:3001/api/test');
    
    const response = await fetch('http://localhost:3001/api/test');
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('Response body:', text);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        console.log('Parsed JSON:', json);
      } catch (e) {
        console.log('Failed to parse as JSON despite content-type');
      }
    }
  } catch (error) {
    console.error('Backend test failed:', error.message);
    console.log('Backend is likely not running. Please start it with: cd backend && npm run dev');
  }
}

testBackend();