#!/bin/bash
# Clean start script that suppresses session warnings
echo "🤖 Starting VPS Monitor Bot (Clean Mode)..."
echo "📝 Session warnings will be filtered out"
echo ""

# Run the bot and filter out session-related messages
node qr-bot.js 2>&1 | grep -v "Decrypted message with closed session" | grep -v "Closing open session" | grep -v "SessionEntry"
