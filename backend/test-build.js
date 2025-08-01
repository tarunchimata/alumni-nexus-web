const { exec } = require('child_process');

console.log('🔧 Testing TypeScript compilation...');

exec('npm run build', { cwd: 'backend' }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Build failed:');
    console.error(stderr);
    process.exit(1);
  } else {
    console.log('✅ TypeScript compilation successful!');
    console.log(stdout);
    process.exit(0);
  }
});