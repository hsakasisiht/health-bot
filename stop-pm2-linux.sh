#!/bin/bash

echo "🛑 Stopping VPS Monitor Bot..."

# Stop and delete from PM2
pm2 stop vps-monitor 2>/dev/null || true
pm2 delete vps-monitor 2>/dev/null || true

echo "✅ Bot stopped and removed from PM2"

# Show PM2 status
pm2 status
