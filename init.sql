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

-- ===== ПОЛЬЗОВАТЕЛИ И АУТЕНТИФИКАЦИЯ =====

-- Таблица пользователей (коучей и администраторов)
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS tests (
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
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'active', 'completed', 'expired', 'cancelled')),
    link TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                              );

-- ===== СЕССИИ ТЕСТИРОВАНИЯ =====

-- Таблица сессий прохождения тестов
CREATE TABLE IF NOT EXISTS test_sessions (
                                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    session_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    profession VARCHAR(100),
    company VARCHAR(255),
    phone VARCHAR(20),
    current_question INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 40,
    answers JSONB DEFAULT '{}',
    motivational_selection JSONB DEFAULT '[]',
    completed BOOLEAN DEFAULT FALSE,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    time_spent_seconds INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    browser_fingerprint TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                          );

-- ===== РЕЗУЛЬТАТЫ И ОТЧЕТЫ =====

-- Таблица результатов тестирования
CREATE TABLE IF NOT EXISTS test_results (
                                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
    session_id UUID REFERENCES test_sessions(session_id) ON DELETE CASCADE,
    testee_email VARCHAR(255) NOT NULL,
    testee_name VARCHAR(255) NOT NULL,
    profession VARCHAR(100),
    company VARCHAR(255),
    results JSONB NOT NULL,
    score_data JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '{}',
    personality_profile JSONB DEFAULT '{}',
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                          report_url TEXT,
                                          pdf_status VARCHAR(20) DEFAULT 'generating' CHECK (pdf_status IN ('generating', 'ready', 'failed', 'expired')),
    pdf_path VARCHAR(255),
    pdf_size_bytes INTEGER,
    pdf_generated_at TIMESTAMP WITH TIME ZONE,
    pdf_error TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
                                          email_error TEXT
                                          );

-- ===== СИСТЕМНЫЕ ТАБЛИЦЫ =====

-- Таблица настроек системы
CREATE TABLE IF NOT EXISTS system_settings (
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
CREATE TABLE IF NOT EXISTS audit_log (
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Тесты
CREATE INDEX IF NOT EXISTS idx_tests_coach_id ON tests(coach_id);
CREATE INDEX IF NOT EXISTS idx_tests_status ON tests(status);
CREATE INDEX IF NOT EXISTS idx_tests_created_at ON tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tests_coach_email ON tests(coach_email);

-- Сессии
CREATE INDEX IF NOT EXISTS idx_test_sessions_test_id ON test_sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_email ON test_sessions(email);
CREATE INDEX IF NOT EXISTS idx_test_sessions_completed ON test_sessions(completed);

-- Результаты
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_email ON test_results(testee_email);

-- ===== ФУНКЦИИ И ТРИГГЕРЫ =====

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tests_updated_at ON tests;
CREATE TRIGGER update_tests_updated_at
    BEFORE UPDATE ON tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===== НАЧАЛЬНЫЕ ДАННЫЕ =====

-- Вставка системных настроек
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
                                                                                                   ('platform_name', 'Career Growth Insights', 'string', 'Название платформы', true),
                                                                                                   ('company_name', 'Ditum', 'string', 'Название компании', true),
                                                                                                   ('default_language', 'ru', 'string', 'Язык по умолчанию', true),
                                                                                                   ('supported_languages', '["ru", "kz", "en"]', 'json', 'Поддерживаемые языки', true),
                                                                                                   ('max_tests_per_coach', '100', 'number', 'Максимум тестов на коуча', false),
                                                                                                   ('test_expiry_days', '30', 'number', 'Срок действия теста в днях', false),
                                                                                                   ('enable_analytics', 'true', 'boolean', 'Включить аналитику', false)
    ON CONFLICT (setting_key) DO NOTHING;

-- Создание демонстрационных пользователей для Career Growth Insights
INSERT INTO users (email, password_hash, first_name, last_name, role, company, is_active, email_verified) VALUES
                                                                                                              ('admin@ditum.kz', '$2a$10$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Администратор', 'Career Growth', 'admin', 'Ditum', true, true),
                                                                                                              ('coach@ditum.kz', '$2a$10$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Коуч', 'Insights', 'coach', 'Ditum', true, true),
                                                                                                              ('support@ditum.kz', '$2a$10$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Поддержка', 'Команда', 'coach', 'Ditum', true, true)
    ON CONFLICT (email) DO NOTHING;

-- Вставка аудит записи об инициализации
INSERT INTO audit_log (action, resource_type, details) VALUES (
                                                                  'database_initialized',
                                                                  'system',
                                                                  jsonb_build_object(
                                                                          'version', '1.0.0',
                                                                          'platform', 'Career Growth Insights',
                                                                          'domain', 'ditum.kz',
                                                                          'initialized_at', CURRENT_TIMESTAMP,
                                                                          'timezone', 'Asia/Almaty'
                                                                  )
                                                              );

-- ===== ЗАВЕРШЕНИЕ ИНИЦИАЛИЗАЦИИ =====

-- Установка комментариев
COMMENT ON TABLE users IS 'Пользователи Career Growth Insights (администраторы и коучи)';
COMMENT ON TABLE tests IS 'Созданные тесты и проекты';
COMMENT ON TABLE test_sessions IS 'Сессии прохождения тестов участниками';
COMMENT ON TABLE test_results IS 'Результаты завершенных тестов с отчетами';

-- Финальные сообщения
DO $$
BEGIN
    RAISE NOTICE '✅ Career Growth Insights database initialization completed!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created objects:';
    RAISE NOTICE '   - Tables: 6';
    RAISE NOTICE '   - Indexes: 10+';
    RAISE NOTICE '   - Functions: 2';
    RAISE NOTICE '   - Triggers: 2';
    RAISE NOTICE '';
    RAISE NOTICE '👥 Demo accounts created:';
    RAISE NOTICE '   🔑 admin@ditum.kz (Administrator)';
    RAISE NOTICE '   👨‍💼 coach@ditum.kz (Coach)';
    RAISE NOTICE '   🆘 support@ditum.kz (Support)';
    RAISE NOTICE '   📝 Password for all: Demo123!';
    RAISE NOTICE '';
    RAISE NOTICE '🌐 Platform: Career Growth Insights';
    RAISE NOTICE '🏢 Company: Ditum';
    RAISE NOTICE '🕒 Timezone: Asia/Almaty';
    RAISE NOTICE '🌍 Domain: ditum.kz';
    RAISE NOTICE '📧 Email: support@ditum.kz';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for production deployment!';
END $$;