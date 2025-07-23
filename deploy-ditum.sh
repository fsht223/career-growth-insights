#!/bin/bash

# ===== CAREER GROWTH INSIGHTS - DITUM.KZ DEPLOYMENT =====
# Автоматическое развертывание платформы Career Growth Insights

echo "🏢 ===== CAREER GROWTH INSIGHTS DEPLOYMENT ====="
echo "🚀 Развертывание Career Growth Insights Platform на ditum.kz"
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

# Проверка прав root
if [ "$EUID" -eq 0 ]; then
    error "Не запускайте скрипт от root! Используйте пользователя с sudo правами."
    exit 1
fi

# Проверка системных требований
step "ЭТАП 1: Проверка системы"

# Проверка Docker
if ! command -v docker &> /dev/null; then
    error "Docker не установлен! Установка Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    log "Docker установлен"
else
    log "Docker найден: $(docker --version)"
fi

# Проверка Docker Compose
if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
    warn "Установка Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log "Docker Compose установлен"
else
    log "Docker Compose найден"
fi

# Проверка структуры проекта Career Growth Insights
step "ЭТАП 2: Проверка проекта Career Growth Insights"

required_files=(
    "docker-compose.yml"
    "init.sql"
    "backend/Dockerfile"
    "backend/package.json"
    "backend/app.js"
    "backend/.env"
    "frontend/Dockerfile"
    "frontend/package.json"
)

missing_files=()
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    error "Отсутствуют обязательные файлы Career Growth Insights:"
    for file in "${missing_files[@]}"; do
        echo "  ❌ $file"
    done
    exit 1
fi
log "Все файлы Career Growth Insights найдены"

# Создание необходимых директорий
step "ЭТАП 3: Подготовка окружения"

log "Создание директорий для Career Growth Insights..."
mkdir -p logs ssl backup temp
chmod 755 logs ssl backup temp

# Проверка конфигурации
if [ -f "backend/.env" ]; then
    if grep -q "Career Growth Insights\|ditum.kz" backend/.env; then
        log "Конфигурация настроена для Career Growth Insights"
    else
        warn "Конфигурация может быть не настроена для ditum.kz"
    fi
else
    error "Файл backend/.env не найден!"
    exit 1
fi

# Настройка firewall
step "ЭТАП 4: Настройка firewall"

log "Настройка портов для ditum.kz..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
check_status "Настройка firewall"

# Остановка существующих контейнеров
step "ЭТАП 5: Остановка существующих сервисов"

log "Остановка существующих контейнеров Career Growth Insights..."
sudo docker compose down --remove-orphans 2>/dev/null || true
check_status "Остановка контейнеров"

# Очистка (опционально)
echo ""
read -p "🗑️  Очистить старые образы для чистой установки Career Growth Insights? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    warn "Выполняется очистка старых образов..."
    sudo docker compose down --rmi all --volumes 2>/dev/null || true
    sudo docker system prune -f
    log "Очистка завершена"
fi

# Сборка образов
step "ЭТАП 6: Сборка Docker образов Career Growth Insights"

log "Сборка образов для Career Growth Insights на ditum.kz..."
echo "Это может занять несколько минут..."

# Сборка с выводом процесса
sudo docker compose build --no-cache --parallel
check_status "Сборка образов Career Growth Insights"

success "Образы Career Growth Insights успешно собраны!"

# Запуск контейнеров
step "ЭТАП 7: Запуск сервисов Career Growth Insights"

log "Запуск контейнеров..."
sudo docker compose up -d
check_status "Запуск контейнеров"

# Ожидание готовности сервисов
step "ЭТАП 8: Проверка готовности Career Growth Insights"

log "Ожидание готовности сервисов..."
sleep 30

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

# Проверка сервисов Career Growth Insights
log "Проверка здоровья всех сервисов Career Growth Insights..."

# PostgreSQL
if sudo docker compose exec -T postgres pg_isready -U career_user -d career_growth_insights > /dev/null 2>&1; then
    log "PostgreSQL готов ✅"
else
    warn "PostgreSQL недоступен"
fi

# Backend API
check_service_health "Backend API" "http://localhost:5000/health"

# Frontend (проверяем оба порта)
check_service_health "Frontend HTTP" "http://localhost:80"

# Проверка статуса контейнеров
step "ЭТАП 9: Статус контейнеров"

log "Текущий статус контейнеров Career Growth Insights:"
sudo docker compose ps

# Тестирование функциональности
step "ЭТАП 10: Тестирование Career Growth Insights"

