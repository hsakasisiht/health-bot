#!/bin/bash

echo "🚀 Starting VPS Monitor Bot with PM2..."

# Stop if already running
pm2 stop vps-monitor 2>/dev/null || true
pm2 delete vps-monitor 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js

# Show status
echo ""
echo "✅ Bot started!"
echo ""
echo "📊 Commands:"
echo "  pm2 status                 - View process status"
echo "  pm2 logs vps-monitor       - View live logs"
echo "  pm2 restart vps-monitor    - Restart bot"
echo "  pm2 stop vps-monitor       - Stop bot"
echo "  ./stop-pm2-linux.sh        - Stop and remove"
echo ""

# Show initial logs
pm2 logs vps-monitor --lines 10
