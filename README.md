# VPS Monitor Bot

A Node.js bot that monitors your VPS server and sends WhatsApp alerts when it goes offline.

## Features

- 🔍 Monitors VPS by sending ping requests every 10 seconds
- 📱 Sends WhatsApp alerts using Baileys library
- 🔐 Uses pairing code authentication (no QR code needed)
- ⚡ Smart notification system with cooldown to prevent spam
- 🔄 Automatic reconnection handling
- 📊 Console logging with timestamps

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure the Bot**
   
   Edit `index.js` and update the CONFIG section:
   ```javascript
   const CONFIG = {
       VPS_HOST: 'your-vps-ip-or-domain.com',  // Replace with your VPS IP or domain
       TARGET_WHATSAPP: '1234567890@s.whatsapp.net',  // Replace with your main WhatsApp number
       PING_INTERVAL: 10000, // 10 seconds
       OFFLINE_THRESHOLD: 3, // Consider offline after 3 failed pings
   };
   ```

   **Important:** 
   - Replace `your-vps-ip-or-domain.com` with your actual VPS IP address or domain
   - Replace `1234567890` with your main WhatsApp number (include country code, no + or spaces)

3. **Run the Bot**
   ```bash
   npm start
   ```

4. **WhatsApp Authentication**
   - When you first run the bot, it will ask for your phone number
   - Enter the phone number you want to use for sending alerts (with country code)
   - The bot will generate a pairing code
   - Open WhatsApp on your phone → Settings → Linked Devices → Link a Device
   - Enter the pairing code
   - The bot will automatically start monitoring your VPS

## How It Works

1. **Monitoring**: The bot sends ping requests to your VPS every 10 seconds
2. **Offline Detection**: If 3 consecutive pings fail, the VPS is considered offline
3. **WhatsApp Alert**: An alert message is sent to your main WhatsApp number
4. **Recovery Detection**: When the VPS comes back online, you'll receive a recovery notification
5. **Cooldown**: To prevent spam, notifications have a 5-minute cooldown period

## Configuration Options

- `VPS_HOST`: Your VPS IP address or domain name
- `TARGET_WHATSAPP`: Your main WhatsApp number (format: number@s.whatsapp.net)
- `PING_INTERVAL`: Time between ping checks in milliseconds (default: 10000 = 10 seconds)
- `OFFLINE_THRESHOLD`: Number of failed pings before considering VPS offline (default: 3)

## File Structure

```
healt-bot/
├── index.js          # Main bot file
├── package.json      # Dependencies and scripts
├── session/          # WhatsApp session files (created automatically)
└── README.md         # This file
```

## Troubleshooting

1. **"Please configure your VPS host" error**
   - Make sure you've replaced `YOUR_VPS_IP_OR_DOMAIN` with your actual VPS address

2. **"Please configure your target WhatsApp number" error**
   - Make sure you've replaced `YOUR_MAIN_WHATSAPP_NUMBER` with your actual WhatsApp number

3. **WhatsApp connection issues**
   - Make sure you're using the correct phone number format (country code + number)
   - Check that the pairing code was entered correctly
   - Ensure your internet connection is stable

4. **Ping failures**
   - Verify your VPS IP/domain is correct
   - Check if your VPS allows ICMP ping requests
   - Ensure your firewall isn't blocking ping requests

## Security Notes

- The bot creates session files in the `session/` folder to maintain WhatsApp connection
- Keep these files secure and don't share them
- The bot only sends notifications to the configured WhatsApp number

## License

MIT License
