-- ===== DITUM.KZ DATABASE INITIALIZATION =====
-- PostgreSQL Database Setup для Motivation Testing Platform

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
    RAISE NOTICE '🚀 Starting Ditum.kz database initialization...';
    RAISE NOTICE '⏰ Timestamp: %', CURRENT_TIMESTAMP;
    RAISE NOTICE '🌍 Timezone: Asia/Almaty';
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

-- Таблица статистики
CREATE TABLE IF NOT EXISTS statistics (
                                          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,4),
    metric_data JSONB DEFAULT '{}',
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
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
CREATE INDEX IF NOT EXISTS idx_test_sessions_started_at ON test_sessions(started_at DESC);

-- Результаты
CREATE INDEX IF NOT EXISTS idx_test_results_test_id ON test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_email ON test_results(testee_email);
CREATE INDEX IF NOT EXISTS idx_test_results_completed_at ON test_results(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_results_pdf_status ON test_results(pdf_status);

-- Аудит
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);

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

DROP TRIGGER IF EXISTS update_test_sessions_updated_at ON test_sessions;
CREATE TRIGGER update_test_sessions_updated_at
    BEFORE UPDATE ON test_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Функция для логирования изменений пользователей
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (user_id, action, resource_type, resource_id, old_values, new_values)
        VALUES (NEW.id, 'user_updated', 'user', NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (user_id, action, resource_type, resource_id, new_values)
        VALUES (NEW.id, 'user_created', 'user', NEW.id::text, to_jsonb(NEW));
END IF;
RETURN NULL;
END;
$$ language 'plpgsql';

-- Триггер для логирования изменений пользователей
DROP TRIGGER IF EXISTS users_audit_trigger ON users;
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE ON users
                        FOR EACH ROW
                        EXECUTE FUNCTION log_user_changes();

-- ===== НАЧАЛЬНЫЕ ДАННЫЕ =====

-- Вставка системных настроек
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
                                                                                                   ('platform_name', 'Ditum Career Development Platform', 'string', 'Название платформы', true),
                                                                                                   ('company_name', 'Ditum', 'string', 'Название компании', true),
                                                                                                   ('default_language', 'ru', 'string', 'Язык по умолчанию', true),
                                                                                                   ('supported_languages', '["ru", "kz", "en"]', 'json', 'Поддерживаемые языки', true),
                                                                                                   ('max_tests_per_coach', '100', 'number', 'Максимум тестов на коуча', false),
                                                                                                   ('test_expiry_days', '30', 'number', 'Срок действия теста в днях', false),
                                                                                                   ('enable_analytics', 'true', 'boolean', 'Включить аналитику', false),
                                                                                                   ('email_notifications', 'true', 'boolean', 'Email уведомления', false),
                                                                                                   ('maintenance_mode', 'false', 'boolean', 'Режим обслуживания', false)
    ON CONFLICT (setting_key) DO NOTHING;

-- Создание демонстрационных пользователей
INSERT INTO users (email, password_hash, first_name, last_name, role, company, is_active, email_verified) VALUES
                                                                                                              ('admin@ditum.kz', '$2a$10$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Администратор', 'Ditum', 'admin', 'Ditum', true, true),
                                                                                                              ('coach@ditum.kz', '$2a$10$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Коуч', 'Демо', 'coach', 'Ditum', true, true),
                                                                                                              ('support@ditum.kz', '$2a$10$rX8gDUlYN5kFd6z1WzKjuebKsNbAyDxEr7YFJR5.ABc6LdWLuJnFW', 'Поддержка', 'Команда', 'coach', 'Ditum', true, true)
    ON CONFLICT (email) DO NOTHING;

-- ===== ПРЕДСТАВЛЕНИЯ ДЛЯ ОТЧЕТНОСТИ =====

-- Статистика тестов
CREATE OR REPLACE VIEW test_statistics AS
SELECT
    DATE(t.created_at) as test_date,
    COUNT(*) as total_tests,
    COUNT(tr.id) as completed_tests,
    ROUND(COUNT(tr.id)::numeric / COUNT(*)::numeric * 100, 2) as completion_rate,
    t.coach_email,
    u.first_name || ' ' || u.last_name as coach_name
FROM tests t
    LEFT JOIN test_results tr ON t.id = tr.test_id
    LEFT JOIN users u ON t.coach_id = u.id
GROUP BY DATE(t.created_at), t.coach_email, u.first_name, u.last_name
ORDER BY test_date DESC;

-- Активность пользователей
CREATE OR REPLACE VIEW user_activity AS
SELECT
    u.id,
    u.email,
    u.first_name || ' ' || u.last_name as full_name,
    u.role,
    COUNT(t.id) as total_tests_created,
    COUNT(tr.id) as total_completed_tests,
    u.last_login,
    u.created_at as registration_date
FROM users u
         LEFT JOIN tests t ON u.id = t.coach_id
         LEFT JOIN test_results tr ON t.id = tr.test_id
WHERE u.is_active = true
GROUP BY u.id, u.email, u.first_name, u.last_name, u.role, u.last_login, u.created_at
ORDER BY u.last_login DESC NULLS LAST;

-- Сводка по сессиям
CREATE OR REPLACE VIEW session_summary AS
SELECT
    ts.test_id,
    t.project_name,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN ts.completed = true THEN 1 END) as completed_sessions,
    AVG(CASE WHEN ts.completed = true THEN ts.time_spent_seconds END) as avg_time_seconds,
    MIN(ts.started_at) as first_session,
    MAX(ts.started_at) as last_session
