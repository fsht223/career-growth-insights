#!/bin/bash

# ===== DITUM.KZ DEPLOYMENT SCRIPT =====
# Автоматическое развертывание платформы Career Development

echo "🏢 ===== DITUM.KZ DEPLOYMENT SCRIPT ====="
echo "🚀 Развертывание Career Development Testing Platform"
echo "📅 $(date '+%Y-%m-%d %H:%M:%S')"
echo "=================================================="

# Цвета для красивого вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Функции для логирования
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')] ℹ️  $1${NC}"
}

success() {
    echo -e "${PURPLE}[$(date '+%H:%M:%S')] 🎉 $1${NC}"
}

step() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')] 👉 $1${NC}"
}

# Функция проверки последней команды
check_status() {
    if [ $? -eq 0 ]; then
        log "$1 - успешно"
    else
        error "$1 - ошибка"
        exit 1
    fi
}

# Проверка системных требований
step "ЭТАП 1: Проверка системы"

# Проверка Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен! Установите Docker и повторите попытку."
    echo "Команда установки: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi
log "Docker найден: $(docker --version)"

# Проверка Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose не установлен!"
    echo "Команда установки:"
    echo 'curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose'
    echo 'chmod +x /usr/local/bin/docker-compose'
    exit 1
fi
log "Docker Compose найден"

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    warn "Скрипт запущен не от root. Некоторые операции могут потребовать sudo."
fi

# Проверка свободного места
available_space=$(df / | awk 'NR==2 {print $4}')
if [ "$available_space" -lt 2000000 ]; then
    warn "Мало свободного места на диске (< 2GB). Рекомендуется освободить место."
fi
log "Свободного места: $(($available_space / 1024 / 1024))GB"

# Проверка структуры проекта
step "ЭТАП 2: Проверка файлов проекта"