# Тест API
log "Тестирование API..."
api_response=$(curl -s -w "%{http_code}" http://localhost:5000/health -o /dev/null)
if [ "$api_response" = "200" ]; then
    log "API тест пройден ✅"
else
    warn "API тест не прошел (код: $api_response)"
fi

# Тест Frontend
log "Тестирование Frontend..."
frontend_response=$(curl -s -w "%{http_code}" http://localhost:80 -o /dev/null)
if [ "$frontend_response" = "200" ]; then
    log "Frontend тест пройден ✅"
else
    warn "Frontend тест не прошел (код: $frontend_response)"
fi

# Тест базы данных
log "Тестирование базы данных Career Growth Insights..."
if sudo docker compose exec -T postgres psql -U career_user -d career_growth_insights -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    log "База данных Career Growth Insights инициализирована ✅"
else
    warn "Проблемы с базой данных"
fi

# Получение IP адреса сервера
SERVER_IP=$(hostname -I | awk '{print $1}')

# SSL сертификат (опционально)
step "ЭТАП 11: Настройка SSL (опционально)"

echo ""
read -p "🔒 Настроить SSL сертификат для ditum.kz? (рекомендуется для продакшена) (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log "Установка certbot..."
    sudo apt update && sudo apt install certbot -y

    warn "Для получения SSL сертификата:"
    echo "1. Убедитесь что домен ditum.kz направлен на IP: $SERVER_IP"
    echo "2. Выполните команды:"
    echo "   sudo docker compose down"
    echo "   sudo certbot certonly --standalone -d ditum.kz -d www.ditum.kz"
    echo "   sudo cp /etc/letsencrypt/live/ditum.kz/fullchain.pem ssl/ditum.kz.crt"
    echo "   sudo cp /etc/letsencrypt/live/ditum.kz/privkey.pem ssl/ditum.kz.key"
    echo "   sudo chown -R $USER:$USER ssl/"
    echo "   sudo docker compose up -d"
fi

# Финальная информация
step "CAREER GROWTH INSIGHTS РАЗВЕРНУТ!"

echo ""
echo "🎉 ===== CAREER GROWTH INSIGHTS УСПЕШНО РАЗВЕРНУТ! ====="
echo ""
echo -e "${BLUE}📊 Информация о развертывании:${NC}"
echo "  🌐 HTTP:         http://${SERVER_IP} (или http://ditum.kz)"
echo "  🔒 HTTPS:        https://ditum.kz (после настройки SSL)"
echo "  🔧 Backend API:  http://${SERVER_IP}:5000 (внутренний)"
echo "  💾 PostgreSQL:   ${SERVER_IP}:5432 (внутренний)"
echo ""
echo -e "${PURPLE}👥 Демо аккаунты Career Growth Insights (пароль: Demo123!):${NC}"
echo "  🔑 admin@ditum.kz   - Администратор"
echo "  👨‍💼 coach@ditum.kz    - Коуч"
echo "  🆘 support@ditum.kz - Поддержка"
echo ""
echo -e "${CYAN}📋 Полезные команды:${NC}"
echo "  📊 Статус:          sudo docker compose ps"
echo "  📜 Логи:            sudo docker compose logs -f [service]"
echo "  🔄 Перезапуск:      sudo docker compose restart [service]"
echo "  ⏹️  Остановка:       sudo docker compose down"
echo "  🗄️ БД консоль:      sudo docker compose exec postgres psql -U career_user -d career_growth_insights"
echo "  📈 Мониторинг:      sudo docker stats"
echo ""
echo -e "${YELLOW}⚠️  Настройки DNS для ditum.kz:${NC}"
echo "  Настройте A-записи в панели управления доменом:"
echo "  ditum.kz     A    ${SERVER_IP}"
echo "  www.ditum.kz A    ${SERVER_IP}"
echo ""
echo -e "${YELLOW}⚠️  Следующие шаги для продакшена:${NC}"
echo "  1. 🌐 Настройте DNS записи (указано выше)"
echo "  2. 🔒 Получите SSL сертификат (смотри инструкции выше)"
echo "  3. 🔐 Измените JWT_SECRET в backend/.env"
echo "  4. 🔑 Обновите пароли базы данных"
echo "  5. 📧 Настройте SMTP для ditum.kz"
echo ""
echo -e "${GREEN}✅ Career Growth Insights готов к работе!${NC}"
echo ""
echo "🔗 Доступ:"
echo "  HTTP:  http://${SERVER_IP} или http://ditum.kz"
echo "  HTTPS: https://ditum.kz (после настройки SSL)"
echo ""
echo "📧 Поддержка: support@ditum.kz"
echo "🏢 Платформа: Career Growth Insights"
echo ""
echo "===== ЗАВЕРШЕНО $(date '+%Y-%m-%d %H:%M:%S') ====="