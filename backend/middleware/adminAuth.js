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