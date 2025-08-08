@echo off
echo Cleaning up log files...
cd /d "%~dp0"

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

:: Clear or truncate log files if they're too large (>10MB)
for %%f in (logs\*.log) do (
    for /f "usebackq" %%A in ('%%f') do set size=%%~zA
    if !size! gtr 10485760 (
        echo Clearing %%f - Size: !size! bytes
        echo. > "%%f"
    )
)

:: Clean up old PM2 logs
pm2 flush

echo Log cleanup complete!
pause