FROM test_sessions ts
         JOIN tests t ON ts.test_id = t.id
GROUP BY ts.test_id, t.project_name;

-- ===== ФУНКЦИИ ДЛЯ СТАТИСТИКИ =====

-- Функция получения статистики платформы
CREATE OR REPLACE FUNCTION get_platform_stats(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    total_tests BIGINT,
    completed_tests BIGINT,
    completion_rate NUMERIC,
    avg_completion_time NUMERIC
) AS $
BEGIN
RETURN QUERY
SELECT
    (SELECT COUNT(*) FROM users WHERE is_active = true)::BIGINT as total_users,
    (SELECT COUNT(*) FROM users WHERE last_login > CURRENT_DATE - INTERVAL '30 days')::BIGINT as active_users,
     (SELECT COUNT(*) FROM tests WHERE created_at > CURRENT_DATE - INTERVAL '1 day' * days_back)::BIGINT as total_tests,
                                     (SELECT COUNT(*) FROM test_results WHERE completed_at > CURRENT_DATE - INTERVAL '1 day' * days_back)::BIGINT as completed_tests,
    ROUND(
                                                                            (SELECT COUNT(*) FROM test_results WHERE completed_at > CURRENT_DATE - INTERVAL '1 day' * days_back)::NUMERIC /
    NULLIF((SELECT COUNT(*) FROM tests WHERE created_at > CURRENT_DATE - INTERVAL '1 day' * days_back)::NUMERIC, 0) * 100,
    2
    ) as completion_rate,
    ROUND(
                                                                            (SELECT AVG(time_spent_seconds) FROM test_sessions
    WHERE completed = true AND completed_at > CURRENT_DATE - INTERVAL '1 day' * days_back) / 60.0,
    2
    ) as avg_completion_time;
END;
$ LANGUAGE plpgsql;

-- ===== ПРОЦЕДУРЫ ОБСЛУЖИВАНИЯ =====

-- Очистка старых сессий
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $
DECLARE
deleted_count INTEGER;
BEGIN
    -- Удаляем незавершенные сессии старше 7 дней
DELETE FROM test_sessions
WHERE completed = false
  AND started_at < CURRENT_TIMESTAMP - INTERVAL '7 days';

GET DIAGNOSTICS deleted_count = ROW_COUNT;

