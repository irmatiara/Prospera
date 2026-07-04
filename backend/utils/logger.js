const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

/**
 * Format log entry ke JSON terstruktur
 * @param {'error'|'warn'|'info'|'debug'} level
 * @param {string} message - Pesan log utama
 * @param {object} [meta] - Data tambahan (requestId, userId, route, dll.)
 */
const formatLog = (level, message, meta = {}) => {
    const now = new Date();
    const entry = {
        timestamp: now.toISOString(),  
        timestamp_wib: new Intl.DateTimeFormat('id-ID', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: false
        }).format(now) + ' WIB',
        level,
        message,
        service: 'prospera-backend',
        env: NODE_ENV,
        ...meta
    };

    // Di production: output JSON murni (untuk log aggregators)
    // Di development: output JSON ter-indent (lebih mudah dibaca developer)
    return IS_PRODUCTION
        ? JSON.stringify(entry)
        : JSON.stringify(entry, null, 2);
};

const logger = {
    /**
     * Log kesalahan yang memerlukan perhatian segera
     * @param {string} message
     * @param {object|Error} [metaOrError]
     */
    error: (message, metaOrError = {}) => {
        const meta = metaOrError instanceof Error
            ? { error: metaOrError.message, stack: metaOrError.stack }
            : metaOrError;
        console.error(formatLog('error', message, meta));
    },

    /**
     * Log kondisi tidak ideal tapi bukan error kritis
     * @param {string} message
     * @param {object} [meta]
     */
    warn: (message, meta = {}) => {
        console.warn(formatLog('warn', message, meta));
    },

    /**
     * Log informasi operasional normal (server start, koneksi DB, dll.)
     * @param {string} message
     * @param {object} [meta]
     */
    info: (message, meta = {}) => {
        console.log(formatLog('info', message, meta));
    },

    /**
     * Log detail debugging — di-suppress di production
     * @param {string} message
     * @param {object} [meta]
     */
    debug: (message, meta = {}) => {
        if (!IS_PRODUCTION) {
            console.log(formatLog('debug', message, meta));
        }
    },

    /**
     * Log HTTP request (untuk request logging middleware)
     * @param {import('express').Request} req
     * @param {number} statusCode
     * @param {number} durationMs
     */
    http: (req, statusCode, durationMs) => {
        const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        const now = new Date();
        const entry = {
            timestamp: now.toISOString(),   
            timestamp_wib: new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Jakarta',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
            }).format(now) + ' WIB',
            level,
            message: 'HTTP Request',
            service: 'prospera-backend',
            requestId: req.requestId,
            method: req.method,
            route: req.originalUrl,
            statusCode,
            durationMs,
            userId: req.user?.id || null,
            userRole: req.user?.role || null,
        };
        const output = IS_PRODUCTION ? JSON.stringify(entry) : JSON.stringify(entry, null, 2);
        if (level === 'error') console.error(output);
        else if (level === 'warn') console.warn(output);
        else console.log(output);
    }
};

module.exports = logger;
