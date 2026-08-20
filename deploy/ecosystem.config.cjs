// pm2 process definitions for production. Run from the pflegeDb repo root:
//   pm2 start deploy/ecosystem.config.cjs
//
// server.cjs already loads .env itself (dotenv), so pm2 doesn't need to inject vars for that app.
// The whisper service reads its port from its own default (127.0.0.1:8000), matching what
// server.cjs expects — no env needed there either.
const path = require('path');
const ROOT = path.join(__dirname, '..');

module.exports = {
  apps: [
    {
      name: 'pflegedb-app',
      cwd: ROOT,
      script: 'server.cjs',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'pflegedb-whisper',
      cwd: ROOT,
      script: 'whisper_service.py',
      interpreter: path.join(ROOT, 'deploy', 'venv', 'bin', 'python3'),
      autorestart: true,
      max_restarts: 10
    },
    {
      name: 'pflegedb-livekit',
      cwd: path.join(ROOT, 'deploy'),
      script: 'livekit-server',
      args: '--config livekit.yaml',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10
    }
  ]
};
