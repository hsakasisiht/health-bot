const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const P = require('pino');
const ping = require('ping');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    VPS_HOST: '103.180.218.240',  // Replace with your VPS IP or domain
    TARGET_WHATSAPP: '919675893215@s.whatsapp.net',  // Replace with your main WhatsApp number
    PING_INTERVAL: 10000, // 10 seconds
    OFFLINE_THRESHOLD: 3, // Consider offline after 3 failed pings
};

let sock;
let consecutiveFailures = 0;
let isVpsOffline = false;
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 300000; // 5 minutes cooldown between notifications

// Logger (silent to avoid clutter)
const logger = P({ level: 'silent' });

// Function to clear session data
async function clearSession() {
    try {
        const sessionPath = './session';
        if (fs.existsSync(sessionPath)) {
            const files = fs.readdirSync(sessionPath);
            for (const file of files) {
                fs.unlinkSync(path.join(sessionPath, file));
            }
            console.log('🗑️  Session cleared');
        }
    } catch (error) {
        console.error('❌ Error clearing session:', error.message);
    }
}

async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version, isLatest } = await fetchLatestBaileysVersion();
        
        console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

        sock = makeWASocket({
            version,
            logger,
            auth: state,
            printQRInTerminal: false,
            browser: ['VPS Monitor Bot', 'Desktop', '1.0.0'],
            generateHighQualityLinkPreview: true,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            fireInitQueries: true,
            emitOwnEvents: false,
            getMessage: async (key) => {
                return { conversation: 'Hello' };
            }
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr, isNewLogin } = update;
            
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const reason = lastDisconnect?.error?.output?.payload?.message || 'Unknown error';
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                
                console.log(`❌ Connection closed: ${reason}`);
                
                if (statusCode === DisconnectReason.badSession) {
                    console.log('🔄 Bad session detected, clearing session and restarting...');
                    await clearSession();
                    setTimeout(() => connectToWhatsApp(), 2000);
                } else if (statusCode === DisconnectReason.connectionClosed) {
                    console.log('🔄 Connection closed, reconnecting...');
                    setTimeout(() => connectToWhatsApp(), 3000);
                } else if (statusCode === DisconnectReason.connectionLost) {
                    console.log('🔄 Connection lost, reconnecting...');
                    setTimeout(() => connectToWhatsApp(), 3000);
                } else if (statusCode === DisconnectReason.restartRequired) {
                    console.log('🔄 Restart required, reconnecting...');
                    setTimeout(() => connectToWhatsApp(), 2000);
                } else if (shouldReconnect) {
                    console.log('🔄 Attempting to reconnect...');
                    setTimeout(() => connectToWhatsApp(), 5000);
                } else {
                    console.log('❌ Logged out or permanent error. Please restart the bot.');
                    process.exit(1);
                }
            } else if (connection === 'connecting') {
                console.log('🔄 Connecting to WhatsApp...');
            } else if (connection === 'open') {
                console.log('✅ WhatsApp connected successfully!');
                console.log(`📱 Bot phone number: ${sock.user?.id || 'Unknown'}`);
                console.log('🔍 Starting VPS monitoring...');
                
                // Send a test message to confirm connection
                try {
                    await sock.sendMessage(CONFIG.TARGET_WHATSAPP, {
                        text: `🤖 VPS Monitor Bot Connected!\n\n✅ Bot is now monitoring your VPS: ${CONFIG.VPS_HOST}\n⏰ Started at: ${new Date().toLocaleString()}`
                    });
                    console.log('✅ Test message sent successfully!');
                } catch (error) {
                    console.error('❌ Failed to send test message:', error.message);
                }
                
                startVpsMonitoring();
            }
            
            if (isNewLogin) {
                console.log('✅ Successfully paired with WhatsApp!');
            }
        });

        sock.ev.on('creds.update', saveCreds);

        // Handle pairing code
        if (!state.creds?.registered) {
            console.log('\n📱 Setting up WhatsApp connection...');
            console.log('⚠️  Make sure you have a secondary WhatsApp number ready for sending alerts.');
            console.log('⚠️  This should NOT be your main WhatsApp number.');
            
            const phoneNumber = await new Promise((resolve) => {
                rl.question('Enter your SECONDARY WhatsApp phone number (with country code, e.g., 919876543210): ', (number) => {
                    const cleanNumber = number.replace(/[^0-9]/g, '');
                    console.log(`📞 Using number: +${cleanNumber}`);
                    resolve(cleanNumber);
                });
            });

            if (phoneNumber.length < 10) {
                console.log('❌ Invalid phone number. Please include country code (e.g., 919876543210)');
                rl.close();
                process.exit(1);
            }

            try {
                console.log(`📞 Requesting pairing code for: +${phoneNumber}`);
                const code = await sock.requestPairingCode(phoneNumber);
                console.log(`\n🔑 YOUR PAIRING CODE: ${code}`);
                console.log('�'.repeat(30));
                console.log(`🔑 CODE: ${code}`);
                console.log('🔑'.repeat(30));
                console.log('\n📱 STEPS TO LINK:');
                console.log('   1. Open WhatsApp on the phone with number +' + phoneNumber);
                console.log('   2. Go to Settings ⚙️');
                console.log('   3. Tap "Linked Devices" 🔗');
                console.log('   4. Tap "Link a Device" ➕');
                console.log('   5. Tap "Link with phone number instead" 📞');
                console.log('   6. Enter this code: ' + code);
                console.log('\n⏳ Waiting for you to enter the code in WhatsApp...');
                console.log('💡 The connection will happen automatically once you enter the code.');
            } catch (error) {
                console.error('❌ Error requesting pairing code:', error.message);
                if (error.message.includes('rate limited')) {
                    console.log('⚠️  Rate limited. Please wait a few minutes before trying again.');
                    console.log('💡 You can clear session and try again: node index.js --clear-session');
                }
                rl.close();
                process.exit(1);
            }
        } else {
            console.log('✅ Found existing session, attempting to connect...');
        }
    } catch (error) {
        console.error('❌ Error in connectToWhatsApp:', error);
        setTimeout(() => connectToWhatsApp(), 5000);
    }
}

