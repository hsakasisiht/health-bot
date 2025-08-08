# VPS Monitor Bot - PM2 Setup Guide

## Quick Start

### 1. First Time Setup (Scan QR Code)
```bash
# Run normally first to scan QR code and authenticate
npm start

# Once connected and working, stop with Ctrl+C
```

### 2. Start with PM2
```bash
# Start the bot with PM2
npm run pm2

# Or manually:
pm2 start ecosystem.config.js
```

### 3. PM2 Management Commands
```bash
# View status
pm2 status

# View logs (real-time)
npm run pm2:logs
# or
pm2 logs vps-monitor

# Stop the bot
npm run pm2:stop
# or
pm2 stop vps-monitor

# Restart the bot
npm run pm2:restart
# or
pm2 restart vps-monitor

# Delete from PM2
npm run pm2:delete
# or
pm2 delete vps-monitor

# Save PM2 process list (auto-start on boot)
pm2 save
pm2 startup
```

## Performance Optimizations

✅ **Fast Monitoring**: Checks VPS every 5 seconds for quick detection
✅ **Memory Optimized**: Max 512MB RAM usage with auto-restart
✅ **Console Management**: Clears terminal logs every hour
✅ **Reduced Logging**: Shows online status every 100 seconds only
✅ **Log Rotation**: Automatic log file management

## Features

✅ **Immediate Alerts**: No cooldown - sends WhatsApp alert every time VPS is offline
✅ **PM2 Process Management**: Automatic restart on crashes
✅ **Optimized Logging**: Auto-clear console every hour to prevent high CPU usage
✅ **QR Code Authentication**: One-time setup, then runs automatically
✅ **Memory Management**: Auto-restart if memory usage exceeds 512MB

## Configuration

Edit `qr-bot.js` to change:
- `VPS_HOST`: Your VPS IP address
- `TARGET_WHATSAPP`: Your WhatsApp number for alerts
- `PING_INTERVAL`: How often to check (default: 5 seconds)
- `OFFLINE_THRESHOLD`: Failed pings before considering offline (default: 3)
- `LOG_CLEAR_INTERVAL`: Console clear frequency (default: 1 hour)

## Log Management

- `logs/out.log`: Standard output
- `logs/err.log`: Error logs  
- `logs/combined.log`: All logs combined
- **Auto-clear**: Console clears every hour with status summary
- **Log rotation**: Automatic via PM2 configuration

## Maintenance Commands

```bash
# Clean up large log files
clean-logs.bat

# Flush PM2 logs
pm2 flush

# Monitor memory usage
pm2 monit
```

## Troubleshooting

### If bot stops working:
```bash
# Check PM2 status
pm2 status

# View recent logs
pm2 logs vps-monitor --lines 50

# Restart if needed
pm2 restart vps-monitor
```

### If WhatsApp session expires:
```bash
# Stop PM2
pm2 stop vps-monitor

# Clear session and re-authenticate
node qr-bot.js --clear-session
node qr-bot.js
# Scan QR code again

# Start with PM2 again
pm2 start ecosystem.config.js
```

## System Startup (Windows)

To auto-start on Windows boot:
```bash
# Install PM2 startup service
pm2-installer

# Or manually add to Windows startup folder
```

## Alert Behavior

- **Online**: Logs status every 10 seconds
- **First Offline**: Sends immediate WhatsApp alert
- **Still Offline**: Continues sending alerts every 10 seconds (no cooldown)
- **Back Online**: Sends recovery notification

This ensures you get immediate notification every time your VPS goes down!
