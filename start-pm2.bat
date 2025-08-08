@echo off
echo Starting VPS Monitor Bot with PM2...
cd /d "%~dp0"
npm run pm2
echo Bot started! Use "pm2 logs vps-monitor" to view logs
echo Use "pm2 stop vps-monitor" to stop the bot
pause