async function pingVps() {
    try {
        const result = await ping.promise.probe(CONFIG.VPS_HOST, {
            timeout: 5,
            extra: ['-n', '1'] // Windows ping syntax
        });
        
        return result.alive;
    } catch (error) {
        console.error('❌ Ping error:', error.message);
        return false;
    }
}

async function sendWhatsAppAlert(message) {
    try {
        if (!sock) {
            console.log('❌ WhatsApp not connected');
            return false;
        }

        await sock.sendMessage(CONFIG.TARGET_WHATSAPP, {
            text: message
        });
        
        console.log('✅ Alert sent to WhatsApp');
        return true;
    } catch (error) {
        console.error('❌ Failed to send WhatsApp message:', error);
        return false;
    }
}

async function checkVpsStatus() {
    const timestamp = new Date().toLocaleString();
    const isOnline = await pingVps();
    
    if (isOnline) {
        if (isVpsOffline) {
            // VPS came back online
            consecutiveFailures = 0;
            isVpsOffline = false;
            const message = `🟢 VPS BACK ONLINE!\n\n` +
                          `🌐 Host: ${CONFIG.VPS_HOST}\n` +
                          `⏰ Time: ${timestamp}\n` +
                          `✅ Server is responding to ping requests`;
            
            await sendWhatsAppAlert(message);
            console.log(`🟢 ${timestamp} - VPS is back online`);
        } else {
            console.log(`🟢 ${timestamp} - VPS is online`);
        }
    } else {
        consecutiveFailures++;
        console.log(`🔴 ${timestamp} - VPS ping failed (${consecutiveFailures}/${CONFIG.OFFLINE_THRESHOLD})`);
        
        if (consecutiveFailures >= CONFIG.OFFLINE_THRESHOLD && !isVpsOffline) {
            // VPS is considered offline
            isVpsOffline = true;
            const currentTime = Date.now();
            
            // Check notification cooldown
            if (currentTime - lastNotificationTime > NOTIFICATION_COOLDOWN) {
                const message = `🚨 VPS OFFLINE ALERT!\n\n` +
                              `🌐 Host: ${CONFIG.VPS_HOST}\n` +
                              `⏰ Time: ${timestamp}\n` +
                              `❌ Failed pings: ${consecutiveFailures}\n` +
                              `⚠️ Your VPS appears to be offline!`;
                
                await sendWhatsAppAlert(message);
                lastNotificationTime = currentTime;
                console.log(`🚨 ${timestamp} - VPS OFFLINE! Alert sent.`);
            }
        }
    }
}

function startVpsMonitoring() {
    console.log(`🔍 Monitoring VPS: ${CONFIG.VPS_HOST}`);
    console.log(`⏱️  Ping interval: ${CONFIG.PING_INTERVAL / 1000} seconds`);
    console.log(`📱 Alerts will be sent to: ${CONFIG.TARGET_WHATSAPP}`);
    console.log('─'.repeat(50));
    
    // Initial check
    checkVpsStatus();
    
    // Set up periodic monitoring
    setInterval(checkVpsStatus, CONFIG.PING_INTERVAL);
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down VPS monitor...');
    rl.close();
    process.exit(0);
});

// Main function
async function main() {
    console.log('🤖 VPS Monitor Bot Starting...');
    console.log('─'.repeat(50));
    
    // Check for clear session command
    if (process.argv.includes('--clear-session')) {
        console.log('🗑️  Clearing session data...');
        await clearSession();
        console.log('✅ Session cleared. You can now run the bot normally.');
        process.exit(0);
    }
    
    // Validate configuration
    if (CONFIG.VPS_HOST === 'YOUR_VPS_IP_OR_DOMAIN') {
        console.log('⚠️  Please configure your VPS host in the CONFIG section');
        console.log('   Edit index.js and replace YOUR_VPS_IP_OR_DOMAIN with your actual VPS IP or domain');
        process.exit(1);
    }
    
    if (CONFIG.TARGET_WHATSAPP === 'YOUR_MAIN_WHATSAPP_NUMBER@s.whatsapp.net') {
        console.log('⚠️  Please configure your target WhatsApp number in the CONFIG section');
        console.log('   Edit index.js and replace YOUR_MAIN_WHATSAPP_NUMBER with your actual WhatsApp number');
        process.exit(1);
    }
    
    try {
        await connectToWhatsApp();
    } catch (error) {
        console.error('❌ Failed to start:', error);
        process.exit(1);
    }
}

// Start the bot
main().catch(console.error);
