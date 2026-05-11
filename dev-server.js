#!/usr/bin/env node
/**
 * Development server starter
 * Compiles main process and starts webpack dev server
 * Then launches Electron pointing to localhost:3000
 */

const { spawn } = require('child_process');
const http = require('http');

const DEV_PORT = process.env.DEV_PORT || 3000;

// Function to check if port is ready
const isPortReady = (port, maxAttempts = 60) => {
  return new Promise((resolve) => {
    let attempts = 0;

    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        console.log(`✓ Dev server ready on port ${port}`);
        resolve(true);
      });

      req.on('error', () => {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(check, 500);
        } else {
          console.error(`✗ Dev server did not start on port ${port}`);
          resolve(false);
        }
      });
    };

    check();
  });
};

// Start webpack dev server using pnpm
console.log(`Starting webpack dev server on port ${DEV_PORT}...`);
const webpackProcess = spawn('pnpm', ['dev:react'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DEV_PORT: DEV_PORT,
    WEBPACK_PORT: DEV_PORT,
  },
});

// After webpack server is ready, start Electron
isPortReady(DEV_PORT).then((ready) => {
  if (ready) {
    console.log('\nStarting Electron...\n');
    const electronProcess = spawn('pnpm', ['dev:electron'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'development',
        DEV_PORT: DEV_PORT,
      },
    });

    electronProcess.on('exit', () => {
      console.log('\nElectron exited, stopping dev server...');
      webpackProcess.kill();
      process.exit(0);
    });
  } else {
    webpackProcess.kill();
    process.exit(1);
  }
});

// Handle termination
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  webpackProcess.kill();
  process.exit(0);
});



