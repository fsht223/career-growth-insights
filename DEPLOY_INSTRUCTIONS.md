# 🚀 Инструкции по развертыванию Career Growth Insights

## 📋 Что было исправлено

### ✅ **Основные исправления:**
1. **Убрано монтирование nginx.conf** - теперь конфигурация копируется во время сборки
2. **Исправлен health check** - теперь проверяет `/nginx-health` endpoint
3. **Обновлены переменные окружения** - настроены для HTTP без SSL
4. **Создан скрипт быстрого развертывания** - `deploy-fixed.sh`

### ✅ **Что теперь работает:**
- Health check endpoint возвращает `nginx ok`
- Frontend контейнер помечается как `(healthy)`
- Правильная конфигурация nginx без конфликтов
- Быстрая сборка и развертывание

## 🚀 Быстрое развертывание на сервере

### **Вариант 1: Использование скрипта (рекомендуется)**

```bash
# 1. Сделать скрипт исполняемым
chmod +x deploy-fixed.sh

# 2. Запустить развертывание
./deploy-fixed.sh
```

### **Вариант 2: Ручное развертывание**

```bash
# 1. Остановить существующие сервисы
docker compose down

# 2. Очистить старые образы
docker system prune -f

# 3. Собрать frontend образ с правильной конфигурацией
docker build -f frontend/Dockerfile \
  --build-arg VITE_API_URL=http://localhost/api \
  --build-arg VITE_APP_NAME="Career Growth Insights" \
  --build-arg VITE_APP_DOMAIN=localhost \
  -t career-growth-insights-frontend ./frontend

# 4. Собрать backend образ
docker build -f backend/Dockerfile -t career-growth-insights-backend ./backend

# 5. Запустить все сервисы
docker compose up -d

# 6. Проверить статус
docker ps
```

## 🧪 Проверка работоспособности

### **Проверка health check:**
```bash
curl http://ditum.kz/nginx-health
# Должен вернуть: nginx ok
```

### **Проверка основного сайта:**
```bash
curl -I http://ditum.kz/
# Должен вернуть: HTTP/1.1 302 Moved Temporarily
# Location: http://ditum.kz/login
```

### **Проверка API:**
```bash
curl http://ditum.kz/api/health
# Должен вернуть JSON с информацией о сервисе
```

### **Проверка статуса контейнеров:**
```bash
docker ps
# Все контейнеры должны быть (healthy)
```

## 📊 Ожидаемый результат

После успешного развертывания:

```bash
# Статус контейнеров
CONTAINER ID   IMAGE                             STATUS                     PORTS
xxx           career-growth-insights-frontend   Up X minutes (healthy)    0.0.0.0:80->80/tcp
xxx           career-growth-insights-backend    Up X minutes (healthy)    127.0.0.1:5000->5000/tcp
xxx           postgres:15-alpine                Up X minutes (healthy)    127.0.0.1:5432->5432/tcp

# Health check
curl http://ditum.kz/nginx-health
nginx ok

# Основной сайт
curl -I http://ditum.kz/
HTTP/1.1 302 Moved Temporarily
Location: http://ditum.kz/login
```

## 🔧 Troubleshooting

### **Проблема: Health check не работает**
```bash
# Проверить конфигурацию nginx
docker exec career_growth_frontend cat /etc/nginx/conf.d/default.conf | grep nginx-health

# Проверить логи nginx
docker logs career_growth_frontend
```

### **Проблема: Сайт недоступен**
```bash
# Проверить порты
netstat -tlnp | grep :80

# Проверить firewall
sudo ufw status
```

### **Проблема: API не отвечает**
```bash
# Проверить логи backend
docker logs career_growth_backend

# Проверить подключение к БД
docker exec career_growth_postgres psql -U career_user -d career_growth_insights -c "SELECT 1;"
```

## 📝 Полезные команды

```bash
# Логи сервисов
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f postgres

# Перезапуск сервисов
docker compose restart frontend
docker compose restart backend

# Остановка всех сервисов
docker compose down

# Просмотр ресурсов
docker stats
```

## 🎯 Готово к работе!

После успешного развертывания:
- ✅ Frontend доступен на http://ditum.kz
- ✅ API доступен на http://ditum.kz/api
- ✅ База данных работает
- ✅ Health checks проходят
- ✅ Все контейнеры здоровы

**Сайт готов к использованию!** 🎉 