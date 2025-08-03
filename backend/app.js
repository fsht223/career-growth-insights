// Улучшенная версия CORS настроек в backend/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Безопасные CORS настройки в зависимости от окружения
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

let allowedOrigins = [];

if (isDevelopment) {
  // В разработке разрешаем localhost
  allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:80',
    process.env.FRONTEND_URL
  ];
} else if (isProduction) {
  // В продакшене только официальные домены
  allowedOrigins = [
    'https://ditum.kz',
    'https://www.ditum.kz',
    process.env.FRONTEND_URL
  ];
} else {
  // Fallback - используем переменную окружения
  allowedOrigins = [process.env.FRONTEND_URL];
}

// Убираем undefined значения и добавляем fallback
allowedOrigins = allowedOrigins.filter(Boolean);

// Fallback для случая, когда FRONTEND_URL не установлен
if (allowedOrigins.length === 0) {
  if (isDevelopment) {
    allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
  } else {
    allowedOrigins = ['https://ditum.kz', 'https://www.ditum.kz'];
  }
}

const corsOptions = {
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  }
}));

app.use(cors(corsOptions));
app.use(morgan(isDevelopment ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check с информацией о CORS
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: isDevelopment ? allowedOrigins : ['***masked for security***'],
      requestOrigin: req.headers.origin || 'none'
    },
    version: '1.0.0'
  });
});

// Остальной код остается таким же...
// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Routes loading...
try {
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);

  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);

  const testRoutes = require('./routes/tests');
  app.use('/api/tests', testRoutes);

  const sessionRoutes = require('./routes/sessions');
  app.use('/api/test', sessionRoutes);

  const reportRoutes = require('./routes/reports');
  app.use('/api/reports', reportRoutes);

  const dashboardRoutes = require('./routes/dashboard');
  app.use('/api/dashboard', dashboardRoutes);


} catch (error) {
  console.error('❌ Error loading routes:', error.message);
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    url: req.url,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;