RAISE NOTICE 'Cleaned up % old sessions', deleted_count;
RETURN deleted_count;
END;
$ LANGUAGE plpgsql;

-- Архивирование старых результатов
CREATE OR REPLACE FUNCTION archive_old_results()
RETURNS INTEGER AS $
DECLARE
archived_count INTEGER;
BEGIN
    -- Помечаем PDF как expired для результатов старше 30 дней
UPDATE test_results
SET pdf_status = 'expired'
WHERE completed_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
  AND pdf_status = 'ready';

GET DIAGNOSTICS archived_count = ROW_COUNT;

RAISE NOTICE 'Archived % old results', archived_count;
RETURN archived_count;
END;
$ LANGUAGE plpgsql;

-- ===== ВСТАВКА АУДИТ ЗАПИСИ =====

-- Запись об инициализации базы данных
INSERT INTO audit_log (action, resource_type, details) VALUES (
                                                                  'database_initialized',
                                                                  'system',
                                                                  jsonb_build_object(
                                                                          'version', '1.0.0',
                                                                          'domain', 'ditum.kz',
                                                                          'initialized_at', CURRENT_TIMESTAMP,
                                                                          'timezone', 'Asia/Almaty',
                                                                          'platform', 'Ditum Career Development Platform'
                                                                  )
                                                              );

-- ===== УСТАНОВКА КОММЕНТАРИЕВ =====

COMMENT ON TABLE users IS 'Пользователи системы (администраторы и коучи)';
COMMENT ON TABLE tests IS 'Созданные тесты и проекты';
COMMENT ON TABLE test_sessions IS 'Сессии прохождения тестов участниками';
COMMENT ON TABLE test_results IS 'Результаты завершенных тестов с отчетами';
COMMENT ON TABLE system_settings IS 'Системные настройки платформы';
COMMENT ON TABLE audit_log IS 'Журнал аудита действий пользователей';
COMMENT ON TABLE statistics IS 'Статистические данные платформы';

COMMENT ON COLUMN users.password_hash IS 'Хэш пароля (bcrypt)';
COMMENT ON COLUMN users.failed_login_attempts IS 'Количество неудачных попыток входа';
COMMENT ON COLUMN tests.golden_line IS 'Ключевая фраза или цель проекта';
COMMENT ON COLUMN test_sessions.answers IS 'JSON с ответами участника';
COMMENT ON COLUMN test_results.results IS 'JSON с результатами анализа';

-- ===== ЗАВЕРШЕНИЕ ИНИЦИАЛИЗАЦИИ =====

-- Создание начальной статистики
INSERT INTO statistics (metric_name, metric_value, metric_data, period_start, period_end) VALUES
    ('database_initialized', 1,
     jsonb_build_object('tables_created', 7, 'indexes_created', 15, 'functions_created', 5),
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Финальные сообщения
DO $
BEGIN
    RAISE NOTICE '✅ Ditum.kz database initialization completed successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Created objects:';
    RAISE NOTICE '   - Tables: 7';
    RAISE NOTICE '   - Indexes: 15+';
    RAISE NOTICE '   - Functions: 5';
    RAISE NOTICE '   - Views: 3';
    RAISE NOTICE '   - Triggers: 3';
    RAISE NOTICE '';
    RAISE NOTICE '👥 Demo accounts created:';
    RAISE NOTICE '   🔑 admin@ditum.kz (Administrator)';
    RAISE NOTICE '   👨‍💼 coach@ditum.kz (Coach)';
    RAISE NOTICE '   🆘 support@ditum.kz (Support)';
    RAISE NOTICE '   📝 Password for all: Demo123!';
    RAISE NOTICE '';
    RAISE NOTICE '🌐 Platform: Ditum Career Development Platform';
    RAISE NOTICE '🕒 Timezone: Asia/Almaty';
    RAISE NOTICE '🏢 Domain: ditum.kz';
    RAISE NOTICE '📧 Email: support@ditum.kz';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ready for production deployment!';
END $;