// backend/routes/activation.js
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

// Verify activation token
router.get('/verify-activation/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Токен активации обязателен' });
        }

        const query = `
            SELECT id, email, first_name, last_name, status, created_at
            FROM users
            WHERE activation_token = $1 AND role = 'coach'
        `;

        const result = await pool.query(query, [token]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Недействительный токен активации' });
        }

        const coach = result.rows[0];

        if (coach.status === 'active') {
            return res.status(400).json({ error: 'Аккаунт уже активирован' });
        }

        const tokenAge = Date.now() - new Date(coach.created_at).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (tokenAge > maxAge) {
            return res.status(400).json({ error: 'Токен активации истек' });
        }

        res.json({
            coach: {
                id: coach.id,
                email: coach.email,
                firstName: coach.first_name,
                lastName: coach.last_name
            }
        });

    } catch (error) {
        console.error('Error verifying activation token:', error);
        res.status(500).json({ error: 'Ошибка при проверке токена' });
    }
});

// Activate account
router.post('/activate', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Токен и пароль обязательны' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Пароль должен содержать минимум 8 символов' });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const coachQuery = `
                SELECT id, email, first_name, last_name, status, created_at
                FROM users
                WHERE activation_token = $1 AND role = 'coach'
            `;

            const coachResult = await client.query(coachQuery, [token]);

            if (coachResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Недействительный токен активации' });
            }

            const coach = coachResult.rows[0];

            if (coach.status === 'active') {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Аккаунт уже активирован' });
            }

            const tokenAge = Date.now() - new Date(coach.created_at).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            if (tokenAge > maxAge) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Токен активации истек' });
            }

            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const updateQuery = `
                UPDATE users
                SET password_hash = $1, status = 'active', activation_token = NULL
                WHERE id = $2
                    RETURNING id, email, first_name, last_name, status
            `;

            const updateResult = await client.query(updateQuery, [hashedPassword, coach.id]);

            const logQuery = `
                INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
                VALUES ($1, $2, $3, $4, $5)
            `;

            await client.query(logQuery, [
                coach.id,
                'account_activated',
                'coach',
                coach.id,
                JSON.stringify({
                    email: coach.email,
                    activated_at: new Date().toISOString()
                })
            ]);

            await client.query('COMMIT');

            res.json({
                message: 'Аккаунт успешно активирован',
                coach: updateResult.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error activating account:', error);
        res.status(500).json({ error: 'Ошибка при активации аккаунта' });
    }
});

// Password reset request
router.post('/reset-password-request', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }

        const query = `
            SELECT id, email, first_name, last_name, status
            FROM users
            WHERE email = $1 AND role = 'coach'
        `;

        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.json({ message: 'Если аккаунт существует, на email будет отправлена ссылка для сброса пароля' });
        }

        const coach = result.rows[0];

        if (coach.status !== 'active') {
            return res.status(400).json({ error: 'Аккаунт не активирован' });
        }

        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

        const updateQuery = `
            UPDATE users
            SET reset_token = $1, reset_token_expiry = $2
            WHERE id = $3
        `;

        await pool.query(updateQuery, [resetToken, resetExpiry, coach.id]);

        res.json({ message: 'Ссылка для сброса пароля отправлена на email' });

    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ error: 'Ошибка при запросе сброса пароля' });
    }
});

// Verify reset token
router.get('/verify-reset/:token', async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Токен сброса обязателен' });
        }

        const query = `
            SELECT id, email, first_name, last_name, reset_token_expiry
            FROM users
            WHERE reset_token = $1 AND role = 'coach'
        `;

        const result = await pool.query(query, [token]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Недействительный токен сброса' });
        }

        const coach = result.rows[0];

        if (new Date() > new Date(coach.reset_token_expiry)) {
            return res.status(400).json({ error: 'Токен сброса истек' });
        }

        res.json({
            coach: {
                id: coach.id,
                email: coach.email,
                firstName: coach.first_name,
                lastName: coach.last_name
            }
        });

    } catch (error) {
        console.error('Error verifying reset token:', error);
        res.status(500).json({ error: 'Ошибка при проверке токена сброса' });
    }
});

// Reset password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Токен и пароль обязательны' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Пароль должен содержать минимум 8 символов' });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const coachQuery = `
                SELECT id, email, first_name, last_name, reset_token_expiry
                FROM users
                WHERE reset_token = $1 AND role = 'coach'
            `;

            const coachResult = await client.query(coachQuery, [token]);

            if (coachResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Недействительный токен сброса' });
            }

            const coach = coachResult.rows[0];

            if (new Date() > new Date(coach.reset_token_expiry)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Токен сброса истек' });
            }

            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const updateQuery = `
                UPDATE users
                SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL
                WHERE id = $2
                    RETURNING id, email, first_name, last_name
            `;

            const updateResult = await client.query(updateQuery, [hashedPassword, coach.id]);

            const logQuery = `
                INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details)
                VALUES ($1, $2, $3, $4, $5)
            `;

            await client.query(logQuery, [
                coach.id,
                'password_reset',
                'coach',
                coach.id,
                JSON.stringify({
                    email: coach.email,
                    reset_at: new Date().toISOString()
                })
            ]);

            await client.query('COMMIT');

            res.json({
                message: 'Пароль успешно сброшен',
                coach: updateResult.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Ошибка при сбросе пароля' });
    }
});

// Resend activation email
router.post('/resend-activation', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email обязателен' });
        }

        const query = `
            SELECT id, email, first_name, last_name, status, activation_token
            FROM users
            WHERE email = $1 AND role = 'coach'
        `;

        const result = await pool.query(query, [email]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Коуч с таким email не найден' });
        }

        const coach = result.rows[0];

        if (coach.status === 'active') {
            return res.status(400).json({ error: 'Аккаунт уже активирован' });
        }

        if (!coach.activation_token) {
            return res.status(400).json({ error: 'Токен активации отсутствует' });
        }

        res.json({ message: 'Письмо активации отправлено повторно' });

    } catch (error) {
        console.error('Error resending activation email:', error);
        res.status(500).json({ error: 'Ошибка при отправке письма активации' });
    }
});

module.exports = router;