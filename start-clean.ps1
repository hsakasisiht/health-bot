# Clean start script for Windows that suppresses session warnings
Write-Host "🤖 Starting VPS Monitor Bot (Clean Mode)..." -ForegroundColor Green
Write-Host "📝 Session warnings will be filtered out" -ForegroundColor Yellow
Write-Host ""

# Run the bot and filter out session-related messages
node qr-bot.js 2>&1 | Where-Object { 
    $_ -notlike "*Decrypted message with closed session*" -and 
    $_ -notlike "*Closing open session*" -and 
    $_ -notlike "*SessionEntry*" 
}
