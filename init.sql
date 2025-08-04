-- ===== CAREER GROWTH INSIGHTS - DITUM.KZ DATABASE =====
-- PostgreSQL Database Setup для Career Growth Insights Platform

-- Установка настроек базы данных
SET client_encoding = 'UTF8';
SET timezone = 'Asia/Almaty';
SET default_text_search_config = 'russian';

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Логирование инициализации
DO $$
BEGIN
    RAISE NOTICE '🚀 Starting Career Growth Insights database initialization...';
    RAISE NOTICE '⏰ Timestamp: %', CURRENT_TIMESTAMP;
    RAISE NOTICE '🌍 Timezone: Asia/Almaty';
    RAISE NOTICE '🏢 Platform: Career Growth Insights';
    RAISE NOTICE '🌐 Domain: ditum.kz';
END $$;

-- Удаление существующих таблиц (в правильном порядке)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS test_sessions CASCADE;
DROP TABLE IF EXISTS tests CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===== ПОЛЬЗОВАТЕЛИ И АУТЕНТИФИКАЦИЯ =====

-- Таблица пользователей (коучей и администраторов)
CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       first_name VARCHAR(100) NOT NULL,
                       last_name VARCHAR(100) NOT NULL,
                       role VARCHAR(20) DEFAULT 'coach' CHECK (role IN ('admin', 'coach', 'user')),
                       company VARCHAR(255),
                       phone VARCHAR(20),
                       avatar_url TEXT,
                       bio TEXT,
                       is_active BOOLEAN DEFAULT true,
                       email_verified BOOLEAN DEFAULT false,
                       last_login TIMESTAMP WITH TIME ZONE,
                       login_count INTEGER DEFAULT 0,
                       failed_login_attempts INTEGER DEFAULT 0,
                       locked_until TIMESTAMP WITH TIME ZONE,
                       created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                       deleted_at TIMESTAMP WITH TIME ZONE
);

-- ===== ТЕСТЫ И ПРОЕКТЫ =====

-- Таблица тестов
CREATE TABLE tests (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       project_name VARCHAR(255) NOT NULL,
                       golden_line VARCHAR(100) NOT NULL,
                       language VARCHAR(10) DEFAULT 'ru' CHECK (language IN ('ru', 'kz', 'en')),
    reseller VARCHAR(255),
    coach_email VARCHAR(255) NOT NULL,
    testee_email VARCHAR(255),
    test_count INTEGER DEFAULT 1 CHECK (test_count > 0),
    report_recipient VARCHAR(20) DEFAULT 'coach' CHECK (report_recipient IN ('coach', 'testee', 'both')),
    coach_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'active', 'completed', 'paused', 'archived')),
    link TEXT NOT NULL,
    description TEXT,
    custom_settings JSONB DEFAULT '{}',
    expiration_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== СЕССИИ ТЕСТИРОВАНИЯ =====

-- Таблица сессий тестирования
CREATE TABLE test_sessions (
                               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                               test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
                               session_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
                               first_name VARCHAR(100) NOT NULL,
                               last_name VARCHAR(100) NOT NULL,
                               email VARCHAR(255) NOT NULL,
                               profession VARCHAR(100),
                               phone VARCHAR(20),
                               company VARCHAR(255),
                               current_question INTEGER DEFAULT 0,
                               total_questions INTEGER DEFAULT 48,
                               answers JSONB DEFAULT '{}',
                               motivational_selection JSONB DEFAULT '[]',
                               progress_percentage DECIMAL(5,2) DEFAULT 0.00,
                               completed BOOLEAN DEFAULT FALSE,
                               ip_address INET,
                               user_agent TEXT,
                               started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                               completed_at TIMESTAMP WITH TIME ZONE,
                               last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                               time_spent_seconds INTEGER DEFAULT 0
);

-- ===== РЕЗУЛЬТАТЫ ТЕСТОВ =====

-- Таблица результатов тестов
CREATE TABLE test_results (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
                              session_id UUID REFERENCES test_sessions(session_id) ON DELETE CASCADE,
                              testee_email VARCHAR(255) NOT NULL,
                              testee_name VARCHAR(255) NOT NULL,
                              profession VARCHAR(100),
                              company VARCHAR(255),
                              results JSONB NOT NULL,
                              motivational_types JSONB DEFAULT '[]',
                              personality_profile JSONB DEFAULT '{}',
                              recommendations JSONB DEFAULT '{}',
                              scores JSONB DEFAULT '{}',
                              completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                              report_url TEXT,
                              pdf_status VARCHAR(20) DEFAULT 'pending' CHECK (pdf_status IN ('pending', 'generating', 'ready', 'failed', 'expired')),
                              pdf_path VARCHAR(255),
                              pdf_size_bytes INTEGER,
                              pdf_generated_at TIMESTAMP WITH TIME ZONE,
                              pdf_error TEXT,
                              email_sent BOOLEAN DEFAULT FALSE,
                              email_sent_at TIMESTAMP WITH TIME ZONE,
                              email_error TEXT,
                              is_archived BOOLEAN DEFAULT FALSE,
                              archived_at TIMESTAMP WITH TIME ZONE
);

