const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion 
} = require('@whiskeysockets/baileys');
const P = require('pino');
const readline = require('readline');
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

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Logger
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

async function startWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    sock = makeWASocket({
        logger,
        auth: state,
        printQRInTerminal: false,
        browser: ['VPS Monitor Bot', 'Desktop', '1.0.0'],
        generateHighQualityLinkPreview: true,
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, isNewLogin } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log('🔄 Reconnecting...');
                await startWhatsApp();
            } else {
                console.log('❌ Connection closed. Please restart the bot.');
                process.exit(1);
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp connected successfully!');
            console.log(`📱 Logged in as: ${sock.user?.name || 'Unknown'}`);
            
            // Send test message
            try {
                await sock.sendMessage(CONFIG.TARGET_WHATSAPP, {
                    text: `🤖 VPS Monitor Bot Connected!\n\n✅ Bot is now monitoring your VPS: ${CONFIG.VPS_HOST}\n⏰ Started at: ${new Date().toLocaleString()}`
                });
                console.log('✅ Test message sent to your main WhatsApp!');
            } catch (error) {
                console.error('❌ Failed to send test message:', error.message);
            }
            
            startVpsMonitoring();
        }

        if (isNewLogin) {
            console.log('✅ New login successful!');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // If not registered, request pairing code
    if (!state.creds?.registered) {
        console.log('\n📱 WhatsApp not connected. Setting up pairing...');
        
        const phoneNumber = await askForPhoneNumber();
        
        try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log('\n' + '='.repeat(50));
            console.log(`🔑 PAIRING CODE: ${code}`);
            console.log('='.repeat(50));
            console.log(`\n📱 Steps to connect:`);
            console.log(`1. Open WhatsApp on your phone (+${phoneNumber})`);
            console.log(`2. Go to Settings → Linked Devices`);
            console.log(`3. Tap "Link a Device"`);
            console.log(`4. Tap "Link with phone number instead"`);
            console.log(`5. Enter the code: ${code}`);
            console.log(`\n⏳ Waiting for you to enter the code...`);
            
        } catch (error) {
            console.error('❌ Error requesting pairing code:', error);
            process.exit(1);
        }
    }
}

async function askForPhoneNumber() {
    return new Promise((resolve) => {
        rl.question('Enter your WhatsApp phone number (with country code, e.g., 919876543210): ', (number) => {
            const cleanNumber = number.replace(/[^0-9]/g, '');
            if (cleanNumber.length < 10) {
                console.log('❌ Invalid number. Please try again.');
                return askForPhoneNumber().then(resolve);
            }
            console.log(`📞 Using number: +${cleanNumber}`);
            resolve(cleanNumber);
        });
    });
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
    
    try {
        await startWhatsApp();
    } catch (error) {
        console.error('❌ Failed to start:', error);
        process.exit(1);
    }
}

// Start the bot
main().catch(console.error);
