// backend/routes/admin-auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        const query = `
      SELECT id, email, password_hash, first_name, last_name, role, status
      FROM users 
      WHERE email = $1 AND role = 'admin'
    `;

        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }

        const admin = result.rows[0];

        if (admin.status !== 'active') {
            return res.status(401).json({ error: 'Аккаунт администратора неактивен' });
        }

        const isValidPassword = await bcrypt.compare(password, admin.password_hash);

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

        const logQuery = `
      INSERT INTO admin_audit_log (admin_id, action, details, ip_address)
      VALUES ($1, $2, $3, $4)
    `;

        const ipAddress = req.ip || req.connection.remoteAddress;
        const loginDetails = {
            login_time: new Date().toISOString(),
            user_agent: req.get('User-Agent'),
            ip_address: ipAddress
        };

        await pool.query(logQuery, [
            admin.id,
            'admin_login',
            JSON.stringify(loginDetails),
            ipAddress
        ]);

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
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Ошибка сервера при входе' });
    }
});

// Verify admin token
router.get('/verify', async (req, res) => {
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

        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Ошибка сервера при проверке токена' });
    }
});

// Admin logout
router.post('/logout', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);

                const logQuery = `
          INSERT INTO admin_audit_log (admin_id, action, details, ip_address)
          VALUES ($1, $2, $3, $4)
        `;

                const ipAddress = req.ip || req.connection.remoteAddress;
                const logoutDetails = {
                    logout_time: new Date().toISOString(),
                    user_agent: req.get('User-Agent'),
                    ip_address: ipAddress
                };

                await pool.query(logQuery, [
                    decoded.id,
                    'admin_logout',
                    JSON.stringify(logoutDetails),
                    ipAddress
                ]);
            } catch (tokenError) {
            
            }
        }

        res.json({ message: 'Выход выполнен успешно' });

    } catch (error) {
        console.error('Admin logout error:', error);
        res.status(500).json({ error: 'Ошибка сервера при выходе' });
    }
});

// Change admin password
router.post('/change-password', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const { currentPassword, newPassword } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Текущий и новый пароль обязательны' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Новый пароль должен содержать минимум 8 символов' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const adminQuery = `
      SELECT id, email, password_hash, first_name, last_name
      FROM users 
      WHERE id = $1 AND role = 'admin' AND status = 'active'
    `;

        const adminResult = await pool.query(adminQuery, [decoded.id]);

        if (adminResult.rows.length === 0) {
            return res.status(401).json({ error: 'Недействительный токен' });
        }

        const admin = adminResult.rows[0];

        const isValidPassword = await bcrypt.compare(currentPassword, admin.password_hash);

        if (!isValidPassword) {
            return res.status(400).json({ error: 'Неверный текущий пароль' });
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        const updateQuery = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

        await pool.query(updateQuery, [hashedPassword, admin.id]);

        const logQuery = `
      INSERT INTO admin_audit_log (admin_id, action, details, ip_address)
      VALUES ($1, $2, $3, $4)
    `;

        const ipAddress = req.ip || req.connection.remoteAddress;
        const changeDetails = {
            change_time: new Date().toISOString(),
            user_agent: req.get('User-Agent'),
            ip_address: ipAddress
        };

        await pool.query(logQuery, [
            admin.id,
            'password_changed',
            JSON.stringify(changeDetails),
            ipAddress
        ]);

        res.json({ message: 'Пароль успешно изменен' });

    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Недействительный токен' });
        }

        console.error('Password change error:', error);
        res.status(500).json({ error: 'Ошибка сервера при смене пароля' });
    }
});

// Get admin profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const adminQuery = `
      SELECT 
        u.id, 
        u.email, 
        u.first_name, 
        u.last_name, 
        u.role, 
        u.status,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT c.id) as coaches_created,
        COUNT(DISTINCT t.id) as tests_managed,
        (SELECT COUNT(*) FROM admin_audit_log WHERE admin_id = u.id) as total_actions
      FROM users u
      LEFT JOIN users c ON u.id = c.id AND c.role = 'coach'
      LEFT JOIN tests t ON u.id = t.coach_id
      WHERE u.id = $1 AND u.role = 'admin'
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.status, u.created_at, u.updated_at
    `;

        const result = await pool.query(adminQuery, [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Недействительный токен' });
        }

        const admin = result.rows[0];

        if (admin.status !== 'active') {
            return res.status(401).json({ error: 'Аккаунт администратора неактивен' });
        }

        const activityQuery = `
      SELECT action, details, created_at
      FROM admin_audit_log 
      WHERE admin_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

        const activityResult = await pool.query(activityQuery, [admin.id]);

        res.json({
            profile: {
                id: admin.id,
                email: admin.email,
                firstName: admin.first_name,
                lastName: admin.last_name,
                role: admin.role,
                status: admin.status,
                createdAt: admin.created_at,
                updatedAt: admin.updated_at,
                stats: {
                    coachesCreated: parseInt(admin.coaches_created),
                    testsManaged: parseInt(admin.tests_managed),
                    totalActions: parseInt(admin.total_actions)
                }
            },
            recentActivity: activityResult.rows
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Недействительный токен' });
        }

        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении профиля' });
    }
});

// Initialize default admin (run once)
router.post('/init-admin', async (req, res) => {
    try {
        const checkQuery = `SELECT COUNT(*) as count FROM users WHERE role = 'admin'`;
        const checkResult = await pool.query(checkQuery);

        if (parseInt(checkResult.rows[0].count) > 0) {
            return res.status(400).json({ error: 'Администратор уже существует' });
        }

        const hashedPassword = await bcrypt.hash('Admin123!', 12);

        const insertQuery = `
      INSERT INTO users (email, password_hash, first_name, last_name, role, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, first_name, last_name, role
    `;

        const result = await pool.query(insertQuery, [
            'admin@system.local',
            hashedPassword,
            'System',
            'Administrator',
            'admin',
            'active'
        ]);

        const admin = result.rows[0];

        const logQuery = `
      INSERT INTO admin_audit_log (admin_id, action, details)
      VALUES ($1, $2, $3)
    `;

        await pool.query(logQuery, [
            admin.id,
            'admin_created',
            JSON.stringify({
                created_at: new Date().toISOString(),
                created_by: 'system_init'
            })
        ]);

        res.json({
            message: 'Администратор успешно создан',
            admin: {
                id: admin.id,
                email: admin.email,
                firstName: admin.first_name,
                lastName: admin.last_name,
                role: admin.role
            },
            defaultCredentials: {
                email: 'admin@system.local',
                password: 'Admin123!'
            }
        });

    } catch (error) {
        console.error('Admin initialization error:', error);
        res.status(500).json({ error: 'Ошибка создания администратора' });
    }
});

module.exports = router;