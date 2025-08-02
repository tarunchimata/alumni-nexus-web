#!/usr/bin/env node

/**
 * Enhanced Backend Startup Debug Script
 * Captures detailed logs and startup sequence for troubleshooting
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('🔍 Checking prerequisites...', 'cyan');
  
  // Check if we're in the backend directory
  const backendDir = process.cwd().includes('backend') ? '.' : './backend';
  if (!fs.existsSync(path.join(backendDir, 'package.json'))) {
    log('❌ Backend package.json not found. Run from project root or backend directory.', 'red');
    process.exit(1);
  }
  
  // Check for environment file
  const envFiles = ['.env.local', '.env.production', '.env'];
  let envFound = false;
  envFiles.forEach(file => {
    if (fs.existsSync(path.join(backendDir, file))) {
      log(`✅ Found environment file: ${file}`, 'green');
      envFound = true;
    }
  });
  
  if (!envFound) {
    log('⚠️  No environment file found. Please create .env.local', 'yellow');
  }
  
  // Check directories
  const requiredDirs = ['logs', 'uploads'];
  requiredDirs.forEach(dir => {
    const dirPath = path.join(backendDir, dir);
    if (!fs.existsSync(dirPath)) {
      log(`📁 Creating directory: ${dir}`, 'blue');
      fs.mkdirSync(dirPath, { recursive: true });
    } else {
      log(`✅ Directory exists: ${dir}`, 'green');
    }
  });
  
  return backendDir;
}

function checkEnvironmentVariables(backendDir) {
  log('🔧 Checking environment variables...', 'cyan');
  
  // Load environment variables
  const envPath = path.join(backendDir, '.env.local');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
  
  const requiredVars = [
    'PORT',
    'DB_HOST',
    'DB_PORT', 
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'KEYCLOAK_URL',
    'KEYCLOAK_REALM',
    'KEYCLOAK_CLIENT_ID',
    'KEYCLOAK_FRONTEND_CLIENT_ID',
    'JWT_SECRET'
  ];
  
  const missing = [];
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: ${varName.includes('PASSWORD') || varName.includes('SECRET') ? '[HIDDEN]' : process.env[varName]}`, 'green');
    } else {
      log(`❌ Missing: ${varName}`, 'red');
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    log(`⚠️  Missing ${missing.length} required environment variables`, 'yellow');
    return false;
  }
  
  return true;
}

function checkDependencies(backendDir) {
  log('📦 Checking dependencies...', 'cyan');
  
  if (!fs.existsSync(path.join(backendDir, 'node_modules'))) {
    log('❌ node_modules not found. Installing dependencies...', 'yellow');
    return false;
  }
  
  log('✅ Dependencies installed', 'green');
  return true;
}

function startBackend(backendDir, mode = 'dev') {
  log(`🚀 Starting backend in ${mode} mode...`, 'cyan');
  
  const isDevMode = mode === 'dev';
  const command = isDevMode ? 'npm' : 'node';
  const args = isDevMode ? ['run', 'dev'] : ['dist/index.js'];
  
  const child = spawn(command, args, {
    cwd: backendDir,
    stdio: 'pipe',
    env: { ...process.env }
  });
  
  let startupComplete = false;
  let portBound = false;
  
  child.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    
    // Track startup milestones
    if (output.includes('Server is running on port')) {
      portBound = true;
      log('✅ Port successfully bound', 'green');
    }
    
    if (output.includes('Database connected successfully')) {
      log('✅ Database connection established', 'green');
    }
    
    if (output.includes('Server started successfully') || output.includes('Ready')) {
      startupComplete = true;
      log('🎉 Backend startup complete!', 'green');
      setTimeout(() => testHealthCheck(), 2000);
    }
  });
  
  child.stderr.on('data', (data) => {
    const error = data.toString();
    log(`STDERR: ${error}`, 'red');
  });
  
  child.on('close', (code) => {
    if (code !== 0) {
      log(`❌ Backend process exited with code ${code}`, 'red');
      if (!portBound) {
        log('🔍 Port was never bound - check for early startup errors', 'yellow');
      }
    } else {
      log('✅ Backend process exited cleanly', 'green');
    }
  });
  
  child.on('error', (error) => {
    log(`❌ Failed to start backend: ${error.message}`, 'red');
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('🛑 Shutting down backend...', 'yellow');
    child.kill('SIGTERM');
    setTimeout(() => {
      child.kill('SIGKILL');
      process.exit(0);
    }, 5000);
  });
  
  return child;
}

async function testHealthCheck() {
  log('🩺 Testing health check...', 'cyan');
  
  try {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3001,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        log(`✅ Health check response (${res.statusCode}): ${data}`, 'green');
      });
    });
    
    req.on('error', (error) => {
      log(`❌ Health check failed: ${error.message}`, 'red');
    });
    
    req.on('timeout', () => {
      log('❌ Health check timed out', 'red');
      req.destroy();
    });
    
    req.end();
  } catch (error) {
    log(`❌ Health check error: ${error.message}`, 'red');
  }
}

// Main execution
async function main() {
  log('🔧 My School Buddies Backend Debug Startup', 'bright');
  log('================================================', 'bright');
  
  const backendDir = checkPrerequisites();
  
  // Change to backend directory
  process.chdir(backendDir);
  
  const envValid = checkEnvironmentVariables(backendDir);
  const depsValid = checkDependencies(backendDir);
  
  if (!depsValid) {
    log('📦 Installing dependencies...', 'yellow');
    const { spawn } = require('child_process');
    const install = spawn('npm', ['install'], { stdio: 'inherit' });
    
    install.on('close', (code) => {
      if (code === 0) {
        log('✅ Dependencies installed successfully', 'green');
        startBackend('.', process.argv[2] || 'dev');
      } else {
        log('❌ Failed to install dependencies', 'red');
        process.exit(1);
      }
    });
    
    return;
  }
  
  if (!envValid) {
    log('⚠️  Continuing with missing environment variables (may cause errors)', 'yellow');
  }
  
  // Start the backend
  startBackend('.', process.argv[2] || 'dev');
}

main().catch(error => {
  log(`❌ Startup failed: ${error.message}`, 'red');
  process.exit(1);
});