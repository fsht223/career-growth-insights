#!/bin/bash

# Скрипт для настройки SSL сертификатов для ditum.kz
# Создайте этот файл как setup-ssl.sh

echo "🔒 Настройка SSL сертификатов для ditum.kz"

# Создание директории для SSL сертификатов
echo "📁 Создание директории ssl..."
mkdir -p ssl
chmod 755 ssl

# Проверка наличия файлов сертификатов
if [ ! -f "ditum.kz.csr" ] || [ ! -f "ditum.kz.key" ]; then
    echo "❌ Файлы сертификатов не найдены!"
    echo "Убедитесь что в текущей директории есть файлы:"
    echo "  - ditum.kz.csr (Certificate Signing Request)"
    echo "  - ditum.kz.key (Private Key)"
    echo ""
    echo "Если у вас есть полный сертификат (.crt или .pem), используйте его вместо .csr"
    exit 1
fi

echo "✅ Найдены файлы сертификатов"

# Преобразование .csr в .crt (если нужно)
if [ -f "ditum.kz.csr" ] && [ ! -f "ditum.kz.crt" ]; then
    echo "⚠️  Внимание: найден только .csr файл"
    echo "CSR файл используется для запроса сертификата у CA"
    echo "Для полноценной работы нужен подписанный сертификат (.crt)"
    echo ""
    echo "Варианты решения:"
    echo "1. Получите подписанный сертификат от вашего CA"
    echo "2. Используйте самоподписанный сертификат (только для тестирования)"
    echo ""
    read -p "Создать самоподписанный сертификат для тестирования? (y/N): " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔧 Создание самоподписанного сертификата..."
        openssl x509 -req -days 365 -in ditum.kz.csr -signkey ditum.kz.key -out ditum.kz.crt

        if [ $? -eq 0 ]; then
            echo "✅ Самоподписанный сертификат создан"
        else
            echo "❌ Ошибка создания сертификата"
            exit 1
        fi
    else
        echo "❌ Без действительного сертификата SSL не будет работать"
        exit 1
    fi
fi

# Копирование сертификатов в ssl директорию
echo "📋 Копирование сертификатов..."
cp ditum.kz.crt ssl/ditum.kz.crt 2>/dev/null || cp ditum.kz.pem ssl/ditum.kz.crt 2>/dev/null
cp ditum.kz.key ssl/ditum.kz.key

# Проверка файлов
if [ ! -f "ssl/ditum.kz.crt" ] || [ ! -f "ssl/ditum.kz.key" ]; then
    echo "❌ Ошибка копирования сертификатов"
    exit 1
fi

# Установка правильных прав доступа
echo "🔒 Установка прав доступа..."
chmod 644 ssl/ditum.kz.crt
chmod 600 ssl/ditum.kz.key
chown -R $USER:$USER ssl/

# Проверка сертификата
echo "🔍 Проверка сертификата..."
openssl x509 -in ssl/ditum.kz.crt -text -noout | grep -E "(Subject:|Issuer:|Not After)"

echo ""
echo "✅ SSL сертификаты настроены успешно!"
echo ""
echo "📁 Файлы сертификатов:"
echo "  - ssl/ditum.kz.crt (сертификат)"
echo "  - ssl/ditum.kz.key (приватный ключ)"
echo ""
echo "🚀 Теперь запустите проект:"
echo "  docker compose up --build -d"
echo ""
echo "🌐 После запуска сайт будет доступен:"
echo "  - http://ditum.kz → перенаправит на https://ditum.kz/login"
echo "  - https://ditum.kz → перенаправит на https://ditum.kz/login"
echo "  - https://ditum.kz/login → страница входа"