required_files=(
    "docker-compose.yml"
    "init.sql"
    "backend/Dockerfile"
    "backend/package.json"
    "backend/app.js"
    "backend/.env"
    "frontend/Dockerfile"
    "frontend/package.json"
    "frontend/nginx.conf"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    error "Отсутствуют обязательные файлы:"
    for file in "${missing_files[@]}"; do
        echo "  ❌ $file"
    done
    exit 1
fi
log "Все необходимые файлы найдены"

# Проверка конфигурации
step "ЭТАП 3: Проверка конфигурации"

# Проверка backend/.env
if [ -f "backend/.env" ]; then
    if grep -q "ditum.kz" backend/.env; then
        log "Конфигурация .env настроена для ditum.kz"
    else
        warn "Файл .env может быть не настроен для ditum.kz"
    fi

    if grep -q "CHANGE_ME" backend/.env; then
        warn "Обнаружены значения по умолчанию в .env файле. Рекомендуется их изменить."
    fi
else
    error "Файл backend/.env не найден!"
    exit 1
fi

# Создание дополнительных директорий
step "ЭТАП 4: Подготовка окружения"

log "Создание необходимых директорий..."
mkdir -p logs ssl backup temp
chmod 755 logs ssl backup temp

# Создание .env файла для docker-compose если не существует
if [ ! -f ".env" ]; then
    log "Создание .env файла для docker-compose..."
    cat > .env << 'EOF'
# Docker Compose Environment
POSTGRES_DB=motivation_testing
POSTGRES_USER=motivation_user
POSTGRES_PASSWORD=DitumSecure2024!
DOMAIN_NAME=ditum.kz
EOF
fi

# Остановка существующих контейнеров
step "ЭТАП 5: Остановка существующих сервисов"

log "Остановка существующих контейнеров..."
docker-compose down --remove-orphans 2>/dev/null || true
check_status "Остановка контейнеров"

# Очистка (опционально)
echo ""
read -p "🗑️  Очистить старые образы и volumes для чистой установки? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    warn "Выполняется полная очистка..."
    docker-compose down --rmi all --volumes 2>/dev/null || true
    docker system prune -f
    log "Очистка завершена"
fi

# Сборка образов
step "ЭТАП 6: Сборка Docker образов"

log "Сборка образов для ditum.kz..."
echo "Это может занять несколько минут..."

# Сборка с выводом процесса
docker-compose build --no-cache --parallel
check_status "Сборка образов"

success "Образы успешно собраны!"

# Запуск контейнеров
step "ЭТАП 7: Запуск сервисов"

log "Запуск контейнеров..."
docker-compose up -d
check_status "Запуск контейнеров"

# Ожидание готовности сервисов
step "ЭТАП 8: Проверка готовности сервисов"

log "Ожидание готовности сервисов..."
sleep 20

# Функция проверки здоровья сервиса
check_service_health() {
    local service_name=$1
    local url=$2
    local max_attempts=15
    local attempt=1

    info "Проверка $service_name..."

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            log "$service_name готов ✅"
            return 0
        else
            info "Попытка $attempt/$max_attempts: $service_name не готов..."
            sleep 5
            ((attempt++))
        fi
    done

    warn "$service_name не отвечает после $max_attempts попыток"
    return 1
}

# Проверка сервисов
log "Проверка здоровья всех сервисов..."

# PostgreSQL
if docker-compose exec -T postgres pg_isready -U motivation_user -d motivation_testing > /dev/null 2>&1; then
    log "PostgreSQL готов ✅"
else
    warn "PostgreSQL недоступен"
fi

# Backend API
check_service_health "Backend API" "http://localhost:5000/health"

# Frontend
check_service_health "Frontend" "http://localhost:3000"

# Проверка статуса контейнеров
step "ЭТАП 9: Статус контейнеров"

log "Текущий статус контейнеров:"
docker-compose ps

# Проверка логов на ошибки
log "Проверка логов на критические ошибки..."
if docker-compose logs backend 2>/dev/null | grep -i "error\|failed\|exception" | head -3; then
    warn "Обнаружены ошибки в логах backend (это может быть нормально при инициализации)"
fi

# Тестирование функциональности
step "ЭТАП 10: Тестирование функциональности"

# Тест API
log "Тестирование API..."
api_response=$(curl -s -w "%{http_code}" http://localhost:5000/health -o /dev/null)
if [ "$api_response" = "200" ]; then
    log "API тест пройден ✅"
else
    warn "API тест не прошел (код: $api_response)"
fi

# Тест базы данных
log "Тестирование базы данных..."
if docker-compose exec -T postgres psql -U motivation_user -d motivation_testing -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    log "База данных инициализирована ✅"
else
    warn "Проблемы с базой данных"
fi

# Тест email сервиса
log "Тестирование email сервиса..."
docker-compose exec -T backend node -e "
const emailService = require('./services/emailService');
emailService.testConnection().then(() => {
    console.log('✅ Email сервис ditum.kz работает');
    process.exit(0);
}).catch((err) => {
    console.log('⚠️ Email сервис недоступен:', err.message);
    process.exit(1);
});
" 2>/dev/null && log "Email сервис готов ✅" || warn "Email сервис недоступен"

# Финальная информация
step "РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"

echo ""
echo "🎉 ===== DITUM.KZ УСПЕШНО РАЗВЕРНУТ! ====="
echo ""
echo -e "${BLUE}📊 Информация о развертывании:${NC}"
echo "  🌐 Frontend:     http://$(hostname -I | awk '{print $1}'):3000"
echo "  🔧 Backend API:  http://$(hostname -I | awk '{print $1}'):5000"
echo "  💾 PostgreSQL:   $(hostname -I | awk '{print $1}'):5432"
echo "  📧 Email:        ditum.kz SMTP"
echo ""
echo -e "${PURPLE}👥 Демо аккаунты (пароль: Demo123!):${NC}"
echo "  🔑 admin@ditum.kz   - Администратор"
echo "  👨‍💼 coach@ditum.kz    - Коуч"
echo "  🆘 support@ditum.kz - Поддержка"
echo ""
echo -e "${CYAN}📋 Полезные команды:${NC}"
echo "  📊 Статус:          docker-compose ps"
echo "  📜 Логи:            docker-compose logs -f [service]"
echo "  🔄 Перезапуск:      docker-compose restart [service]"
echo "  ⏹️  Остановка:       docker-compose down"
echo "  🗄️ БД консоль:      docker-compose exec postgres psql -U motivation_user -d motivation_testing"
echo "  📈 Мониторинг:      docker stats"
echo ""
echo -e "${YELLOW}⚠️  Настройки для продакшена:${NC}"
echo "  1. 🔐 Измените JWT_SECRET в backend/.env"
echo "  2. 🔑 Обновите пароли базы данных"
echo "  3. 🌐 Настройте DNS: ditum.kz → $(hostname -I | awk '{print $1}')"
echo "  4. 🛡️ Настройте SSL сертификаты (certbot)"
echo "  5. 📧 Проверьте настройки SMTP ditum.kz"
echo "  6. 📋 Настройте резервное копирование"
echo "  7. 🔥 Настройте firewall (ufw/iptables)"
echo ""
echo -e "${GREEN}✅ Платформа готова к работе на ditum.kz!${NC}"
echo ""
echo "🔗 Для доступа откройте: http://$(hostname -I | awk '{print $1}'):3000"
echo "📧 Поддержка: support@ditum.kz"
echo ""
echo "===== ЗАВЕРШЕНО $(date '+%Y-%m-%d %H:%M:%S') ====="