// Simple cross-platform runner to start both server and web dev servers
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const webDir = path.join(rootDir, 'web');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(name, script, cwd) {
  const proc = spawn(npmCmd, ['run', script], {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  proc.on('close', (code, signal) => {
    if (signal) return;
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      process.exit(code);
    }
  });

  proc.on('error', (err) => {
    console.error(`[${name}] failed to start:`, err.message);
    process.exit(1);
  });

  return proc;
}

const server = run('server', 'dev', serverDir);
const web = run('web', 'dev', webDir);

function shutdown(signal = 'SIGTERM') {
  if (server && !server.killed) {
    server.kill(signal);
  }
  if (web && !web.killed) {
    web.kill(signal);
  }
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
