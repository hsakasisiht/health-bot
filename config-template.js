// Configuration Template
// Copy these settings to the CONFIG section in index.js

const CONFIG = {
    // Replace with your VPS IP address or domain name
    // Examples: '192.168.1.100', 'myserver.com', 'vps.example.com'
    VPS_HOST: 'YOUR_VPS_IP_OR_DOMAIN',
    
    // Replace with your main WhatsApp number (the one that will receive alerts)
    // Format: 'countrycode+number@s.whatsapp.net'
    // Examples: '12345678901@s.whatsapp.net' (US number), '919876543210@s.whatsapp.net' (India number)
    TARGET_WHATSAPP: 'YOUR_MAIN_WHATSAPP_NUMBER@s.whatsapp.net',
    
    // How often to check VPS status (in milliseconds)
    PING_INTERVAL: 10000, // 10 seconds
    
    // How many failed pings before considering VPS offline
    OFFLINE_THRESHOLD: 3,
};

// Example of properly configured settings:
/*
const CONFIG = {
    VPS_HOST: '192.168.1.100',
    TARGET_WHATSAPP: '12345678901@s.whatsapp.net',
    PING_INTERVAL: 10000,
    OFFLINE_THRESHOLD: 3,
};
*/
