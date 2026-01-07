// Set environment variables
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5433';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_TEMP_NAME = 'medusa_booking_test';
process.env.LOG_LEVEL = 'error';

// Run Jest via npx
const { spawnSync } = require('child_process');
const path = require('path');

const result = spawnSync('npx', [
  'jest',
  '--bail',
  '--forceExit',
  '--testPathPattern=integration-tests/__tests__/.*\\.ts'
], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: process.env
});

process.exit(result.status || 0);
