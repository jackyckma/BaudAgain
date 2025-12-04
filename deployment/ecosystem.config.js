// PM2 Ecosystem Configuration for BaudAgain BBS
module.exports = {
  apps: [{
    name: 'baudagain',
    script: './server-dist/index.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',

    // Environment
    env: {
      NODE_ENV: 'production',
    },

    // Logging
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,

    // Auto-restart
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',

    // Resource limits
    max_memory_restart: '500M',

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Monitoring
    watch: false,  // Don't watch in production
    ignore_watch: ['node_modules', 'logs', 'data'],
  }]
};
