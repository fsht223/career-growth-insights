-- Database schema updates for admin panel
-- File: backend/db/admin_schema.sql

-- Add admin role and status columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS activation_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Create questions table for managing test questions
CREATE TABLE IF NOT EXISTS questions (
                                         id SERIAL PRIMARY KEY,
                                         question_text TEXT NOT NULL,
                                         motivational_group VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'behavior',
    language VARCHAR(10) DEFAULT 'ru',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Create golden_lines table for managing benchmark values
CREATE TABLE IF NOT EXISTS golden_lines (
                                            id SERIAL PRIMARY KEY,
                                            profession VARCHAR(100) NOT NULL,
    golden_line_values JSONB NOT NULL,
    language VARCHAR(10) DEFAULT 'ru',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(profession, language)
    );

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
                                               id SERIAL PRIMARY KEY,
                                               setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Insert default admin user (hidden admin for testing)
INSERT INTO users (email, password_hash, first_name, last_name, role, status)
VALUES (
           'admin@system.local',
           '$2b$10$XYZ123...', -- This should be a properly hashed password
           'System',
           'Administrator',
           'admin',
           'active'
       ) ON CONFLICT (email) DO NOTHING;

-- Insert default questions (sample data)
INSERT INTO questions (question_text, motivational_group, category, language) VALUES
                                                                                  ('Я обеспечиваю соответствие моей работы высшим стандартам', 'Perfectionism', 'behavior', 'ru'),
                                                                                  ('Я делаю все необходимое для достижения моих целей', 'Reaching Goals', 'behavior', 'ru'),
                                                                                  ('Я придаю значение социальному взаимодействию с коллегами', 'Social Contact', 'behavior', 'ru'),
                                                                                  ('Я основываю свои решения на осязаемых данных', 'Being Logical', 'behavior', 'ru'),
                                                                                  ('Мне нравится помогать тем, кто обращается ко мне с проблемами', 'Bringing Happiness', 'behavior', 'ru'),
                                                                                  ('Я полагаюсь на интуицию при принятии решений', 'Intuition', 'behavior', 'ru'),
                                                                                  ('Конкурентная среда мотивирует меня к совершенству', 'Success', 'behavior', 'ru'),
                                                                                  ('Мне нравится работать с целями', 'Reaching Goals', 'behavior', 'ru'),
                                                                                  ('Я хотел бы, чтобы мои усилия были признаны', 'Recognition', 'behavior', 'ru'),
                                                                                  ('Я постоянно проверяю точность представленной мне информации', 'Perfectionism', 'behavior', 'ru'),
                                                                                  ('Моя интуиция часто правильно меня направляет', 'Intuition', 'behavior', 'ru'),
                                                                                  ('Я хочу, чтобы рабочая среда была приятной', 'Professional Pleasure', 'behavior', 'ru'),
                                                                                  ('Я достигаю своих целей последовательно', 'Reaching Goals', 'behavior', 'ru'),
                                                                                  ('Меня мотивируют задачи, которые, как я считаю, будут для меня выгодны', 'Value', 'behavior', 'ru'),
                                                                                  ('Я сочетаю рациональное мышление с интуицией', 'Intuition', 'behavior', 'ru'),
                                                                                  ('Я стараюсь выполнять работу безупречно', 'Perfectionism', 'behavior', 'ru'),
                                                                                  ('Я хочу, чтобы меня уважали за мои достижения', 'Respect', 'behavior', 'ru'),
                                                                                  ('Я готов принимать сложные решения', 'Resilience', 'behavior', 'ru'),
                                                                                  ('Я стремлюсь к интеллектуальному росту', 'Intellectual Discovery', 'behavior', 'ru'),
                                                                                  ('Я считаю важным работать эффективно', 'Efficiency', 'behavior', 'ru'),
                                                                                  ('Я хочу влиять на решения команды', 'Influence', 'behavior', 'ru'),
                                                                                  ('Мне важно понимать чувства других людей', 'Empathy', 'behavior', 'ru'),
                                                                                  ('Я ценю одобрение коллег', 'Social Approval', 'behavior', 'ru'),
                                                                                  ('Мне нравится быть частью команды', 'Team Spirit', 'behavior', 'ru'),
                                                                                  ('Я стараюсь делать других счастливыми', 'Bringing Happiness', 'behavior', 'ru'),
                                                                                  ('Я предпочитаю работать с единомышленниками', 'Social Contact', 'behavior', 'ru'),
                                                                                  ('Я хочу, чтобы мое мнение имело вес', 'Influence', 'behavior', 'ru'),
                                                                                  ('Я стремлюсь к признанию своих заслуг', 'Recognition', 'behavior', 'ru'),
                                                                                  ('Я готов идти на обоснованный риск', 'Resilience', 'behavior', 'ru'),
                                                                                  ('Я хочу получать удовольствие от работы', 'Professional Pleasure', 'behavior', 'ru'),
                                                                                  ('Я ищу возможности для обучения', 'Intellectual Discovery', 'behavior', 'ru'),
                                                                                  ('Я принимаю решения на основе логики', 'Being Logical', 'behavior', 'ru'),
                                                                                  ('Я стремлюсь к совершенству в работе', 'Perfectionism', 'behavior', 'ru'),
                                                                                  ('Я хочу достигать поставленных целей', 'Reaching Goals', 'behavior', 'ru'),
                                                                                  ('Я ценю работу, которая имеет смысл', 'Value', 'behavior', 'ru'),
                                                                                  ('Я предпочитаю работать в дружном коллективе', 'Team Spirit', 'behavior', 'ru'),
                                                                                  ('Я хочу, чтобы ко мне относились с уважением', 'Respect', 'behavior', 'ru'),
                                                                                  ('Я стремлюсь к эффективности в работе', 'Efficiency', 'behavior', 'ru'),
                                                                                  ('Я хочу понимать мотивы людей', 'Empathy', 'behavior', 'ru'),
                                                                                  ('Я ценю социальное взаимодействие', 'Social Contact', 'behavior', 'ru'),

-- English versions
                                                                                  ('I ensure my work meets the highest standards', 'Perfectionism', 'behavior', 'en'),
                                                                                  ('I do everything necessary to achieve my goals', 'Reaching Goals', 'behavior', 'en'),
                                                                                  ('I value social interaction with colleagues', 'Social Contact', 'behavior', 'en'),
                                                                                  ('I base my decisions on tangible data', 'Being Logical', 'behavior', 'en'),
                                                                                  ('I like helping those who come to me with problems', 'Bringing Happiness', 'behavior', 'en'),
                                                                                  ('I rely on intuition when making decisions', 'Intuition', 'behavior', 'en'),
                                                                                  ('A competitive environment motivates me to excellence', 'Success', 'behavior', 'en'),
                                                                                  ('I like working with goals', 'Reaching Goals', 'behavior', 'en'),
                                                                                  ('I would like my efforts to be recognized', 'Recognition', 'behavior', 'en'),
                                                                                  ('I constantly verify the accuracy of information presented to me', 'Perfectionism', 'behavior', 'en'),
                                                                                  ('My intuition often guides me correctly', 'Intuition', 'behavior', 'en'),
                                                                                  ('I want the work environment to be pleasant', 'Professional Pleasure', 'behavior', 'en'),
                                                                                  ('I achieve my goals consistently', 'Reaching Goals', 'behavior', 'en'),
                                                                                  ('I am motivated by tasks that I believe will benefit me', 'Value', 'behavior', 'en'),
                                                                                  ('I combine rational thinking with intuition', 'Intuition', 'behavior', 'en'),
                                                                                  ('I strive to perform work flawlessly', 'Perfectionism', 'behavior', 'en'),
                                                                                  ('I want to be respected for my achievements', 'Respect', 'behavior', 'en'),
                                                                                  ('I am ready to make difficult decisions', 'Resilience', 'behavior', 'en'),
                                                                                  ('I strive for intellectual growth', 'Intellectual Discovery', 'behavior', 'en'),
                                                                                  ('I consider it important to work efficiently', 'Efficiency', 'behavior', 'en'),
                                                                                  ('I want to influence team decisions', 'Influence', 'behavior', 'en'),
                                                                                  ('It is important for me to understand the feelings of others', 'Empathy', 'behavior', 'en'),
                                                                                  ('I value the approval of colleagues', 'Social Approval', 'behavior', 'en'),
                                                                                  ('I like being part of a team', 'Team Spirit', 'behavior', 'en'),
                                                                                  ('I try to make others happy', 'Bringing Happiness', 'behavior', 'en'),
                                                                                  ('I prefer working with like-minded people', 'Social Contact', 'behavior', 'en'),
                                                                                  ('I want my opinion to carry weight', 'Influence', 'behavior', 'en'),
                                                                                  ('I strive for recognition of my merits', 'Recognition', 'behavior', 'en'),
                                                                                  ('I am ready to take calculated risks', 'Resilience', 'behavior', 'en'),
                                                                                  ('I want to enjoy my work', 'Professional Pleasure', 'behavior', 'en'),
                                                                                  ('I seek opportunities for learning', 'Intellectual Discovery', 'behavior', 'en'),
                                                                                  ('I make decisions based on logic', 'Being Logical', 'behavior', 'en'),
                                                                                  ('I strive for perfection in work', 'Perfectionism', 'behavior', 'en'),
                                                                                  ('I want to achieve set goals', 'Reaching Goals', 'behavior', 'en'),
                                                                                  ('I value work that has meaning', 'Value', 'behavior', 'en'),
                                                                                  ('I prefer working in a friendly team', 'Team Spirit', 'behavior', 'en'),
                                                                                  ('I want to be treated with respect', 'Respect', 'behavior', 'en'),
                                                                                  ('I strive for efficiency in work', 'Efficiency', 'behavior', 'en'),
                                                                                  ('I want to understand people\'s motives', 'Empathy', 'behavior', 'en'),
('I value social interaction', 'Social Contact', 'behavior', 'en')

ON CONFLICT DO NOTHING;

-- Insert default golden lines
INSERT INTO golden_lines (profession, golden_line_values, language) VALUES
('C Level', '{
  "perfectionism": 85,
                                                                                   "reaching_goals": 95,
                                                                                   "social_contact": 70,
                                                                                   "being_logical": 90,
                                                                                   "bringing_happiness": 60,
                                                                                   "intuition": 75,
                                                                                   "success": 95,
                                                                                   "recognition": 80,
                                                                                   "professional_pleasure": 75,
                                                                                   "resilience": 90,
                                                                                   "social_approval": 65,
                                                                                   "team_spirit": 70,
                                                                                   "intellectual_discovery": 85,
                                                                                   "empathy": 70,
                                                                                   "influence": 90,
                                                                                   "respect": 85,
                                                                                   "value": 80,
                                                                                   "efficiency": 85
}', 'ru'),

('Маркетинг', '{
  "perfectionism": 75,
                                                                                   "reaching_goals": 85,
                                                                                   "social_contact": 90,
                                                                                   "being_logical": 80,
                                                                                   "bringing_happiness": 85,
                                                                                   "intuition": 80,
                                                                                   "success": 85,
                                                                                   "recognition": 85,
                                                                                   "professional_pleasure": 80,
                                                                                   "resilience": 75,
                                                                                   "social_approval": 80,
                                                                                   "team_spirit": 85,
                                                                                   "intellectual_discovery": 80,
                                                                                   "empathy": 85,
                                                                                   "influence": 85,
                                                                                   "respect": 75,
                                                                                   "value": 80,
                                                                                   "efficiency": 80
}', 'ru'),

('Продажи', '{
  "perfectionism": 65,
                                                                                   "reaching_goals": 95,
                                                                                   "social_contact": 85,
                                                                                   "being_logical": 75,
                                                                                   "bringing_happiness": 80,
                                                                                   "intuition": 75,
                                                                                   "success": 95,
                                                                                   "recognition": 90,
                                                                                   "professional_pleasure": 85,
                                                                                   "resilience": 90,
                                                                                   "social_approval": 75,
                                                                                   "team_spirit": 70,
                                                                                   "intellectual_discovery": 70,
                                                                                   "empathy": 80,
                                                                                   "influence": 90,
                                                                                   "respect": 80,
                                                                                   "value": 85,
                                                                                   "efficiency": 85
}', 'ru'),

('HR', '{
  "perfectionism": 70,
                                                                                   "reaching_goals": 80,
                                                                                   "social_contact": 95,
                                                                                   "being_logical": 75,
                                                                                   "bringing_happiness": 95,
                                                                                   "intuition": 80,
                                                                                   "success": 70,
                                                                                   "recognition": 75,
                                                                                   "professional_pleasure": 85,
                                                                                   "resilience": 80,
                                                                                   "social_approval": 85,
                                                                                   "team_spirit": 95,
                                                                                   "intellectual_discovery": 75,
                                                                                   "empathy": 95,
                                                                                   "influence": 80,
                                                                                   "respect": 85,
                                                                                   "value": 90,
                                                                                   "efficiency": 80
}', 'ru'),

('IT', '{
  "perfectionism": 90,
                                                                                   "reaching_goals": 85,
                                                                                   "social_contact": 60,
                                                                                   "being_logical": 95,
                                                                                   "bringing_happiness": 65,
                                                                                   "intuition": 70,
                                                                                   "success": 80,
                                                                                   "recognition": 75,
                                                                                   "professional_pleasure": 85,
                                                                                   "resilience": 85,
                                                                                   "social_approval": 60,
                                                                                   "team_spirit": 70,
                                                                                   "intellectual_discovery": 95,
                                                                                   "empathy": 65,
                                                                                   "influence": 70,
                                                                                   "respect": 80,
                                                                                   "value": 85,
                                                                                   "efficiency": 90
}', 'ru'),

('Финансы', '{
  "perfectionism": 95,
                                                                                   "reaching_goals": 90,
                                                                                   "social_contact": 65,
                                                                                   "being_logical": 95,
                                                                                   "bringing_happiness": 60,
                                                                                   "intuition": 65,
                                                                                   "success": 85,
                                                                                   "recognition": 80,
                                                                                   "professional_pleasure": 75,
                                                                                   "resilience": 85,
                                                                                   "social_approval": 70,
                                                                                   "team_spirit": 70,
                                                                                   "intellectual_discovery": 85,
                                                                                   "empathy": 70,
                                                                                   "influence": 75,
                                                                                   "respect": 85,
                                                                                   "value": 85,
                                                                                   "efficiency": 95
}', 'ru')

ON CONFLICT (profession, language) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value) VALUES
('allow_coach_registration', 'true'),
('email_notifications', 'true'),
('analytics_enabled', 'true'),
('default_language', 'ru'),
('supported_languages', '["ru", "en"]'),
('session_timeout', '3600'),
('max_test_duration', '7200'),
('backup_retention_days', '30'),
('admin_email', 'admin@system.local'),
('platform_name', 'Тестовая платформа')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_language ON questions(language);
CREATE INDEX IF NOT EXISTS idx_questions_group ON questions(motivational_group);
CREATE INDEX IF NOT EXISTS idx_golden_lines_profession ON golden_lines(profession);
CREATE INDEX IF NOT EXISTS idx_golden_lines_language ON golden_lines(language);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_test_sessions_completed ON test_sessions(completed);
CREATE INDEX IF NOT EXISTS idx_test_sessions_started_at ON test_sessions(started_at);

-- Update triggers for timestamp fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_golden_lines_updated_at
    BEFORE UPDATE ON golden_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE tests
ADD CONSTRAINT fk_tests_coach_id
FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create view for admin analytics
CREATE OR REPLACE VIEW admin_analytics AS
SELECT
    DATE_TRUNC('day', ts.started_at) as test_date,
    COUNT(*) as total_tests,
    COUNT(CASE WHEN ts.completed = true THEN 1 END) as completed_tests,
    COUNT(CASE WHEN ts.completed = false THEN 1 END) as incomplete_tests,
    COUNT(DISTINCT ts.email) as unique_participants,
    AVG(CASE WHEN ts.completed = true THEN
        EXTRACT(EPOCH FROM (ts.completed_at - ts.started_at))/60
    END) as avg_completion_time_minutes
FROM test_sessions ts
GROUP BY DATE_TRUNC('day', ts.started_at)
ORDER BY test_date DESC;

-- Grant permissions