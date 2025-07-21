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

-- Сессии
CREATE INDEX idx_test_sessions_test_id ON test_sessions(test_id);
CREATE INDEX idx_test_sessions_email ON test_sessions(email);
CREATE INDEX idx_test_sessions_completed ON test_sessions(completed);
CREATE INDEX idx_test_sessions_started_at ON test_sessions(started_at DESC);
CREATE INDEX idx_test_sessions_session_id ON test_sessions(session_id);

-- Результаты
CREATE INDEX idx_test_results_test_id ON test_results(test_id);
CREATE INDEX idx_test_results_email ON test_results(testee_email);
CREATE INDEX idx_test_results_completed_at ON test_results(completed_at DESC);
CREATE INDEX idx_test_results_pdf_status ON test_results(pdf_status);

-- Аудит
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ===== ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКИХ ОБНОВЛЕНИЙ =====

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_sessions_last_updated BEFORE UPDATE ON test_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ =====

-- Функция очистки старых сессий
CREATE OR REPLACE FUNCTION cleanup_old_sessions(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
deleted_count INTEGER;
BEGIN
DELETE FROM test_sessions
WHERE completed = false
  AND started_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_old;

GET DIAGNOSTICS deleted_count = ROW_COUNT;

INSERT INTO audit_log (action, resource_type, details) VALUES (
                                                                  'cleanup_old_sessions',
                                                                  'system',
                                                                  jsonb_build_object('deleted_sessions', deleted_count, 'days_old', days_old)
                                                              );

RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===== ВСТАВКА НАЧАЛЬНЫХ ДАННЫХ =====

-- Настройки системы по умолчанию
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
                                                                                                   ('app_name', 'Career Growth Insights', 'string', 'Название приложения', true),
                                                                                                   ('app_version', '1.0.0', 'string', 'Версия приложения', true),
                                                                                                   ('default_language', 'ru', 'string', 'Язык по умолчанию', true),
                                                                                                   ('supported_languages', '["ru", "kz", "en"]', 'json', 'Поддерживаемые языки', true),
                                                                                                   ('timezone', 'Asia/Almaty', 'string', 'Часовой пояс', true),
                                                                                                   ('company_name', 'Ditum', 'string', 'Название компании', true),
                                                                                                   ('support_email', 'support@ditum.kz', 'string', 'Email поддержки', true),
                                                                                                   ('domain', 'ditum.kz', 'string', 'Основной домен', true),
                                                                                                   ('max_file_size', '10485760', 'number', 'Максимальный размер файла в байтах', false),
                                                                                                   ('session_timeout', '30', 'number', 'Время жизни сессии в минутах', false),
                                                                                                   ('pdf_generation_timeout', '30000', 'number', 'Таймаут генерации PDF в миллисекундах', false),
                                                                                                   ('email_notifications_enabled', 'true', 'boolean', 'Включены ли email уведомления', false);

-- Создание демо пользователей с зашифрованными паролями
-- Пароль для всех: Demo123!
-- Хеш получен через: bcrypt.hash('Demo123!', 12)
INSERT INTO users (email, password_hash, first_name, last_name, role, company, is_active, email_verified) VALUES
                                                                                                              ('admin@ditum.kz', '$2a$12$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Администратор', 'Career Growth', 'admin', 'Ditum', true, true),
                                                                                                              ('coach@ditum.kz', '$2a$12$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Коуч', 'Insights', 'coach', 'Ditum', true, true),
                                                                                                              ('support@ditum.kz', '$2a$12$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Поддержка', 'Команда', 'coach', 'Ditum', true, true)
    ON CONFLICT (email) DO NOTHING;

-- Создание демо теста
INSERT INTO tests (
    project_name,
    golden_line,
    language,
    coach_email,
    coach_id,
    link,
    description
) VALUES (
             'Демо проект Career Growth',
             'DITUM-DEMO-2024',
             'ru',
             'coach@ditum.kz',
             (SELECT id FROM users WHERE email = 'coach@ditum.kz'),
             'demo-career-growth-insights',
             'Демонстрационный тест для платформы Career Growth Insights'
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
                                                                          'demo_tests_created', 1
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

-- Финальные сообщения
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Career Growth Insights database initialization completed!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created objects:';
    RAISE NOTICE '   - Tables: 6 (users, tests, test_sessions, test_results, system_settings, audit_log)';
    RAISE NOTICE '   - Indexes: 15+';
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
    RAISE NOTICE '';
    RAISE NOTICE '🌐 Platform: Career Growth Insights';
    RAISE NOTICE '🏢 Company: Ditum';
    RAISE NOTICE '🕒 Timezone: Asia/Almaty';
    RAISE NOTICE '🌍 Domain: ditum.kz';
    RAISE NOTICE '📧 Email: support@ditum.kz';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for production deployment!';
END $$;