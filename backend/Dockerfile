# Backend Dockerfile для ditum.kz
FROM node:18-alpine

# Установка системных зависимостей
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    wget \
    bash \
    openssl

# Настройка Puppeteer для генерации PDF
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROMIUM_FLAGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage"

# Создание рабочей директории
WORKDIR /app

# Создание пользователя nodejs для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Копирование package.json и установка зависимостей
COPY package*.json ./
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Копирование исходного кода
COPY . .

# Создание необходимых директорий
RUN mkdir -p uploads logs temp && \
    chown -R nodejs:nodejs /app

# Переключение на пользователя nodejs
USER nodejs

# Проверка здоровья сервиса
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Экспорт порта
EXPOSE 5000

# Команда запуска с задержкой для БД
CMD ["sh", "-c", "sleep 15 && node db/safe-setup-database.js && npm start"]