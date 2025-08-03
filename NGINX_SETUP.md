# 🔧 Настройка Nginx

## 📋 Обзор конфигурации

Проект содержит несколько конфигураций nginx:

### 🚀 Основная конфигурация (`nginx.conf`) - БЕЗ SSL
- **HTTP только** (порт 80)
- **Открытые CORS** настройки для разработки
- **Универсальная** конфигурация для разработки и тестирования
- **Поддерживает** localhost, ditum.kz, www.ditum.kz

### 🔐 SSL конфигурация (`nginx.ssl.conf`) - РЕЗЕРВНАЯ
- **SSL/HTTPS** поддержка с сертификатами
- **Безопасные CORS** настройки (только для ditum.kz)
- **HTTP → HTTPS** редирект
- **Оптимизированное кэширование**

### 🛠️ Конфигурация разработки (`nginx.dev.conf`)
- **HTTP только** (без SSL)
- **Открытые CORS** настройки для разработки
- **Порт 80** для локальной разработки

## 📁 Структура файлов

```
frontend/
├── nginx.conf          # Основная конфигурация (БЕЗ SSL)
├── nginx.ssl.conf      # SSL конфигурация (РЕЗЕРВНАЯ)
├── nginx.dev.conf      # Конфигурация разработки (HTTP)
└── Dockerfile          # Сборка с переменными окружения

docker-compose.yml      # Основной compose (БЕЗ SSL)
docker-compose.dev.yml  # Разработка без SSL
```

## 🚀 Запуск

### Основной запуск (БЕЗ SSL) - РЕКОМЕНДУЕТСЯ
```bash
# Запуск основной версии без SSL
docker-compose up -d
```

### Разработка (БЕЗ SSL)
```bash
# Запуск версии для разработки
docker-compose -f docker-compose.dev.yml up -d
```

### SSL версия (если нужна)
```bash
# Убедитесь, что SSL сертификаты на месте
ls ditum.kz.crt ditum.kz.key

# Временно переключитесь на SSL конфигурацию
cp frontend/nginx.ssl.conf frontend/nginx.conf
docker-compose up -d

# После тестирования вернитесь к основной конфигурации
cp frontend/nginx.conf frontend/nginx.conf.backup
```

## ⚙️ Конфигурация

### Переменные окружения для nginx

В `docker-compose.yml` (основной):
```yaml
environment:
  - VITE_API_URL=http://localhost/api
  - VITE_APP_NAME=Career Growth Insights
  - VITE_APP_DOMAIN=localhost
```

В `docker-compose.dev.yml`:
```yaml
environment:
  - VITE_API_URL=http://localhost:5000/api
  - VITE_APP_NAME=Career Growth Insights (Dev)
  - VITE_APP_DOMAIN=localhost
```

## 🔒 Безопасность

### CORS настройки
- **Основная конфигурация**: `Access-Control-Allow-Origin: *`
- **SSL конфигурация**: `Access-Control-Allow-Origin: https://ditum.kz`
- **Разработка**: `Access-Control-Allow-Origin: *`

### SSL настройки (только для nginx.ssl.conf)
- **Протоколы**: TLSv1.2, TLSv1.3
- **Шифры**: ECDHE-RSA-AES256-GCM-SHA512
- **Кэш сессий**: 10 минут

## 🐛 Отладка

### Проверка конфигурации nginx
```bash
# Внутри контейнера
docker exec career_growth_frontend nginx -t

# Логи nginx
docker logs career_growth_frontend
```

### Проверка подключения
```bash
# HTTP (основная конфигурация)
curl -I http://localhost

# HTTPS (если используете SSL)
curl -I https://ditum.kz
```

## 📝 Изменения в конфигурации

### Текущая конфигурация (БЕЗ SSL):
1. ✅ **Основная конфигурация без SSL** - упрощенная и универсальная
2. ✅ **Открытые CORS настройки** для разработки
3. ✅ **Убраны SSL сертификаты** из docker-compose.yml
4. ✅ **Обновлены переменные окружения** для HTTP
5. ✅ **Создана резервная SSL конфигурация** в nginx.ssl.conf

### Новые возможности:
- 🔄 **Универсальная конфигурация** работает на любом домене
- 🛠️ **Упрощенная настройка** для разработки
- ⚡ **Быстрый запуск** без SSL сертификатов
- 📱 **Оптимизированное кэширование** статических ресурсов
- 🔍 **Health checks** для всех сервисов

## 🔄 Переключение между конфигурациями

### Переход на SSL (когда понадобится):
```bash
# 1. Получите SSL сертификаты
# 2. Скопируйте SSL конфигурацию
cp frontend/nginx.ssl.conf frontend/nginx.conf

# 3. Обновите docker-compose.yml (добавьте SSL сертификаты)
# 4. Перезапустите
docker-compose down
docker-compose up -d
```

### Возврат к HTTP:
```bash
# Восстановите основную конфигурацию
cp frontend/nginx.conf.backup frontend/nginx.conf
docker-compose down
docker-compose up -d
```

## 📚 Дополнительная документация

- `README_NO_SSL.md` - подробные инструкции по запуску без SSL
- `docker-compose.dev.yml` - конфигурация для разработки 