# VPS Monitor Bot - Ubuntu VPS Setup

## 🚀 Quick Start for Ubuntu VPS

### 1. First-time Setup
```bash
# Make scripts executable
chmod +x *.sh

# Run setup (installs Node.js, PM2, dependencies)
./setup-ubuntu.sh
```

### 2. Authenticate WhatsApp
```bash
# Start bot to scan QR code
npm start

# Scan QR code with your WhatsApp
# Press Ctrl+C after successful connection
```

### 3. Start with PM2 (Background Service)
```bash
# Start as background service
./start-pm2-linux.sh

# Or manually:
pm2 start ecosystem.config.js
```

## 📊 Management Commands

```bash
# View bot status
pm2 status

# View live logs
pm2 logs vps-monitor

# Restart bot
pm2 restart vps-monitor

# Stop bot
./stop-pm2-linux.sh

# Monitor performance
pm2 monit
```

## 🔧 Configuration

The bot monitors network connectivity by pinging external hosts:
- **Primary**: 8.8.8.8 (Google DNS)
- **Backup**: 1.1.1.1 (Cloudflare DNS)

This ensures:
✅ No self-ping issues when running on VPS
✅ Reliable connectivity monitoring
✅ Immediate alerts for network issues

## 📱 Alert Behavior

- **Online**: Checks every 5 seconds, reports every 100 seconds
- **Offline**: Immediate WhatsApp alert, then every 5 seconds
- **Recovery**: Instant notification when connectivity restored

## 🐛 Troubleshooting

### "Decrypted message with closed session" warnings
These are normal WhatsApp session management messages. To minimize console clutter:

```bash
# Use clean start to filter session warnings
npm run start:clean

# Or use the shell script
chmod +x start-clean.sh
./start-clean.sh
```

The warnings don't affect functionality - they're just verbose protocol logs.

### Network ping failures
The bot now pings external DNS servers (8.8.8.8) instead of self-pinging, preventing VPS internal network issues.

### High memory usage
The bot is optimized for VPS use:
- Memory limit: 512MB with auto-restart
- Console clearing: Every hour
- Reduced logging frequency

### WhatsApp session expires
```bash
# Stop PM2
./stop-pm2-linux.sh

# Clear session and re-authenticate
node qr-bot.js --clear-session
npm start
# Scan QR code again

# Restart with PM2
./start-pm2-linux.sh
```

## 🔄 Auto-start on Boot

```bash
# Save current PM2 processes
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions shown (usually run a sudo command)
```

## 📁 File Structure

```
health-bot/
├── qr-bot.js              # Main bot file
├── ecosystem.config.js    # PM2 configuration
├── setup-ubuntu.sh        # Ubuntu setup script
├── start-pm2-linux.sh     # Start with PM2
├── stop-pm2-linux.sh      # Stop PM2
├── logs/                  # Log files
└── session/               # WhatsApp session files
```

## ⚡ Performance Features

- **Fast Detection**: 5-second ping intervals
- **Memory Optimized**: 512MB limit with auto-restart
- **Log Management**: Auto-clearing every hour
- **External Monitoring**: Pings reliable external hosts
- **Platform Detection**: Automatic Linux/Windows compatibility
