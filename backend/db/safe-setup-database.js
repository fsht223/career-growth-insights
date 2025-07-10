// Создайте файл backend/db/safe-setup-database.js
const pool = require('./pool');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');

async function safeSetupDatabase() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting safe database setup...');

        // 1. Проверяем существующие таблицы
        console.log('🔍 Checking existing tables...');
        const existingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

        const tableNames = existingTables.rows.map(row => row.table_name);
        console.log('📊 Existing tables:', tableNames);

        // 2. Применяем основную схему по частям
        console.log('📋 Applying main schema safely...');

        // UUID расширение
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // Создаем таблицы с IF NOT EXISTS
        const createTablesQueries = [
            `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'coach',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

            `CREATE TABLE IF NOT EXISTS tests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_name VARCHAR(255) NOT NULL,
        golden_line VARCHAR(100) NOT NULL,
        language VARCHAR(10) DEFAULT 'ru',
        reseller VARCHAR(255),
        coach_email VARCHAR(255) NOT NULL,
        testee_email VARCHAR(255),
        test_count INTEGER DEFAULT 1,
        report_recipient VARCHAR(20) DEFAULT 'coach',
        coach_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'created',
        link TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

            `CREATE TABLE IF NOT EXISTS test_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
        session_id UUID UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        profession VARCHAR(100),
        current_question INTEGER DEFAULT 0,
        answers JSONB DEFAULT '{}',
        motivational_selection JSONB DEFAULT '[]',
        completed BOOLEAN DEFAULT FALSE,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

            `CREATE TABLE IF NOT EXISTS test_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
        session_id UUID REFERENCES test_sessions(session_id),
        testee_email VARCHAR(255) NOT NULL,
        testee_name VARCHAR(255) NOT NULL,
        profession VARCHAR(100),
        results JSONB NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        report_url TEXT,
        pdf_status VARCHAR(20) DEFAULT 'generating',
        pdf_path VARCHAR(255),
        pdf_error TEXT
      )`
        ];

        for (const query of createTablesQueries) {
            try {
                await client.query(query);
            } catch (error) {
                console.log(`⚠️ Table creation warning: ${error.message}`);
            }
        }

        // 3. Создаем индексы
        console.log('📚 Creating indexes...');
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_test_sessions_email ON test_sessions(email)',
            'CREATE INDEX IF NOT EXISTS idx_test_sessions_test_id ON test_sessions(test_id)',
            'CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id)',
            'CREATE INDEX IF NOT EXISTS idx_tests_coach_id ON tests(coach_id)'
        ];

        for (const indexQuery of indexes) {
            try {
                await client.query(indexQuery);
            } catch (error) {
                console.log(`⚠️ Index warning: ${error.message}`);
            }
        }

        // 4. Создаем функцию и триггеры
        console.log('⚙️ Creating functions and triggers...');

        await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

        // Удаляем старые триггеры и создаем новые
        try {
            await client.query('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
            await client.query(`
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `);
        } catch (error) {
            console.log(`⚠️ Trigger warning: ${error.message}`);
        }

        // 5. Применяем админские расширения
        console.log('👑 Applying admin extensions...');

        // Добавляем колонки к users
        const userColumns = [
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'active\'',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255)',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)',
            'ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP'
        ];

        for (const columnQuery of userColumns) {
            try {
                await client.query(columnQuery);
            } catch (error) {
                console.log(`⚠️ Column warning: ${error.message}`);
            }
        }

        // Создаем админские таблицы
        const adminTables = [
            `CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question_text TEXT NOT NULL,
        motivational_group VARCHAR(100) NOT NULL,
        category VARCHAR(50) DEFAULT 'behavior',
        language VARCHAR(10) DEFAULT 'ru',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

            `CREATE TABLE IF NOT EXISTS golden_lines (
        id SERIAL PRIMARY KEY,
        profession VARCHAR(100) NOT NULL,
        golden_line_values JSONB NOT NULL,
        language VARCHAR(10) DEFAULT 'ru',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(profession, language)
      )`,

            `CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
        ];

        for (const tableQuery of adminTables) {
            try {
                await client.query(tableQuery);
            } catch (error) {
                console.log(`⚠️ Admin table warning: ${error.message}`);
            }
        }

        // 6. Создаем пользователей
        console.log('👥 Creating users...');

        const adminPassword = await bcrypt.hash('Admin123!', 12);
        const coachPassword = await bcrypt.hash('Demo123!', 12);

        const users = [
            {
                email: 'admin@system.local',
                password: adminPassword,
                firstName: 'System',
                lastName: 'Administrator',
                role: 'admin'
            },
            {
                email: 'demo@coach.com',
                password: coachPassword,
                firstName: 'Demo',
                lastName: 'Coach',
                role: 'coach'
            }
        ];

        for (const user of users) {
            try {
                await client.query(`
          INSERT INTO users (email, password_hash, first_name, last_name, role, status)
          VALUES ($1, $2, $3, $4, $5, 'active')
          ON CONFLICT (email) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            role = EXCLUDED.role,
            status = EXCLUDED.status
        `, [user.email, user.password, user.firstName, user.lastName, user.role]);
                console.log(`✅ User created/updated: ${user.email}`);
            } catch (error) {
                console.log(`⚠️ User creation warning: ${error.message}`);
            }
        }

        // 7. Проверяем результат
        console.log('🔍 Final check...');
        const finalTables = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        console.log('📊 Database tables:');
        finalTables.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        const usersCount = await client.query('SELECT COUNT(*) FROM users');
        console.log(`👥 Total users: ${usersCount.rows[0].count}`);

        console.log('\n🎉 Database setup completed successfully!');
        console.log('\n📝 Login credentials:');
        console.log('   Demo Coach: demo@coach.com / Demo123!');
        console.log('   Admin: admin@system.local / Admin123!');

    } catch (error) {
        console.error('❌ Database setup failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Запускаем только если файл вызывается напрямую
if (require.main === module) {
    safeSetupDatabase()
        .then(() => {
            console.log('\n✨ Setup process completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = safeSetupDatabase;