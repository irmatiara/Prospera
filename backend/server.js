require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');

const { sequelize } = require('./models');
const { apiLimiter } = require('./middleware/rateLimiter');
const { CORS_ORIGIN, BODY_SIZE_LIMIT } = require('./config/appConfig');
const requestId = require('./middleware/requestId');
const logger = require('./utils/logger');

if (!process.env.JWT_SECRET) {
    console.error('\n❌ FATAL ERROR: JWT_SECRET belum dikonfigurasi di file .env!');
    console.error('   Server tidak dapat berjalan tanpa kunci rahasia JWT.\n');
    process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
    console.error('\n❌ FATAL ERROR: JWT_SECRET terlalu lemah! Minimal 32 karakter.');
    console.error('   Generate secret baru: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
    process.exit(1);
}

const app = express();

app.set('trust proxy', 1);

app.use(requestId);

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        // Jangan log health-check endpoint agar tidak flooding log
        if (req.originalUrl !== '/') {
            logger.http(req, res.statusCode, Date.now() - start);
        }
    });
    next();
});

// Layer 1: Helmet — Menyembunyikan identitas server & mencegah serangan injeksi header
app.use(helmet());

// Layer 1.5: Compression — Mengompresi response (Gzip/Brotli) untuk performa
app.use(compression());

// Layer 2: Cookie Parser — Mengekstrak HttpOnly cookies dari request
app.use(cookieParser());

// Layer 3: CORS — Membatasi akses hanya dari origin yang diizinkan
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://prospera-p7yhwoyjf-project-irma.vercel.app',
        'https://prospera-cdhoqccr4-project-irma.vercel.app',
        'https://prospera-phi-blue.vercel.app' 
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    credentials: true
}));

// Layer 3: Rate Limiter Global — Anti DDoS untuk seluruh endpoint API
app.use('/api', apiLimiter);

// Layer 4: Body Parser — Membatasi ukuran payload untuk mencegah serangan payload besar
app.use(express.json({ limit: BODY_SIZE_LIMIT }));

// Layer 5: Passport — Inisialisasi strategi autentikasi
const passport = require('./config/passport');
app.use(passport.initialize());

// ===== RUTE APLIKASI =====

// Mengimpor rute aplikasi
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const storeSettingRoutes = require('./routes/storeSettingRoutes');
const smartFeatureRoutes = require('./routes/smartFeatureRoutes');

// Mendaftarkan rute antarmuka pemrograman aplikasi ke dalam server
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/store-settings', storeSettingRoutes);
app.use('/api/smart-features', smartFeatureRoutes);

// Rute pengujian server
app.get('/', (req, res) => {
    res.status(200).json({ message: "Server Backend Prospera berjalan dengan baik." });
});

// Swagger UI untuk dokumentasi OpenAPI
const swaggerSpec = require('./docs/swagger.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ===== PENANGANAN ERROR =====

app.use((req, res) => {
    res.status(404).json({ message: "Endpoint yang Anda akses tidak tersedia." });
});

app.use((err, req, res, next) => {
    logger.error('Unhandled server error', {
        requestId: req.requestId || 'N/A',
        route: `${req.method} ${req.originalUrl}`,
        message: err.message,
        stack: err.stack,
        isOperational: err.isOperational || false
    });

    res.status(err.statusCode || 500).json({ 
        message: err.isOperational 
            ? err.message 
            : "Terjadi kesalahan internal sistem yang tidak terduga.",
        requestId: req.requestId
    });
});

// ===== KONEKSI DATABASE & START SERVER =====

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
    .then(() => {
        logger.info('Koneksi ke basis data MySQL (Sequelize) berhasil didirikan.');
        
        // Memulai Background Jobs (Cron)
        const { startCronJobs } = require('./jobs/cronJobs');
        startCronJobs();

        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info(`Server Node.js aktif (0.0.0.0:${PORT})`, {
                port: PORT,
                corsOrigin: CORS_ORIGIN,
                bodyLimit: BODY_SIZE_LIMIT,
                nodeEnv: process.env.NODE_ENV || 'development'
            });
        });

        const gracefulShutdown = (signal) => {
            console.log(`\n⚠️  Sinyal ${signal} diterima. Memulai graceful shutdown...`);
            server.close(() => {
                console.log('✅ Server HTTP ditutup.');
                sequelize.close()
                    .then(() => {
                        console.log('✅ Koneksi database ditutup.');
                        process.exit(0);
                    })
                    .catch((err) => {
                        console.error('❌ Gagal menutup koneksi database:', err);
                        process.exit(1);
                    });
            });

            setTimeout(() => {
                console.error('❌ Graceful shutdown timeout. Force exit.');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    })
    .catch((err) => {
        console.error('Gagal terhubung ke basis data:', err);
    });