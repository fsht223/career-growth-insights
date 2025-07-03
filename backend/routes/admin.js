// backend/routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const router = express.Router();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Email service setup
const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await pool.query('SELECT * FROM users WHERE id = $1 AND role = $2', [decoded.id, 'admin']);

        if (user.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }

        req.user = user.rows[0];
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// Get admin dashboard statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const { from_date, to_date } = req.query;

        const totalTestsQuery = `
            SELECT COUNT(*) as total_tests,
                   COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tests,
                   COUNT(CASE WHEN status = 'created' OR status = 'in_progress' THEN 1 END) as active_tests
            FROM tests
            WHERE created_at >= $1 AND created_at <= $2
        `;

        const coachesQuery = `
            SELECT COUNT(*) as total_coaches,
                   COUNT(CASE WHEN role = 'coach' THEN 1 END) as active_coaches
            FROM users WHERE role = 'coach'
        `;

        const participantsQuery = `
            SELECT COUNT(DISTINCT email) as total_participants,
                   AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_completion_time
            FROM test_sessions
            WHERE completed = true AND started_at >= $1 AND started_at <= $2
        `;

        const fromDate = from_date || '2024-01-01';
        const toDate = to_date || new Date().toISOString().split('T')[0];

        const [testsResult, coachesResult, participantsResult] = await Promise.all([
            pool.query(totalTestsQuery, [fromDate, toDate]),
            pool.query(coachesQuery),
            pool.query(participantsQuery, [fromDate, toDate])
        ]);

        const stats = {
            totalTests: parseInt(testsResult.rows[0].total_tests),
            completedTests: parseInt(testsResult.rows[0].completed_tests),
            activeTests: parseInt(testsResult.rows[0].active_tests),
            totalCoaches: parseInt(coachesResult.rows[0].total_coaches),
            activeCoaches: parseInt(coachesResult.rows[0].active_coaches),
            totalParticipants: parseInt(participantsResult.rows[0].total_participants),
            avgCompletionTime: parseFloat(participantsResult.rows[0].avg_completion_time || 0)
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Create new coach
router.post('/coaches', authenticateAdmin, async (req, res) => {
    try {
        const { email, firstName, lastName, password } = req.body;

        if (!email || !firstName || !lastName || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Coach with this email already exists' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const activationToken = crypto.randomBytes(32).toString('hex');

        const insertQuery = `
            INSERT INTO users (email, password_hash, first_name, last_name, role, activation_token, status)
            VALUES ($1, $2, $3, $4, 'coach', $5, 'pending')
                RETURNING id, email, first_name, last_name, role, status, created_at
        `;

        const result = await pool.query(insertQuery, [email, hashedPassword, firstName, lastName, activationToken]);
        const newCoach = result.rows[0];

        const activationLink = `${process.env.FRONTEND_URL}/activate/${activationToken}`;
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Добро пожаловать в систему тестирования!</h2>
        <p>Здравствуйте, ${firstName} ${lastName}!</p>
        <p>Для вас был создан аккаунт коуча в системе тестирования. Для активации аккаунта перейдите по ссылке:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Активировать аккаунт
          </a>
        </div>
        <p>Или скопируйте и вставьте эту ссылку в браузер:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 3px;">
          ${activationLink}
        </p>
        <p>Ваши данные для входа:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Пароль:</strong> тот, который был установлен администратором</li>
        </ul>
        <p>После активации вы сможете войти в систему и начать создавать тесты.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Если вы не регистрировались в системе, просто проигнорируйте это письмо.
        </p>
      </div>
    `;

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Активация аккаунта коуча',
            html: emailHtml
        });

        res.status(201).json({
            message: 'Coach created successfully. Activation email sent.',
            coach: newCoach
        });

    } catch (error) {
        console.error('Error creating coach:', error);
        res.status(500).json({ error: 'Failed to create coach' });
    }
});

// Get all coaches
router.get('/coaches', authenticateAdmin, async (req, res) => {
    try {
        const query = `
            SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.created_at,
                   COUNT(t.id) as tests_created
            FROM users u
                     LEFT JOIN tests t ON u.id = t.coach_id
            WHERE u.role = 'coach'
            GROUP BY u.id, u.email, u.first_name, u.last_name, u.status, u.created_at
            ORDER BY u.created_at DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching coaches:', error);
        res.status(500).json({ error: 'Failed to fetch coaches' });
    }
});

// Update coach status
router.put('/coaches/:id/status', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const query = 'UPDATE users SET status = $1 WHERE id = $2 AND role = $3 RETURNING *';
        const result = await pool.query(query, [status, id, 'coach']);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating coach status:', error);
        res.status(500).json({ error: 'Failed to update coach status' });
    }
});

// Delete coach
router.delete('/coaches/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const testsCheck = await pool.query('SELECT COUNT(*) FROM tests WHERE coach_id = $1', [id]);
        const testCount = parseInt(testsCheck.rows[0].count);

        if (testCount > 0) {
            return res.status(400).json({
                error: `Cannot delete coach. They have ${testCount} tests associated with their account.`
            });
        }

        const query = 'DELETE FROM users WHERE id = $1 AND role = $2 RETURNING *';
        const result = await pool.query(query, [id, 'coach']);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        res.json({ message: 'Coach deleted successfully' });
    } catch (error) {
        console.error('Error deleting coach:', error);
        res.status(500).json({ error: 'Failed to delete coach' });
    }
});

