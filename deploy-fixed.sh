#!/bin/bash

# 🚀 Быстрое развертывание Career Growth Insights с исправлениями
# 📅 $(date '+%Y-%m-%d %H:%M:%S')
# ==================================================

set -e

echo "🚀 Быстрое развертывание Career Growth Insights с исправлениями"
echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="

# Включение BuildKit для ускорения сборки
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Функция для логирования
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Функция для проверки ошибок
check_error() {
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка: $1"
        exit 1
    fi
}

# ЭТАП 1: Проверка системы
log "👉 ЭТАП 1: Проверка системы"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не найден"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose не найден"
    exit 1
fi

log "✅ Docker найден: $(docker --version)"
log "✅ Docker Compose найден"

# ЭТАП 2: Остановка существующих сервисов
log "👉 ЭТАП 2: Остановка существующих сервисов"
docker compose down --remove-orphans 2>/dev/null || true
log "✅ Существующие сервисы остановлены"

# ЭТАП 3: Очистка старых образов
log "👉 ЭТАП 3: Очистка старых образов"
docker system prune -f
log "✅ Очистка завершена"

# ЭТАП 4: Сборка с исправленной конфигурацией
log "👉 ЭТАП 4: Сборка с исправленной конфигурацией"
log "⏱️  Сборка frontend образа с правильной nginx конфигурацией..."

# Сборка frontend образа
docker build -f frontend/Dockerfile \
  --build-arg VITE_API_URL=http://localhost/api \
  --build-arg VITE_APP_NAME="Career Growth Insights" \
  --build-arg VITE_APP_DOMAIN=localhost \
  -t career-growth-insights-frontend ./frontend

check_error "Ошибка при сборке frontend образа"

# Сборка backend образа
log "⏱️  Сборка backend образа..."
docker build -f backend/Dockerfile -t career-growth-insights-backend ./backend

check_error "Ошибка при сборке backend образа"

# ЭТАП 5: Запуск сервисов
log "👉 ЭТАП 5: Запуск сервисов"
docker compose up -d

check_error "Ошибка при запуске сервисов"

# ЭТАП 6: Проверка работоспособности
log "👉 ЭТАП 6: Проверка работоспособности"
sleep 15

# Проверка frontend
if curl -f http://localhost:80/nginx-health > /dev/null 2>&1; then
    log "✅ Frontend health check прошел"
else
    log "⚠️  Frontend health check не прошел, проверьте логи"
fi

# Проверка backend
if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    log "✅ Backend API готов"
else
    log "⚠️  Backend API не готов, проверьте логи"
fi

# Проверка базы данных
if docker exec career_growth_postgres pg_isready -U career_user -d career_growth_insights > /dev/null 2>&1; then
    log "✅ База данных PostgreSQL готова"
else
    log "⚠️  База данных не готова"
fi

echo ""
echo "🎉 Развертывание завершено!"
echo "=================================================="
echo "📊 Информация о развертывании:"
echo "  🌐 HTTP:         http://localhost (или http://ditum.kz)"
echo "  🔧 Backend API:  http://localhost:5000 (внутренний)"
echo "  💾 PostgreSQL:   localhost:5432 (внутренний)"
echo ""
echo "📋 Полезные команды:"
echo "  📊 Статус:          docker compose ps"
echo "  📜 Логи:            docker compose logs -f [service]"
echo "  🔄 Перезапуск:      docker compose restart [service]"
echo "  ⏹️  Остановка:       docker compose down"
echo ""
echo "🧪 Тестирование:"
echo "  Health Check:      curl http://localhost/nginx-health"
echo "  Основной сайт:     curl -I http://localhost/"
echo "  API Health:        curl http://localhost/api/health"
echo ""
echo "✅ Career Growth Insights готов к работе!" 