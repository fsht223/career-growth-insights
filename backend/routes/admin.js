// Замените ПОЛНОСТЬЮ содержимое файла backend/routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const router = express.Router();

console.log('🔄 Admin routes file loaded');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test route - должен быть доступен по /api/admin/test
router.get('/test', (req, res) => {
    console.log('✅ Admin test route called');
    res.json({
        message: 'Admin routes are working!',
        timestamp: new Date().toISOString()
    });
});

// Login route - должен быть доступен по /api/admin/login
router.post('/login', async (req, res) => {
    console.log('🔐 Admin direct login attempt:', req.body);

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        console.log('🔍 Looking for admin with email:', email);

        const query = `
            SELECT id, email, password_hash, first_name, last_name, role, status
            FROM users
            WHERE email = $1 AND role = 'admin'
        `;

        const result = await pool.query(query, [email]);
        console.log('👤 Users found:', result.rows.length);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const admin = result.rows[0];
        console.log('👑 Admin found:', admin.email, 'Status:', admin.status);

        if (admin.status !== 'active') {
            return res.status(401).json({ error: 'Аккаунт администратора неактивен' });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        console.log('🔑 Password valid:', isValidPassword);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful for:', admin.email);

        res.json({
            token,
            user: {
                id: admin.id,
                email: admin.email,
                firstName: admin.first_name,
                lastName: admin.last_name,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('❌ Admin login error:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// Auth login route для совместимости с фронтендом
router.post('/auth/login', async (req, res) => {
    console.log('🔐 Admin auth/login attempt:', req.body);

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        console.log('🔍 Looking for admin with email:', email);

        const query = `
            SELECT id, email, password_hash, first_name, last_name, role, status
            FROM users
            WHERE email = $1 AND role = 'admin'
        `;

        const result = await pool.query(query, [email]);
        console.log('👤 Users found:', result.rows.length);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const admin = result.rows[0];
        console.log('👑 Admin found:', admin.email, 'Status:', admin.status);

        if (admin.status !== 'active') {
            return res.status(401).json({ error: 'Аккаунт администратора неактивен' });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        console.log('🔑 Password valid:', isValidPassword);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: admin.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Login successful for:', admin.email);

        res.json({
            token,
            user: {
                id: admin.id,
                email: admin.email,
                firstName: admin.first_name,
                lastName: admin.last_name,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('❌ Admin login error:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    console.log('🚪 Admin logout');
    // В статeless JWT системе logout просто происходит на фронтенде
    // Здесь можно добавить логирование
    res.json({ message: 'Успешный выход' });
});

// Auth logout route
router.post('/auth/logout', (req, res) => {
    console.log('🔀 Redirecting /auth/logout to /logout');
    req.url = '/logout';
    router.handle(req, res);
});

// Verify token route - должен быть доступен по /api/admin/verify
router.get('/verify', async (req, res) => {
    console.log('🔍 Admin verify attempt');

    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const query = `
      SELECT id, email, first_name, last_name, role, status
      FROM users 
      WHERE id = $1 AND role = 'admin'
    `;

        const result = await pool.query(query, [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Недействительный токен' });
        }

        const admin = result.rows[0];

        if (admin.status !== 'active') {
            return res.status(401).json({ error: 'Аккаунт администратора неактивен' });
        }

        console.log('✅ Token verified for:', admin.email);

        res.json({
            user: {
                id: admin.id,
                email: admin.email,
                firstName: admin.first_name,
                lastName: admin.last_name,
                role: admin.role
            }
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Токен истек' });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Недействительный токен' });
        }

        console.error('❌ Token verification error:', error);
        res.status(500).json({ error: 'Ошибка сервера при проверке токена' });
    }
});

// Auth verify route (альтернативный путь)
router.get('/auth/verify', (req, res) => {
    console.log('🔀 Redirecting /auth/verify to /verify');
    // Копируем заголовки и вызываем основной verify
    req.url = '/verify';
    router.handle(req, res);
});

console.log('✅ Admin routes configured');

module.exports = router;