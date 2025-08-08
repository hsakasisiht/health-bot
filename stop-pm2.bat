@echo off
echo Stopping VPS Monitor Bot...
cd /d "%~dp0"
pm2 stop vps-monitor
pm2 delete vps-monitor
echo Bot stopped and removed from PM2
pause
