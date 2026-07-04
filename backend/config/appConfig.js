require('dotenv').config();

module.exports = {
    AUTH_RATE_LIMIT: {
        windowMs: 15 * 60 * 1000,
        max: 10,                  
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            message: "Terlalu banyak percobaan dari IP ini. Silakan coba lagi setelah 15 menit."
        }
    },
    API_RATE_LIMIT: {
        windowMs: 15 * 60 * 1000, 
        max: 500,                 
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            message: "Terlalu banyak permintaan dari IP ini. Silakan coba lagi nanti."
        }
    },

    // --- Konfigurasi JWT ---
    JWT_EXPIRY: '1d',

    // --- Konfigurasi CORS ---
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

    // --- Konfigurasi Stok (Single Source of Truth) ---
    CRITICAL_THRESHOLD: 30,

    // --- Konfigurasi Body Parser ---
    BODY_SIZE_LIMIT: '10kb'
};
