const rateLimit = require('express-rate-limit');
const { AUTH_RATE_LIMIT, API_RATE_LIMIT } = require('../config/appConfig');

// Limiter ketat untuk endpoint autentikasi (login & register)
const authLimiter = rateLimit(AUTH_RATE_LIMIT);

// Limiter umum untuk seluruh endpoint API
const apiLimiter = rateLimit(API_RATE_LIMIT);

const exportLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: process.env.NODE_ENV === 'production' ? 5 : 100,
    message: { message: "Batas permintaan export tercapai. Silakan tunggu 1 menit sebelum mencoba lagi." }
});

module.exports = { authLimiter, apiLimiter, exportLimiter };
