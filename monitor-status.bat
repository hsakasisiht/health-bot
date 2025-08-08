@echo off
echo VPS Monitor Bot - Performance Status
echo =====================================
echo.

:: Check if PM2 process is running
pm2 status | findstr "vps-monitor"
if %errorlevel% neq 0 (
    echo ❌ Bot is not running!
    echo Use "npm run pm2" to start it.
    goto :end
)

echo.
echo 📊 Memory Usage:
pm2 show vps-monitor | findstr "memory"

echo.
echo 📝 Recent Logs (last 10 lines):
pm2 logs vps-monitor --lines 10 --nostream

echo.
echo 📁 Log File Sizes:
for %%f in (logs\*.log) do (
    echo %%f - %%~zf bytes
)

echo.
echo 🔧 Available Commands:
echo   pm2 status        - View process status
echo   pm2 monit         - Real-time monitoring
echo   pm2 logs          - View live logs
echo   clean-logs.bat    - Clean up log files
echo   pm2 restart       - Restart the bot

:end
echo.
pause
