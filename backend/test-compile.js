// Quick test script to check if TypeScript compiles
const { execSync } = require('child_process');

try {
  console.log('Testing TypeScript compilation...');
  execSync('npx tsc --noEmit', { 
    cwd: __dirname,
    stdio: 'inherit' 
  });
  console.log('✅ TypeScript compilation successful!');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  process.exit(1);
}