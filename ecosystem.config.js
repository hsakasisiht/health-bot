module.exports = {
  apps: [{
    name: 'vps-monitor',
    script: 'qr-bot.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    // Log rotation settings
    log_type: 'json',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    // Performance optimizations
    node_args: '--max-old-space-size=512',
    // Environment variables for optimization
    env_production: {
      NODE_ENV: 'production',
      UV_THREADPOOL_SIZE: 4
    }
  }]
};
