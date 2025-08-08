#!/bin/bash

echo "🤖 VPS Monitor Bot - Ubuntu Setup"
echo "=================================="

# Check if running on Ubuntu
if [ ! -f /etc/lsb-release ]; then
    echo "⚠️  This script is designed for Ubuntu. Continuing anyway..."
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally..."
    sudo npm install -g pm2
fi

# Create logs directory
mkdir -p logs

# Set proper permissions
chmod +x setup-ubuntu.sh
chmod +x start-pm2-linux.sh
chmod +x stop-pm2-linux.sh

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the bot:"
echo "1. First time: npm start (scan QR code)"
echo "2. With PM2: ./start-pm2-linux.sh"
echo ""
echo "📊 Monitor: pm2 logs vps-monitor"
echo "🛑 Stop: ./stop-pm2-linux.sh"