// Send password reset email
router.post('/coaches/:id/reset-password', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const coachQuery = 'SELECT email, first_name, last_name FROM users WHERE id = $1 AND role = $2';
        const coachResult = await pool.query(coachQuery, [id, 'coach']);

        if (coachResult.rows.length === 0) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        const coach = coachResult.rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpiry = new Date(Date.now() + 3600000); // 1 hour

        await pool.query(
            'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
            [resetToken, resetExpiry, id]
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Сброс пароля</h2>
        <p>Здравствуйте, ${coach.first_name} ${coach.last_name}!</p>
        <p>Администратор инициировал сброс пароля для вашего аккаунта. Для создания нового пароля перейдите по ссылке:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Сбросить пароль
          </a>
        </div>
        <p>Ссылка действительна в течение 1 часа.</p>
        <p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>
      </div>
    `;

        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: coach.email,
            subject: 'Сброс пароля',
            html: emailHtml
        });

        res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        console.error('Error sending password reset:', error);
        res.status(500).json({ error: 'Failed to send password reset email' });
    }
});

// Get questions management
router.get('/questions', authenticateAdmin, async (req, res) => {
    try {
        const { language = 'ru' } = req.query;

        const query = `
            SELECT id, question_text, motivational_group, category, language, created_at
            FROM questions
            WHERE language = $1
            ORDER BY id
        `;

        const result = await pool.query(query, [language]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Add/Update question
router.post('/questions', authenticateAdmin, async (req, res) => {
    try {
        const { id, text, group, category, language } = req.body;

        if (!text || !group || !category || !language) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let query, params;

        if (id) {
            query = `
                UPDATE questions
                SET question_text = $1, motivational_group = $2, category = $3, language = $4
                WHERE id = $5
                    RETURNING *
            `;
            params = [text, group, category, language, id];
        } else {
            query = `
                INSERT INTO questions (question_text, motivational_group, category, language)
                VALUES ($1, $2, $3, $4)
                    RETURNING *
            `;
            params = [text, group, category, language];
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving question:', error);
        res.status(500).json({ error: 'Failed to save question' });
    }
});

// Delete question
router.delete('/questions/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM questions WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

// Get golden lines
router.get('/golden-lines', authenticateAdmin, async (req, res) => {
    try {
        const { language = 'ru' } = req.query;

        const query = `
            SELECT id, profession, golden_line_values, language, created_at
            FROM golden_lines
            WHERE language = $1
            ORDER BY profession
        `;

        const result = await pool.query(query, [language]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching golden lines:', error);
        res.status(500).json({ error: 'Failed to fetch golden lines' });
    }
});

// Add/Update golden line
router.post('/golden-lines', authenticateAdmin, async (req, res) => {
    try {
        const { id, profession, values, language } = req.body;

        if (!profession || !values || !language) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let query, params;

        if (id) {
            query = `
                UPDATE golden_lines
                SET profession = $1, golden_line_values = $2, language = $3
                WHERE id = $4
                    RETURNING *
            `;
            params = [profession, JSON.stringify(values), language, id];
        } else {
            query = `
                INSERT INTO golden_lines (profession, golden_line_values, language)
                VALUES ($1, $2, $3)
                    RETURNING *
            `;
            params = [profession, JSON.stringify(values), language];
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving golden line:', error);
        res.status(500).json({ error: 'Failed to save golden line' });
    }
});

// Delete golden line
router.delete('/golden-lines/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const query = 'DELETE FROM golden_lines WHERE id = $1 RETURNING *';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Golden line not found' });
        }

        res.json({ message: 'Golden line deleted successfully' });
    } catch (error) {
        console.error('Error deleting golden line:', error);
        res.status(500).json({ error: 'Failed to delete golden line' });
    }
});

// Get test results with filtering
router.get('/test-results', authenticateAdmin, async (req, res) => {
    try {
        const {
            search = '',
            status = 'all',
            from_date,
            to_date,
            profession = 'all',
            page = 1,
            limit = 20
        } = req.query;

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`(ts.first_name ILIKE $${paramIndex} OR ts.last_name ILIKE $${paramIndex} OR ts.email ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (status !== 'all') {
            if (status === 'completed') {
                whereConditions.push(`ts.completed = true`);
            } else if (status === 'in_progress') {
                whereConditions.push(`ts.completed = false`);
            }
        }

        if (from_date) {
            whereConditions.push(`ts.started_at >= $${paramIndex}`);
            params.push(from_date);
            paramIndex++;
        }

        if (to_date) {
            whereConditions.push(`ts.started_at <= $${paramIndex}`);
            params.push(to_date);
            paramIndex++;
        }

        if (profession !== 'all') {
            whereConditions.push(`ts.profession = $${paramIndex}`);
            params.push(profession);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ?
            `WHERE ${whereConditions.join(' AND ')}` : '';

        const countQuery = `
            SELECT COUNT(*)
            FROM test_sessions ts
                     LEFT JOIN tests t ON ts.test_id = t.id
                ${whereClause}
        `;

        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const query = `
            SELECT
                ts.id,
                ts.session_id,
                ts.first_name,
                ts.last_name,
                ts.email,
                ts.profession,
                ts.completed,
                ts.started_at,
                ts.completed_at,
                ts.current_question,
                t.project_name,
                t.golden_line,
                u.first_name as coach_first_name,
                u.last_name as coach_last_name
            FROM test_sessions ts
                     LEFT JOIN tests t ON ts.test_id = t.id
                     LEFT JOIN users u ON t.coach_id = u.id
                ${whereClause}
            ORDER BY ts.started_at DESC
                LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const result = await pool.query(query, params);

        res.json({
            results: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching test results:', error);
        res.status(500).json({ error: 'Failed to fetch test results' });
    }
});

module.exports = router;