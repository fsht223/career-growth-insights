# 🚀 Запуск проекта без SSL

## 📋 Обзор

Проект настроен для работы без SSL сертификатов. Это подходит для:
- 🛠️ Разработки и тестирования
- 🏠 Локального использования
- 🧪 Демонстрации функционала

## 🔧 Конфигурация

### Nginx (без SSL)
- **Порт**: 80 (HTTP)
- **CORS**: Открытые настройки для разработки
- **Домены**: localhost, ditum.kz, www.ditum.kz

### Переменные окружения
```bash
# Frontend
VITE_API_URL=http://localhost/api
VITE_APP_NAME=Career Growth Insights
VITE_APP_DOMAIN=localhost

# Backend
FRONTEND_URL=http://localhost
NODE_ENV=development
```

## 🚀 Быстрый запуск

### 1. Клонирование и настройка
```bash
git clone <repository-url>
cd career-growth-insights
```

### 2. Создание .env файлов
```bash
# Backend .env
cp env.example backend/.env
# Отредактируйте backend/.env под ваши нужды
```

### 3. Запуск проекта
```bash
# Запуск всех сервисов
docker-compose up -d

# Или с логами
docker-compose up
```

### 4. Проверка работы
```bash
# Frontend
curl http://localhost

# Backend API
curl http://localhost/api/health

# База данных
docker exec career_growth_postgres psql -U career_user -d career_growth_insights -c "SELECT version();"
```

## 📊 Доступные сервисы

| Сервис | URL | Порт | Описание |
|--------|-----|------|----------|
| Frontend | http://localhost | 80 | React приложение |
| Backend API | http://localhost/api | 80 (прокси) | Node.js API |
| Database | localhost | 5432 | PostgreSQL |

## 🔍 Отладка

### Логи контейнеров
```bash
# Все сервисы
docker-compose logs

# Конкретный сервис
docker-compose logs frontend
docker-compose logs backend
docker-compose logs postgres
```

### Проверка nginx
```bash
# Проверка конфигурации
docker exec career_growth_frontend nginx -t

# Логи nginx
docker exec career_growth_frontend tail -f /var/log/nginx/error.log
```

### Проверка API
```bash
# Health check
curl http://localhost/health

# API endpoints
curl http://localhost/api/auth/status
```

## 🛠️ Разработка

### Hot reload для frontend
```bash
# Запуск в режиме разработки
cd frontend
npm run dev
```

### Hot reload для backend
```bash
# Запуск в режиме разработки
cd backend
npm run dev
```

## 🔒 Безопасность

⚠️ **Важно**: Эта конфигурация предназначена для разработки и тестирования.

### CORS настройки
- **Access-Control-Allow-Origin**: `*` (открыто для всех доменов)
- **Access-Control-Allow-Credentials**: `true`
- **Access-Control-Allow-Methods**: `GET, POST, PUT, DELETE, OPTIONS`

### Рекомендации для продакшна
1. Настройте SSL сертификаты
2. Ограничьте CORS до конкретных доменов
3. Включите HTTPS редирект
4. Настройте безопасные заголовки

## 📝 Изменения в конфигурации

### Что было изменено:
1. ✅ **Убраны SSL сертификаты** из docker-compose.yml
2. ✅ **Упрощена конфигурация nginx** - только HTTP на порту 80
3. ✅ **Открытые CORS настройки** для разработки
4. ✅ **Обновлены переменные окружения** для HTTP
5. ✅ **Убран HTTPS редирект**

### Файлы конфигурации:
- `frontend/nginx.conf` - основная конфигурация без SSL
- `docker-compose.yml` - обновлен для работы без SSL
- `frontend/nginx.dev.conf` - резервная конфигурация для разработки

## 🚀 Миграция на SSL

Когда будете готовы к продакшну:

1. Получите SSL сертификаты
2. Восстановите SSL конфигурацию nginx
3. Обновите docker-compose.yml
4. Настройте HTTPS редирект
5. Ограничьте CORS настройки

Подробные инструкции см. в `NGINX_SETUP.md` 