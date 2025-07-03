// backend/utils/adminUtils.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

class AdminUtils {
    constructor(pool) {
        this.pool = pool;
    }

    // Generate secure activation token
    generateActivationToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Generate secure password reset token
    generateResetToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    // Hash password with bcrypt
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    // Verify password
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // Generate JWT token for admin
    generateJWTToken(userId, role) {
        return jwt.sign(
            { id: userId, role: role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
    }

    // Log admin action
    async logAdminAction(adminId, action, targetType = null, targetId = null, details = null, req = null) {
        try {
            const ipAddress = req ? (req.ip || req.connection.remoteAddress) : null;
            const userAgent = req ? req.get('User-Agent') : null;

            const query = `
        INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, details, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

            await this.pool.query(query, [
                adminId,
                action,
                targetType,
                targetId,
                details ? JSON.stringify(details) : null,
                ipAddress,
                userAgent
            ]);
        } catch (error) {
            console.error('Error logging admin action:', error);
        }
    }

    // Get admin activity log
    async getAdminActivityLog(adminId = null, limit = 50, offset = 0) {
        try {
            let query = `
        SELECT 
          aal.*,
          u.first_name,
          u.last_name,
          u.email
        FROM admin_audit_log aal
        LEFT JOIN users u ON aal.admin_id = u.id
      `;

            let params = [];

            if (adminId) {
                query += ` WHERE aal.admin_id = $1`;
                params.push(adminId);
            }

            query += ` ORDER BY aal.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);

            const result = await this.pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error fetching admin activity log:', error);
            return [];
        }
    }

    // Validate email format
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate password strength
    isValidPassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    // Get system statistics
    async getSystemStats(fromDate = null, toDate = null) {
        try {
            const dateFilter = fromDate && toDate ?
                `AND ts.started_at >= $1 AND ts.started_at <= $2` : '';

            const params = fromDate && toDate ? [fromDate, toDate] : [];

            const queries = {
                totalTests: `
          SELECT COUNT(*) as count 
          FROM tests 
          WHERE 1=1 ${dateFilter.replace('ts.started_at', 'created_at')}
        `,
                completedTests: `
          SELECT COUNT(*) as count 
          FROM test_sessions ts 
          WHERE completed = true ${dateFilter}
        `,
                activeTests: `
          SELECT COUNT(*) as count 
          FROM test_sessions ts 
          WHERE completed = false ${dateFilter}
        `,
                totalCoaches: `
          SELECT COUNT(*) as count 
          FROM users 
          WHERE role = 'coach'
        `,
                activeCoaches: `
          SELECT COUNT(*) as count 
          FROM users 
          WHERE role = 'coach' AND status = 'active'
        `,
                uniqueParticipants: `
          SELECT COUNT(DISTINCT email) as count 
          FROM test_sessions ts 
          WHERE 1=1 ${dateFilter}
        `,
                avgCompletionTime: `
          SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))/60) as avg_time
          FROM test_sessions ts 
          WHERE completed = true ${dateFilter}
        `
            };

            const results = {};

            for (const [key, query] of Object.entries(queries)) {
                const result = await this.pool.query(query, params);
                results[key] = key === 'avgCompletionTime' ?
                    parseFloat(result.rows[0].avg_time || 0) :
                    parseInt(result.rows[0].count || 0);
            }

            return results;
        } catch (error) {
            console.error('Error fetching system stats:', error);
            return {};
        }
    }

    // Get dashboard analytics data
    async getDashboardAnalytics(days = 30) {
        try {
            const query = `
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

            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error fetching dashboard analytics:', error);
            return [];
        }
    }

    // Backup coach data before deletion
    async backupCoachData(coachId, deletedBy) {
        try {
            const coachQuery = `
        SELECT * FROM users WHERE id = $1 AND role = 'coach'
      `;

            const coachResult = await this.pool.query(coachQuery, [coachId]);

            if (coachResult.rows.length === 0) {
                throw new Error('Coach not found');
            }

            const coach = coachResult.rows[0];

            const backupQuery = `
        INSERT INTO deleted_coaches (
          original_coach_id, email, first_name, last_name, 
          deleted_by, original_data
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `;

            await this.pool.query(backupQuery, [
                coach.id,
                coach.email,
                coach.first_name,
                coach.last_name,
                deletedBy,
                JSON.stringify(coach)
            ]);

            return true;
        } catch (error) {
            console.error('Error backing up coach data:', error);
            return false;
        }
    }

    // Get coach tests count
    async getCoachTestsCount(coachId) {
        try {
            const query = `
        SELECT COUNT(*) as count 
        FROM tests 
        WHERE coach_id = $1
      `;

            const result = await this.pool.query(query, [coachId]);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting coach tests count:', error);
            return 0;
        }
    }

    // Validate golden line values
    validateGoldenLineValues(values) {
        const errors = [];

        if (!values || typeof values !== 'object') {
            errors.push('Golden line values must be an object');
            return errors;
        }

        const requiredFactors = [
            'perfectionism', 'reaching_goals', 'social_contact', 'being_logical',
            'bringing_happiness', 'intuition', 'success', 'recognition',
            'professional_pleasure', 'resilience', 'social_approval', 'team_spirit',
            'intellectual_discovery', 'empathy', 'influence', 'respect', 'value', 'efficiency'
        ];

        for (const factor of requiredFactors) {
            if (!(factor in values)) {
                errors.push(`Missing required factor: ${factor}`);
            } else {
                const value = values[factor];
                if (typeof value !== 'number' || value < 0 || value > 200) {
                    errors.push(`Invalid value for ${factor}: must be a number between 0 and 200`);
                }
            }
        }

        return errors;
    }

    // Clean up old data
    async cleanupOldData() {
        try {
            const client = await this.pool.connect();

            try {
                await client.query('BEGIN');

                // Delete old audit logs (older than 1 year)
                const auditCleanup = await client.query(`
          DELETE FROM admin_audit_log 
          WHERE created_at < NOW() - INTERVAL '1 year'
        `);

                // Delete old notifications (older than 3 months)
                const notificationCleanup = await client.query(`
          DELETE FROM admin_notifications 
          WHERE created_at < NOW() - INTERVAL '3 months'
        `);

                // Delete old performance metrics (older than 6 months)
                const metricsCleanup = await client.query(`
          DELETE FROM performance_metrics 
          WHERE recorded_at < NOW() - INTERVAL '6 months'
        `);

                // Clean up expired reset tokens
                const tokenCleanup = await client.query(`
          UPDATE users 
          SET reset_token = NULL, reset_token_expiry = NULL
          WHERE reset_token_expiry < NOW()
        `);

                await client.query('COMMIT');

                return {
                    auditLogsDeleted: auditCleanup.rowCount,
                    notificationsDeleted: notificationCleanup.rowCount,
                    metricsDeleted: metricsCleanup.rowCount,
                    tokensCleared: tokenCleanup.rowCount
                };
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error cleaning up old data:', error);
            throw error;
        }
    }

    // Get system health report
    async getSystemHealth() {
        try {
            const query = `SELECT * FROM get_system_health_report()`;
            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error getting system health report:', error);
            return [];
        }
    }

    // Export data to CSV
    exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            return '';
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    if (value === null || value === undefined) {
                        return '';
                    }
                    if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        return csvContent;
    }

    // Generate random password
    generateRandomPassword(length = 12) {
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let password = '';

        // Ensure at least one character from each required category
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const special = '!@#$%^&*';

        // Add one character from each category
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += special[Math.floor(Math.random() * special.length)];

        // Fill the rest randomly
        for (let i = password.length; i < length; i++) {
            password += charset[Math.floor(Math.random() * charset.length)];
        }

        // Shuffle the password
        return password.split('').sort(() => 0.5 - Math.random()).join('');
    }

    // Validate motivational group
    isValidMotivationalGroup(group) {
        const validGroups = [
            'Perfectionism', 'Reaching Goals', 'Social Contact', 'Being Logical',
            'Bringing Happiness', 'Intuition', 'Success', 'Recognition',
            'Professional Pleasure', 'Resilience', 'Social Approval', 'Team Spirit',
            'Intellectual Discovery', 'Empathy', 'Influence', 'Respect', 'Value', 'Efficiency'
        ];
        return validGroups.includes(group);
    }

    // Get pending coaches count
    async getPendingCoachesCount() {
        try {
            const query = `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE role = 'coach' AND status = 'pending'
      `;

            const result = await this.pool.query(query);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting pending coaches count:', error);
            return 0;
        }
    }

    // Get admin notifications
    async getAdminNotifications(limit = 10, unreadOnly = false) {
        try {
            let query = `
        SELECT * FROM admin_notifications
      `;

            if (unreadOnly) {
                query += ` WHERE is_read = false`;
            }

            query += ` ORDER BY created_at DESC LIMIT $1`;

            const result = await this.pool.query(query, [limit]);
            return result.rows;
        } catch (error) {
            console.error('Error fetching admin notifications:', error);
            return [];
        }
    }

    // Mark notification as read
    async markNotificationAsRead(notificationId) {
        try {
            const query = `
        UPDATE admin_notifications 
        SET is_read = true 
        WHERE id = $1
      `;

            await this.pool.query(query, [notificationId]);
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    // Add performance metric
    async addPerformanceMetric(name, value, unit = null, details = null) {
        try {
            const query = `
        INSERT INTO performance_metrics (metric_name, metric_value, metric_unit, details)
        VALUES ($1, $2, $3, $4)
      `;

            await this.pool.query(query, [name, value, unit, details ? JSON.stringify(details) : null]);
            return true;
        } catch (error) {
            console.error('Error adding performance metric:', error);
            return false;
        }
    }

    // Get performance metrics
    async getPerformanceMetrics(metricName = null, hours = 24) {
        try {
            let query = `
        SELECT * FROM performance_metrics
        WHERE recorded_at >= NOW() - INTERVAL '${hours} hours'
      `;

            let params = [];

            if (metricName) {
                query += ` AND metric_name = $1`;
                params.push(metricName);
            }

            query += ` ORDER BY recorded_at DESC`;

            const result = await this.pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error fetching performance metrics:', error);
            return [];
        }
    }

    // Database maintenance
    async performDatabaseMaintenance() {
        try {
            const client = await this.pool.connect();

            try {
                // Update table statistics
                await client.query('ANALYZE');

                // Vacuum tables
                await client.query('VACUUM');

                // Reindex tables
                await client.query('REINDEX DATABASE ' + process.env.DB_NAME);

                return { success: true, message: 'Database maintenance completed' };
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Error performing database maintenance:', error);
            return { success: false, message: error.message };
        }
    }

    // Get database size
    async getDatabaseSize() {
        try {
            const query = `
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;

            const result = await this.pool.query(query);
            return result.rows[0].size;
        } catch (error) {
            console.error('Error getting database size:', error);
            return 'Unknown';
        }
    }

    // Get table sizes
    async getTableSizes() {
        try {
            const query = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC
      `;

            const result = await this.pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error getting table sizes:', error);
            return [];
        }
    }

    // Format date for display
    formatDate(date, locale = 'ru-RU') {
        if (!date) return '';
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Calculate percentage
    calculatePercentage(value, total) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100);
    }

    // Generate activation email HTML
    generateActivationEmailHTML(firstName, lastName, email, activationLink, language = 'ru') {
        const templates = {
            ru: {
                subject: 'Активация аккаунта коуча',
                title: 'Добро пожаловать в систему тестирования!',
                greeting: `Здравствуйте, ${firstName} ${lastName}!`,
                message: 'Для вас был создан аккаунт коуча в системе тестирования. Для активации аккаунта перейдите по ссылке:',
                button: 'Активировать аккаунт',
                credentials: 'Ваши данные для входа:',
                emailLabel: 'Email:',
                passwordLabel: 'Пароль:',
                passwordNote: 'тот, который был установлен администратором',
                footer: 'После активации вы сможете войти в систему и начать создавать тесты.',
                disclaimer: 'Если вы не регистрировались в системе, просто проигнорируйте это письмо.'
            },
            en: {
                subject: 'Coach Account Activation',
                title: 'Welcome to the Testing System!',
                greeting: `Hello, ${firstName} ${lastName}!`,
                message: 'A coach account has been created for you in the testing system. To activate your account, click the link:',
                button: 'Activate Account',
                credentials: 'Your login credentials:',
                emailLabel: 'Email:',
                passwordLabel: 'Password:',
                passwordNote: 'the one set by the administrator',
                footer: 'After activation, you will be able to log in and start creating tests.',
                disclaimer: 'If you did not register in the system, simply ignore this email.'
            }
        };

        const t = templates[language] || templates.ru;

        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">${t.title}</h2>
        <p style="font-size: 16px;">${t.greeting}</p>
        <p style="font-size: 16px;">${t.message}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
            ${t.button}
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          ${t.credentials}
        </p>
        <ul style="font-size: 14px; color: #666;">
          <li><strong>${t.emailLabel}</strong> ${email}</li>
          <li><strong>${t.passwordLabel}</strong> ${t.passwordNote}</li>
        </ul>
        
        <p style="font-size: 16px;">${t.footer}</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          ${t.disclaimer}
        </p>
      </div>
    `;
    }

    // Generate password reset email HTML
    generatePasswordResetEmailHTML(firstName, lastName, resetLink, language = 'ru') {
        const templates = {
            ru: {
                subject: 'Сброс пароля',
                title: 'Сброс пароля',
                greeting: `Здравствуйте, ${firstName} ${lastName}!`,
                message: 'Администратор инициировал сброс пароля для вашего аккаунта. Для создания нового пароля перейдите по ссылке:',
                button: 'Сбросить пароль',
                validity: 'Ссылка действительна в течение 1 часа.',
                disclaimer: 'Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.'
            },
            en: {
                subject: 'Password Reset',
                title: 'Password Reset',
                greeting: `Hello, ${firstName} ${lastName}!`,
                message: 'Administrator initiated password reset for your account. To create a new password, click the link:',
                button: 'Reset Password',
                validity: 'Link is valid for 1 hour.',
                disclaimer: 'If you did not request password reset, simply ignore this email.'
            }
        };

        const t = templates[language] || templates.ru;

        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">${t.title}</h2>
        <p style="font-size: 16px;">${t.greeting}</p>
        <p style="font-size: 16px;">${t.message}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
            ${t.button}
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; text-align: center;">
          ${t.validity}
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          ${t.disclaimer}
        </p>
      </div>
    `;
    }
}

module.exports = AdminUtils;

// backend/middleware/adminAuth.js
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const AdminUtils = require('../utils/adminUtils');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const adminUtils = new AdminUtils(pool);

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const query = `
      SELECT id, email, first_name, last_name, role, status 
      FROM users 
      WHERE id = $1 AND role = 'admin' AND status = 'active'
    `;

        const result = await pool.query(query, [decoded.id]);

        if (result.rows.length === 0) {
            return res.status(403).json({
                error: 'Access denied. Admin privileges required.',
                code: 'INSUFFICIENT_PRIVILEGES'
            });
        }

        req.user = result.rows[0];
        req.adminUtils = adminUtils;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired. Please login again.',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token.',
                code: 'INVALID_TOKEN'
            });
        }

        console.error('Authentication error:', error);
        res.status(500).json({
            error: 'Internal server error during authentication.',
            code: 'AUTH_ERROR'
        });
    }
};

// Rate limiting middleware for admin actions
const adminRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();

    return (req, res, next) => {
        const key = req.user.id;
        const now = Date.now();

        if (!requests.has(key)) {
            requests.set(key, []);
        }

        const userRequests = requests.get(key);
        const validRequests = userRequests.filter(time => now - time < windowMs);

        if (validRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED'
            });
        }

        validRequests.push(now);
        requests.set(key, validRequests);

        next();
    };
};

// Action logging middleware
const logAdminAction = (action) => {
    return async (req, res, next) => {
        const originalSend = res.send;

        res.send = function(data) {
            // Log the action after successful response
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const targetType = req.params.type || req.baseUrl.split('/').pop();
                const targetId = req.params.id || req.body.id;
                const details = {
                    method: req.method,
                    url: req.originalUrl,
                    body: req.body,
                    params: req.params,
                    query: req.query
                };

                // Don't wait for logging to complete
                adminUtils.logAdminAction(
                    req.user.id,
                    action,
                    targetType,
                    targetId,
                    details,
                    req
                ).catch(error => {
                    console.error('Error logging admin action:', error);
                });
            }

            originalSend.call(this, data);
        };

        next();
    };
};

module.exports = {
    authenticateAdmin,
    adminRateLimit,
    logAdminAction,
    adminUtils
};