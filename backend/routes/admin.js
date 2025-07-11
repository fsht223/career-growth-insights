// Замените backend/routes/admin.js полностью
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Pool } = require('pg');
const router = express.Router();

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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

// ===== AUTHENTICATION ROUTES =====

// Login
router.post('/login', async (req, res) => {
    try {
        console.log('🔐 Admin login attempt:', req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        const query = `SELECT id, email, password_hash, first_name, last_name, role, status FROM users WHERE email = $1 AND role = 'admin'`;
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

        const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

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

// Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const query = `SELECT id, email, first_name, last_name, role, status FROM users WHERE id = $1 AND role = 'admin'`;
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
        console.error('❌ Token verification error:', error);
        res.status(401).json({ error: 'Недействительный токен' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    console.log('🚪 Admin logout');
    res.json({ message: 'Успешный выход' });
});

// ===== DASHBOARD ROUTES =====

// Get admin stats
router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        console.log('📊 Fetching admin stats...');

        const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'coach') as total_coaches,
        (SELECT COUNT(*) FROM tests) as total_tests,
        (SELECT COUNT(*) FROM test_sessions WHERE completed = true) as completed_sessions,
        (SELECT COUNT(DISTINCT email) FROM test_sessions) as total_participants
    `);

        const recentActivity = await pool.query(`
      SELECT 'test_created' as action, tests.project_name as details, tests.created_at
      FROM tests 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

        res.json({
            stats: stats.rows[0],
            recentActivity: recentActivity.rows
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ===== COACHES MANAGEMENT =====

// Get all coaches
router.get('/coaches', authenticateAdmin, async (req, res) => {
    try {
        console.log('👥 Fetching coaches...');
        const query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.status, u.created_at,
             COUNT(t.id) as tests_created
      FROM users u
      LEFT JOIN tests t ON u.id = t.coach_id
      WHERE u.role = 'coach'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
        const result = await pool.query(query);
        console.log(`✅ Found ${result.rows.length} coaches`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching coaches:', error);
        res.status(500).json({ error: 'Failed to fetch coaches' });
    }
});

// Create coach
router.post('/coaches', authenticateAdmin, async (req, res) => {
    try {
        console.log('➕ Creating new coach...');
        const { email, firstName, lastName, password } = req.body;

        // Validation
        if (!email || !firstName || !lastName || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if email exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password and create coach
        const hashedPassword = await bcrypt.hash(password, 12);
        const activationToken = crypto.randomBytes(32).toString('hex');

        const result = await pool.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, status, activation_token)
      VALUES ($1, $2, $3, $4, 'coach', 'pending', $5)
      RETURNING id, email, first_name, last_name, status
    `, [email, hashedPassword, firstName, lastName, activationToken]);

        const newCoach = result.rows[0];
        console.log('✅ Coach created:', newCoach.email);

        res.status(201).json({
            message: 'Coach created successfully',
            coach: newCoach,
            activationLink: `${process.env.FRONTEND_URL}/activate/${activationToken}`
        });
    } catch (error) {
        console.error('Error creating coach:', error);
        res.status(500).json({ error: 'Failed to create coach' });
    }
});

// Update coach status
router.put('/coaches/:id/status', authenticateAdmin, async (req, res) => {
    try {
        console.log('🔄 Updating coach status...');
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        if (!['active', 'inactive', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Update coach status
        const result = await pool.query(`
      UPDATE users 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 AND role = 'coach'
      RETURNING id, email, first_name, last_name, status
    `, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        const updatedCoach = result.rows[0];
        console.log(`✅ Coach ${updatedCoach.email} status updated to ${status}`);

        res.json({
            message: 'Coach status updated successfully',
            coach: updatedCoach
        });
    } catch (error) {
        console.error('Error updating coach status:', error);
        res.status(500).json({ error: 'Failed to update coach status' });
    }
});

// Delete coach
router.delete('/coaches/:id', authenticateAdmin, async (req, res) => {
    try {
        console.log('🗑️ Deleting coach...');
        const { id } = req.params;

        // Check if coach exists
        const coach = await pool.query('SELECT * FROM users WHERE id = $1 AND role = $2', [id, 'coach']);
        if (coach.rows.length === 0) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        // Delete coach (this will cascade delete tests due to foreign key)
        await pool.query('DELETE FROM users WHERE id = $1', [id]);

        console.log(`✅ Coach ${coach.rows[0].email} deleted`);
        res.json({ message: 'Coach deleted successfully' });
    } catch (error) {
        console.error('Error deleting coach:', error);
        res.status(500).json({ error: 'Failed to delete coach' });
    }
});

// Reset coach password
router.post('/coaches/:id/reset-password', authenticateAdmin, async (req, res) => {
    try {
        console.log('🔑 Resetting coach password...');
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const result = await pool.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 AND role = 'coach'
      RETURNING email
    `, [hashedPassword, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Coach not found' });
        }

        console.log(`✅ Password reset for coach: ${result.rows[0].email}`);
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// ===== QUESTIONS MANAGEMENT =====

// Get questions
router.get('/questions', authenticateAdmin, async (req, res) => {
    try {
        console.log('❓ Fetching questions...');
        const { language = 'ru' } = req.query;
        const result = await pool.query(
            'SELECT * FROM questions WHERE language = $1 ORDER BY id',
            [language]
        );
        console.log(`✅ Found ${result.rows.length} questions for language: ${language}`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Add/Update question
router.post('/questions', authenticateAdmin, async (req, res) => {
    try {
        console.log('💾 Saving question...');
        const { id, text, group, category, language } = req.body;

        if (!text || !group || !category || !language) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let result;
        if (id) {
            // Update existing
            result = await pool.query(`
        UPDATE questions 
        SET question_text = $1, motivational_group = $2, category = $3, language = $4, updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `, [text, group, category, language, id]);
            console.log(`✅ Question ${id} updated`);
        } else {
            // Create new
            result = await pool.query(`
        INSERT INTO questions (question_text, motivational_group, category, language)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [text, group, category, language]);
            console.log(`✅ New question created with ID: ${result.rows[0].id}`);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving question:', error);
        res.status(500).json({ error: 'Failed to save question' });
    }
});

// Delete question
router.delete('/questions/:id', authenticateAdmin, async (req, res) => {
    try {
        console.log('🗑️ Deleting question...');
        const { id } = req.params;

        const result = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING question_text', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }

        console.log(`✅ Question ${id} deleted`);
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

// ===== GOLDEN LINES MANAGEMENT =====

// Get golden lines
router.get('/golden-lines', authenticateAdmin, async (req, res) => {
    try {
        console.log('📏 Fetching golden lines...');
        const { language = 'ru' } = req.query;
        const result = await pool.query(
            'SELECT * FROM golden_lines WHERE language = $1 ORDER BY profession',
            [language]
        );
        console.log(`✅ Found ${result.rows.length} golden lines`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching golden lines:', error);
        res.status(500).json({ error: 'Failed to fetch golden lines' });
    }
});

// Add/Update golden line
router.post('/golden-lines', authenticateAdmin, async (req, res) => {
    try {
        console.log('💾 Saving golden line...');
        const { id, profession, values, language } = req.body;

        if (!profession || !values || !language) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        let result;
        if (id) {
            // Update existing
            result = await pool.query(`
        UPDATE golden_lines 
        SET profession = $1, golden_line_values = $2, language = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
      `, [profession, JSON.stringify(values), language, id]);
        } else {
            // Create new
            result = await pool.query(`
        INSERT INTO golden_lines (profession, golden_line_values, language)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [profession, JSON.stringify(values), language]);
        }

        console.log(`✅ Golden line saved for profession: ${profession}`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving golden line:', error);
        res.status(500).json({ error: 'Failed to save golden line' });
    }
});

// Delete golden line
router.delete('/golden-lines/:id', authenticateAdmin, async (req, res) => {
    try {
        console.log('🗑️ Deleting golden line...');
        const { id } = req.params;

        const result = await pool.query('DELETE FROM golden_lines WHERE id = $1 RETURNING profession', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Golden line not found' });
        }

        console.log(`✅ Golden line ${id} deleted`);
        res.json({ message: 'Golden line deleted successfully' });
    } catch (error) {
        console.error('Error deleting golden line:', error);
        res.status(500).json({ error: 'Failed to delete golden line' });
    }
});

// ===== SYSTEM SETTINGS =====

// Get system settings
router.get('/settings', authenticateAdmin, async (req, res) => {
    try {
        console.log('⚙️ Fetching system settings...');
        const result = await pool.query('SELECT * FROM system_settings ORDER BY setting_key');

        // Convert to key-value object
        const settings = {};
        result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        console.log(`✅ Found ${result.rows.length} settings`);
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update system setting
router.put('/settings/:key', authenticateAdmin, async (req, res) => {
    try {
        console.log('💾 Updating system setting...');
        const { key } = req.params;
        const { value } = req.body;

        const result = await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value)
      VALUES ($1, $2)
      ON CONFLICT (setting_key) 
      DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [key, value]);

        console.log(`✅ Setting ${key} updated`);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
});

// ===== ANALYTICS AND REPORTS =====

// Get analytics data
router.get('/analytics', authenticateAdmin, async (req, res) => {
    try {
        console.log('📈 Fetching analytics...');
        const { days = 30 } = req.query;

        const analyticsQuery = `
      SELECT 
        DATE_TRUNC('day', started_at) as date,
        COUNT(*) as total_tests,
        COUNT(CASE WHEN completed = true THEN 1 END) as completed_tests,
        COUNT(DISTINCT email) as unique_participants,
        AVG(CASE WHEN completed = true THEN 
          EXTRACT(EPOCH FROM (completed_at - started_at))/60 
        END) as avg_completion_time
      FROM test_sessions 
      WHERE started_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE_TRUNC('day', started_at)
      ORDER BY date DESC
    `;

        const result = await pool.query(analyticsQuery);
        console.log(`✅ Analytics data for ${days} days`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Test route
router.get('/test', (req, res) => {
    res.json({
        message: 'Admin routes working!',
        timestamp: new Date().toISOString(),
        endpoints: [
            'GET /stats - Admin statistics',
            'GET /coaches - List coaches',
            'POST /coaches - Create coach',
            'PUT /coaches/:id/status - Update coach status',
            'DELETE /coaches/:id - Delete coach',
            'GET /questions - List questions',
            'POST /questions - Create/update question',
            'DELETE /questions/:id - Delete question',
            'GET /golden-lines - List golden lines',
            'POST /golden-lines - Create/update golden line',
            'DELETE /golden-lines/:id - Delete golden line',
            'GET /settings - Get system settings',
            'PUT /settings/:key - Update setting',
            'GET /analytics - Get analytics data'
        ]
    });
});

module.exports = router;