-- ===== СИСТЕМНЫЕ ТАБЛИЦЫ =====

-- Таблица настроек системы
CREATE TABLE system_settings (
                                 id SERIAL PRIMARY KEY,
                                 setting_key VARCHAR(100) UNIQUE NOT NULL,
                                 setting_value TEXT,
                                 setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
                                 description TEXT,
                                 is_public BOOLEAN DEFAULT FALSE,
                                 created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                 updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Таблица аудита действий
CREATE TABLE audit_log (
                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                           user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                           action VARCHAR(100) NOT NULL,
                           resource_type VARCHAR(50),
                           resource_id VARCHAR(100),
                           old_values JSONB,
                           new_values JSONB,
                           details JSONB DEFAULT '{}',
                           ip_address INET,
                           user_agent TEXT,
                           session_id VARCHAR(255),
                           created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ =====

-- Пользователи
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Тесты
CREATE INDEX idx_tests_coach_id ON tests(coach_id);
CREATE INDEX idx_tests_status ON tests(status);
CREATE INDEX idx_tests_created_at ON tests(created_at DESC);
CREATE INDEX idx_tests_coach_email ON tests(coach_email);
CREATE INDEX idx_tests_project_name ON tests(project_name);
CREATE INDEX idx_tests_link ON tests(link);
CREATE INDEX idx_tests_golden_line ON tests(golden_line);

-- Сессии
CREATE INDEX idx_test_sessions_test_id ON test_sessions(test_id);
CREATE INDEX idx_test_sessions_email ON test_sessions(email);
CREATE INDEX idx_test_sessions_completed ON test_sessions(completed);
CREATE INDEX idx_test_sessions_started_at ON test_sessions(started_at DESC);
CREATE INDEX idx_test_sessions_session_id ON test_sessions(session_id);

-- Результаты
CREATE INDEX idx_test_results_test_id ON test_results(test_id);
CREATE INDEX idx_test_results_session_id ON test_results(session_id);
CREATE INDEX idx_test_results_testee_email ON test_results(testee_email);
CREATE INDEX idx_test_results_completed_at ON test_results(completed_at DESC);
CREATE INDEX idx_test_results_pdf_status ON test_results(pdf_status);
CREATE INDEX idx_test_results_email_sent ON test_results(email_sent);

-- Аудит
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- Системные настройки
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_system_settings_public ON system_settings(is_public) WHERE is_public = true;

-- ===== ФУНКЦИИ И ТРИГГЕРЫ =====

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

-- Функция для безопасного удаления пользователей (soft delete)
CREATE OR REPLACE FUNCTION soft_delete_user()
RETURNS TRIGGER AS $$
BEGIN
UPDATE users
SET deleted_at = CURRENT_TIMESTAMP,
    is_active = false,
    email = email || '_deleted_' || extract(epoch from CURRENT_TIMESTAMP)
WHERE id = OLD.id;
RETURN NULL; -- Предотвращаем физическое удаление
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tests_updated_at
    BEFORE UPDATE ON tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_test_sessions_updated_at
    BEFORE UPDATE ON test_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== ЗАПОЛНЕНИЕ БАЗОВЫХ ДАННЫХ =====

-- Создание демо пользователей
-- Хеш получен через: bcrypt.hash('Demo123!', 12)
INSERT INTO users (email, password_hash, first_name, last_name, role, company, is_active, email_verified) VALUES
                                                                                                              ('admin@ditum.kz', '$2a$12$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Администратор', 'Career Growth', 'admin', 'Ditum', true, true),
                                                                                                              ('coach@ditum.kz', '$2a$12$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Коуч', 'Insights', 'coach', 'Ditum', true, true),
                                                                                                              ('support@ditum.kz', '$2a$12$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Поддержка', 'Команда', 'coach', 'Ditum', true, true)
    ON CONFLICT (email) DO NOTHING;

-- Создание системных настроек
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
                                                                                                   ('platform_name', 'Career Growth Insights', 'string', 'Название платформы', true),
                                                                                                   ('domain', 'ditum.kz', 'string', 'Основной домен', true),
                                                                                                   ('support_email', 'support@ditum.kz', 'string', 'Email поддержки', true),
                                                                                                   ('max_session_duration', '7200', 'number', 'Максимальная длительность сессии в секундах (2 часа)', false),
                                                                                                   ('pdf_generation_timeout', '30', 'number', 'Таймаут генерации PDF в секундах', false),
                                                                                                   ('email_notifications_enabled', 'true', 'boolean', 'Включены ли email уведомления', false),
                                                                                                   ('test_questions_count', '48', 'number', 'Количество вопросов в тесте', false),
                                                                                                   ('results_retention_days', '30', 'number', 'Количество дней хранения результатов', false),
                                                                                                   ('platform_version', '1.0.0', 'string', 'Версия платформы', true),
                                                                                                   ('maintenance_mode', 'false', 'boolean', 'Режим технического обслуживания', false)
    ON CONFLICT (setting_key) DO NOTHING;

-- Создание демо теста
INSERT INTO tests (
    project_name,
    golden_line,
    language,
    coach_email,
    coach_id,
    link,
    description,
    status
) VALUES (
             'Демо проект Career Growth',
             'DITUM-DEMO-2024',
             'ru',
             'coach@ditum.kz',
             (SELECT id FROM users WHERE email = 'coach@ditum.kz'),
             'demo-career-growth-insights',
             'Демонстрационный тест для платформы Career Growth Insights',
             'active'
         ) ON CONFLICT DO NOTHING;

-- Вставка аудит записи об инициализации
INSERT INTO audit_log (action, resource_type, details) VALUES (
                                                                  'database_initialized',
                                                                  'system',
                                                                  jsonb_build_object(
                                                                          'version', '1.0.0',
                                                                          'platform', 'Career Growth Insights',
                                                                          'domain', 'ditum.kz',
                                                                          'initialized_at', CURRENT_TIMESTAMP,
                                                                          'timezone', 'Asia/Almaty',
                                                                          'demo_users_created', 3,
                                                                          'demo_tests_created', 1,
                                                                          'system_settings_created', 10
                                                                  )
                                                              );

-- ===== ЗАВЕРШЕНИЕ ИНИЦИАЛИЗАЦИИ =====

-- Установка комментариев
COMMENT ON TABLE users IS 'Пользователи Career Growth Insights (администраторы и коучи)';
COMMENT ON TABLE tests IS 'Созданные тесты и проекты';
COMMENT ON TABLE test_sessions IS 'Сессии прохождения тестов участниками';
COMMENT ON TABLE test_results IS 'Результаты завершенных тестов с отчетами';
COMMENT ON TABLE system_settings IS 'Настройки системы';
COMMENT ON TABLE audit_log IS 'Журнал аудита действий пользователей';

-- Установка владельца таблиц
ALTER TABLE users OWNER TO career_user;
ALTER TABLE tests OWNER TO career_user;
ALTER TABLE test_sessions OWNER TO career_user;
ALTER TABLE test_results OWNER TO career_user;
ALTER TABLE system_settings OWNER TO career_user;
ALTER TABLE audit_log OWNER TO career_user;

-- Финальные сообщения
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Career Growth Insights database initialization completed!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created objects:';
    RAISE NOTICE '   - Tables: 6 (users, tests, test_sessions, test_results, system_settings, audit_log)';
    RAISE NOTICE '   - Indexes: 20+';
    RAISE NOTICE '   - Functions: 2';
    RAISE NOTICE '   - Triggers: 4';
    RAISE NOTICE '';
    RAISE NOTICE '👥 Demo accounts created:';
    RAISE NOTICE '   🔑 admin@ditum.kz (Administrator)';
    RAISE NOTICE '   👨‍💼 coach@ditum.kz (Coach)';
    RAISE NOTICE '   🆘 support@ditum.kz (Support)';
    RAISE NOTICE '   📝 Password for all: Demo123!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Demo test created:';
    RAISE NOTICE '   📊 Project: Демо проект Career Growth';
    RAISE NOTICE '   🔗 Golden Line: DITUM-DEMO-2024';
    RAISE NOTICE '   🌐 Link: demo-career-growth-insights';
    RAISE NOTICE '   ✅ Status: active';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️ System settings configured:';
    RAISE NOTICE '   📧 Support: support@ditum.kz';
    RAISE NOTICE '   🌐 Domain: ditum.kz';
    RAISE NOTICE '   📋 Questions: 48';
    RAISE NOTICE '   📅 Retention: 30 days';
    RAISE NOTICE '';
    RAISE NOTICE '🌐 Platform: Career Growth Insights';
    RAISE NOTICE '🏢 Company: Ditum';
    RAISE NOTICE '🕒 Timezone: Asia/Almaty';
    RAISE NOTICE '🌍 Domain: ditum.kz';
    RAISE NOTICE '📧 Email: support@ditum.kz';
    RAISE NOTICE '🔢 Version: 1.0.0';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for production deployment!';
END $$;