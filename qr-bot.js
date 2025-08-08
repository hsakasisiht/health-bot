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
    VPS_HOST: '103.180.213.240',  // Your VPS IP
    TARGET_WHATSAPP: '919675893215@s.whatsapp.net',  // Your main WhatsApp number (who receives alerts)
    PING_INTERVAL: 5000, // 5 seconds
    OFFLINE_THRESHOLD: 3, // Consider offline after 3 failed pings
    LOG_CLEAR_INTERVAL: 3600000, // 1 hour in milliseconds
};

let sock;
let consecutiveFailures = 0;
let isVpsOffline = false;
let logCount = 0;
let startTime = new Date();
// Removed cooldown - will send alert every time VPS is detected as offline

// Logger (silent to avoid clutter)
const logger = P({ level: 'silent' });

// Function to clear console and show summary
function clearConsoleWithSummary() {
    const currentTime = new Date();
    const uptime = Math.floor((currentTime - startTime) / 1000 / 60); // minutes
    
    console.clear();
    console.log('🤖 VPS Monitor Bot - Console Cleared');
    console.log('═'.repeat(50));
    console.log(`📊 Bot Status Summary:`);
    console.log(`⏰ Started: ${startTime.toLocaleString()}`);
    console.log(`📈 Uptime: ${uptime} minutes`);
    console.log(`🌐 Monitoring: ${CONFIG.VPS_HOST}`);
    console.log(`📱 Alerts to: ${CONFIG.TARGET_WHATSAPP}`);
    console.log(`🔍 Check Interval: ${CONFIG.PING_INTERVAL / 1000}s`);
    console.log(`🚨 Current Status: ${isVpsOffline ? '🔴 OFFLINE' : '🟢 ONLINE'}`);
    console.log(`📊 Failed Pings: ${consecutiveFailures}`);
    console.log(`🧹 Last Cleared: ${currentTime.toLocaleString()}`);
    console.log('═'.repeat(50));
    console.log('📝 Recent activity will appear below...\n');
    
    logCount = 0; // Reset log counter
}

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
    const { state, saveCreds } = await useMultiFileAuthState('./session');

    sock = makeWASocket({
        logger,
        auth: state,
        browser: ['VPS Monitor Bot', 'Desktop', '1.0.0'],
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📱 QR Code generated! Scan it with your WhatsApp:');
            qrcode.generate(qr, { small: true });
            console.log('1. Open WhatsApp on your phone');
            console.log('2. Go to Settings → Linked Devices');
            console.log('3. Tap "Link a Device"');
            console.log('4. Scan the QR code above\n');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            if (shouldReconnect) {
                console.log('🔄 Reconnecting to WhatsApp...');
                setTimeout(() => connectToWhatsApp(), 3000);
            } else {
                console.log('❌ Logged out. Please restart the bot to reconnect.');
                process.exit(1);
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp connected successfully!');
            console.log(`📱 Connected as: ${sock.user?.name || sock.user?.id || 'Unknown'}`);
            
            // Send test message to confirm connection
            try {
                const testMessage = `🤖 VPS Monitor Bot Connected!\n\n` +
                                  `✅ Bot is now monitoring your VPS\n` +
                                  `🌐 Host: ${CONFIG.VPS_HOST}\n` +
                                  `⏰ Started: ${new Date().toLocaleString()}\n` +
                                  `🔔 You'll receive alerts if VPS goes offline`;
                
                await sock.sendMessage(CONFIG.TARGET_WHATSAPP, { text: testMessage });
                console.log('✅ Test message sent to your WhatsApp!');
            } catch (error) {
                console.error('❌ Failed to send test message:', error.message);
                console.log('⚠️  Check if the target WhatsApp number is correct in CONFIG');
            }
            
            // Start VPS monitoring
            startVpsMonitoring();
        }
    });

    sock.ev.on('creds.update', saveCreds);
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
        if (!sock || !sock.user) {
            console.log('❌ WhatsApp not connected');
            return false;
        }

        await sock.sendMessage(CONFIG.TARGET_WHATSAPP, { text: message });
        console.log('✅ Alert sent to WhatsApp');
        return true;
    } catch (error) {
        console.error('❌ Failed to send WhatsApp message:', error.message);
        return false;
    }
}

