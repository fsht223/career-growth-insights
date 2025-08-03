// Исправленный backend/db/safe-setup-database.js
const pool = require('./pool');
const bcrypt = require('bcryptjs');

async function safeSetupDatabase() {
    const client = await pool.connect();

    try {
        

        // 1. Проверяем существующие таблицы
        
        const existingTables = await client.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        `);

        const tableNames = existingTables.rows.map(row => row.table_name);
        

        // 2. Применяем основную схему по частям
        

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
                status VARCHAR(20) DEFAULT 'active',
                activation_token VARCHAR(255),
                reset_token VARCHAR(255),
                reset_token_expiry TIMESTAMP,
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
                
            }
        }

        // 3. Создаем индексы
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_test_sessions_email ON test_sessions(email)',
            'CREATE INDEX IF NOT EXISTS idx_test_sessions_test_id ON test_sessions(test_id)',
            'CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id)',
            'CREATE INDEX IF NOT EXISTS idx_tests_coach_id ON tests(coach_id)',
            'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
            'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)'
        ];

        for (const indexQuery of indexes) {
            try {
                await client.query(indexQuery);
            } catch (error) {
                
            }
        }

        // 4. Создаем триггер для updated_at
        try {
            await client.query(`
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            `);

            await client.query(`
                DROP TRIGGER IF EXISTS update_users_updated_at ON users;
                CREATE TRIGGER update_users_updated_at 
                BEFORE UPDATE ON users
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
            `);
        } catch (error) {
            
        }

        // 5. Создаем пользователей с правильными данными
        

        // Создаем хеши паролей
        const adminPassword = await bcrypt.hash('Admin123!', 12);
        const demoPassword = await bcrypt.hash('Demo123!', 12);

        const users = [
            {
                email: 'admin@system.local',
                password: adminPassword,
                firstName: 'System',
                lastName: 'Administrator',
                role: 'admin',
                status: 'active'
            },
            {
                email: 'demo@coach.com',  // Точно как в frontend конфигурации
                password: demoPassword,
                firstName: 'Demo',
                lastName: 'Coach',
                role: 'coach',
                status: 'active'
            },
            {
                email: 'coach@ditum.kz',  // Дополнительный пользователь
                password: demoPassword,
                firstName: 'Ditum',
                lastName: 'Coach',
                role: 'coach',
                status: 'active'
            }
        ];

        for (const user of users) {
            try {
                await client.query(`
                    INSERT INTO users (email, password_hash, first_name, last_name, role, status)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (email) DO UPDATE SET
                        password_hash = EXCLUDED.password_hash,
                        first_name = EXCLUDED.first_name,
                        last_name = EXCLUDED.last_name,
                        role = EXCLUDED.role,
                        status = EXCLUDED.status
                `, [user.email, user.password, user.firstName, user.lastName, user.role, user.status]);
                
            } catch (error) {
                
            }
        }

        // 6. Проверяем результат
        
        const finalTables = await client.query(`
            SELECT table_name, table_type
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        
        finalTables.rows.forEach(row => {
            
        });

        // Проверяем созданных пользователей
        const usersResult = await client.query('SELECT email, role, status FROM users ORDER BY email');
        
        usersResult.rows.forEach(user => {
            
        });

        const usersCount = await client.query('SELECT COUNT(*) FROM users');
        

        
        

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
            
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Setup failed:', error.message);
            process.exit(1);
        });
}

module.exports = safeSetupDatabase;