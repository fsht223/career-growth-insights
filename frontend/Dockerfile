# Frontend Dockerfile для ditum.kz
# Этап сборки
FROM node:18-alpine as build

WORKDIR /app

# Копирование package.json и установка зависимостей
COPY package*.json ./
RUN npm ci --silent && npm cache clean --force

# Копирование исходного кода
COPY . .

# Переменные окружения для сборки
ARG VITE_API_URL
ARG VITE_APP_NAME
ARG VITE_APP_DOMAIN

ENV VITE_API_URL=${VITE_API_URL:-http://localhost/api}
ENV VITE_APP_NAME=${VITE_APP_NAME:-"Career Growth Insights"}
ENV VITE_APP_DOMAIN=${VITE_APP_DOMAIN:-localhost}

# Сборка приложения для продакшена
RUN npm run build

# Этап продакшена с NGINX
FROM nginx:alpine

# Установка дополнительных пакетов
RUN apk add --no-cache curl

# Удаление стандартной конфигурации NGINX
RUN rm /etc/nginx/conf.d/default.conf

# Копирование собранного приложения
COPY --from=build /app/dist /usr/share/nginx/html

# Копирование конфигурации NGINX
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Создание файла конфигурации приложения
RUN echo 'window.APP_CONFIG = { \
  API_BASE_URL: "/api", \
  APP_NAME: "${VITE_APP_NAME:-Career Growth Insights}", \
  DOMAIN: "${VITE_APP_DOMAIN:-localhost}", \
  SUPPORT_EMAIL: "support@ditum.kz", \
  VERSION: "1.0.0" \
};' > /usr/share/nginx/html/config.js

# Обновление index.html для подключения конфигурации
RUN if [ -f /usr/share/nginx/html/index.html ]; then \
      sed -i '/<head>/a\  <script src="/config.js"></script>' /usr/share/nginx/html/index.html; \
    fi

# Установка прав доступа
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx

# Проверка здоровья
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/nginx-health || exit 1

# Экспорт портов
EXPOSE 80

# Команда запуска
CMD ["nginx", "-g", "daemon off;"]