async function checkVpsStatus() {
    const timestamp = new Date().toLocaleString();
    const isOnline = await pingVps();
    
    logCount++; // Increment log counter
    
    if (isOnline) {
        if (isVpsOffline) {
            // VPS came back online
            consecutiveFailures = 0;
            isVpsOffline = false;
            const message = `🟢 VPS BACK ONLINE!\n\n` +
                          `🌐 Host: ${CONFIG.VPS_HOST}\n` +
                          `⏰ Recovery Time: ${timestamp}\n` +
                          `✅ Server is responding normally`;
            
            await sendWhatsAppAlert(message);
            console.log(`🟢 ${timestamp} - VPS is back online!`);
        } else {
            // Only show online status every 20 checks (every 100 seconds) to reduce logs
            if (logCount % 20 === 0) {
                console.log(`🟢 ${timestamp} - VPS is online (${logCount} checks)`);
            }
        }
    } else {
        consecutiveFailures++;
        console.log(`🔴 ${timestamp} - VPS ping failed (${consecutiveFailures}/${CONFIG.OFFLINE_THRESHOLD})`);
        
        if (consecutiveFailures >= CONFIG.OFFLINE_THRESHOLD) {
            // VPS is considered offline - send alert every time
            const message = `🚨 VPS OFFLINE ALERT!\n\n` +
                          `🌐 Host: ${CONFIG.VPS_HOST}\n` +
                          `⏰ Check Time: ${timestamp}\n` +
                          `❌ Failed Pings: ${consecutiveFailures}\n` +
                          `⚠️ Please check your VPS immediately!`;
            
            await sendWhatsAppAlert(message);
            
            if (!isVpsOffline) {
                isVpsOffline = true;
                console.log(`🚨 ${timestamp} - VPS OFFLINE! First alert sent.`);
            } else {
                console.log(`🚨 ${timestamp} - VPS STILL OFFLINE! Alert sent again.`);
            }
        }
    }
}

function startVpsMonitoring() {
    console.log('\n' + '='.repeat(50));
    console.log('🔍 VPS MONITORING STARTED');
    console.log('='.repeat(50));
    console.log(`🌐 VPS Host: ${CONFIG.VPS_HOST}`);
    console.log(`⏱️  Check Interval: ${CONFIG.PING_INTERVAL / 1000} seconds`);
    console.log(`📱 Alert Destination: ${CONFIG.TARGET_WHATSAPP}`);
    console.log(`🔔 Offline Threshold: ${CONFIG.OFFLINE_THRESHOLD} failed pings`);
    console.log(`🚨 Alert Mode: IMMEDIATE (no cooldown)`);
    console.log(`🧹 Console clears every: ${CONFIG.LOG_CLEAR_INTERVAL / 1000 / 60} minutes`);
    console.log('='.repeat(50));
    
    // Initial check
    checkVpsStatus();
    
    // Set up periodic monitoring
    const monitorInterval = setInterval(checkVpsStatus, CONFIG.PING_INTERVAL);
    
    // Set up periodic console clearing
    const clearLogsInterval = setInterval(() => {
        clearConsoleWithSummary();
    }, CONFIG.LOG_CLEAR_INTERVAL);
    
    // Initial console clear after 5 minutes to show the system is working
    setTimeout(() => {
        console.log('\n💡 Console will be cleared every hour to optimize performance...');
    }, 5 * 60 * 1000);
    
    // Graceful shutdown for PM2
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down VPS monitor...');
        clearInterval(monitorInterval);
        clearInterval(clearLogsInterval);
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 PM2 shutdown signal received...');
        clearInterval(monitorInterval);
        clearInterval(clearLogsInterval);
        process.exit(0);
    });
}

// Main function
async function main() {
    console.log('🤖 VPS Monitor Bot Starting...');
    console.log('─'.repeat(50));
    
    // Check for clear session command
    if (process.argv.includes('--clear-session')) {
        console.log('🗑️  Clearing session data...');
        await clearSession();
        console.log('✅ Session cleared. Run "npm start" to start fresh.');
        process.exit(0);
    }
    
    console.log('📱 Initializing WhatsApp connection...');
    console.log('💡 A QR code will appear - scan it with your WhatsApp\n');
    
    try {
        await connectToWhatsApp();
    } catch (error) {
        console.error('❌ Failed to start WhatsApp connection:', error);
        console.log('💡 Try running: npm start -- --clear-session');
        process.exit(1);
    }
}

// Start the bot
main().catch((error) => {
    console.error('❌ Bot crashed:', error);
    process.exit(1);
});
