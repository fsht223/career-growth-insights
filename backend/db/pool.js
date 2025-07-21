// backend/db/pool.js
const { Pool } = require('pg');

// Конфигурация подключения БЕЗ SSL
const poolConfig = {
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'career_growth_insights',
  user: process.env.DB_USER || 'career_user',
  password: process.env.DB_PASSWORD || 'DitumSecure2024!',
  ssl: false, // ОТКЛЮЧАЕМ SSL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Альтернативная конфигурация через URL
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  poolConfig.host = url.hostname;
  poolConfig.port = parseInt(url.port);
  poolConfig.database = url.pathname.slice(1);
  poolConfig.user = url.username;
  poolConfig.password = url.password;

  // Проверяем SSL параметры из URL
  if (url.searchParams.get('sslmode') === 'disable') {
    poolConfig.ssl = false;
  }
}

console.log('🔗 Connecting to PostgreSQL:', {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  ssl: poolConfig.ssl
});

const pool = new Pool(poolConfig);

// Обработка ошибок подключения
pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Тест подключения
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

module.exports = pool;