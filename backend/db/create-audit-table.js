// Создайте файл backend/db/create-audit-table.js
const pool = require('./pool');

async function createAuditTable() {
    const client = await pool.connect();

    try {
        console.log('Creating admin_audit_log table...');

        await client.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address VARCHAR(45),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('✅ admin_audit_log table created successfully');

        // Создадим индекс для производительности
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON admin_audit_log(admin_id);
    `);

        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON admin_audit_log(created_at);
    `);

        console.log('✅ Indexes created successfully');

    } catch (error) {
        console.error('❌ Error creating audit table:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

createAuditTable();