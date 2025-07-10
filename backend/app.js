// Замените содержимое backend/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working!', timestamp: new Date().toISOString() });
});

// Routes with error handling
try {
  console.log('Loading routes...');

  // Admin routes first
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes loaded');

  // Other routes
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');

  const testRoutes = require('./routes/tests');
  app.use('/api/tests', testRoutes);
  console.log('✅ Test routes loaded');

  const sessionRoutes = require('./routes/sessions');
  app.use('/api/test', sessionRoutes);
  console.log('✅ Session routes loaded');

  const reportRoutes = require('./routes/reports');
  app.use('/api/reports', reportRoutes);
  console.log('✅ Report routes loaded');

  const dashboardRoutes = require('./routes/dashboard');
  app.use('/api/dashboard', dashboardRoutes);
  console.log('✅ Dashboard routes loaded');

  console.log('✅ All routes loaded successfully');

} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error('Stack:', error.stack);
}

// List all routes for debugging
app.get('/api/routes', (req, res) => {
  const routes = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Direct route
      routes.push({
        path: middleware.route.path,
        method: Object.keys(middleware.route.methods)[0].toUpperCase()
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = middleware.regexp.source
              .replace('^\\', '')
              .replace('\\/?(?=\\/|$)', '')
              .replace(/\\/g, '');
          routes.push({
            path: `${path}${handler.route.path}`,
            method: Object.keys(handler.route.methods)[0].toUpperCase()
          });
        }
      });
    }
  });

  res.json({ routes });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Route not found',
    url: req.url,
    method: req.method,
    hint: 'Check /api/routes for available endpoints'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Test API: http://localhost:${PORT}/api/test`);
  console.log(`👑 Admin test: http://localhost:${PORT}/api/admin/test`);
  console.log(`📋 Routes list: http://localhost:${PORT}/api/routes`);
});

module.exports = app;