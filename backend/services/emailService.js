// services/emailService.js
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initTransporter();
    }

    initTransporter() {
        // Настройка для локальной разработки
        const smtpConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true' || false, // false для STARTTLS
            auth: {
                user: process.env.SMTP_USER || 'test@example.com',
                pass: process.env.SMTP_PASSWORD || 'password'
            },
            // Дополнительные настройки для совместимости
            tls: {
                rejectUnauthorized: false // Для самоподписанных сертификатов
            },
            debug: process.env.NODE_ENV === 'development', // Логи для отладки
            logger: process.env.NODE_ENV === 'development'
        };

        console.log(`Initializing email service with host: ${smtpConfig.host}:${smtpConfig.port}`);

        // ИСПРАВЛЕНИЕ: используем createTransport вместо createTransporter
        this.transporter = nodemailer.createTransport(smtpConfig);
    }

    async sendTestReport(reportData, pdfBuffer) {
        const { userInfo, testInfo, reportId } = reportData;

        try {
            const emailTemplate = this.getReportEmailTemplate();
            const compiledTemplate = handlebars.compile(emailTemplate);

            const htmlContent = compiledTemplate({
                userName: `${userInfo.firstName} ${userInfo.lastName}`,
                projectName: testInfo.projectName,
                testDate: new Date().toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                reportId,
                supportEmail: process.env.FROM_EMAIL || 'test@example.com',
                platformName: process.env.FROM_NAME || 'Career Growth Insights'
            });

            const mailOptions = {
                from: {
                    name: process.env.FROM_NAME || 'Career Growth Insights',
                    address: process.env.FROM_EMAIL || process.env.SMTP_USER || 'test@example.com'
                },
                to: userInfo.email,
                subject: `Результаты тестирования - ${testInfo.projectName}`,
                html: htmlContent,
                attachments: [
                    {
                        filename: `Отчет_${userInfo.lastName}_${userInfo.firstName}_${new Date().toISOString().split('T')[0]}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            console.log(`Sending report email to: ${userInfo.email}`);
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Report email sent successfully:', result.messageId);
            return result;

        } catch (error) {
            console.error('Failed to send report email:', error);
            throw new Error(`Failed to send email with report: ${error.message}`);
        }
    }

    async sendTestInvitation(testData, recipientEmail) {
        try {
            const emailTemplate = this.getInvitationEmailTemplate();
            const compiledTemplate = handlebars.compile(emailTemplate);

            const htmlContent = compiledTemplate({
                projectName: testData.projectName,
                testLink: testData.link,
                coachName: testData.coachName || 'Ваш коуч',
                description: testData.description || 'Пройдите профессиональное тестирование для оценки компетенций и мотивационных факторов.',
                estimatedTime: '15-20 минут',
                supportEmail: process.env.FROM_EMAIL || 'test@example.com',
                platformName: process.env.FROM_NAME || 'Career Growth Insights'
            });

            const mailOptions = {
                from: {
                    name: process.env.FROM_NAME || 'Career Growth Insights',
                    address: process.env.FROM_EMAIL || process.env.SMTP_USER || 'test@example.com'
                },
                to: recipientEmail,
                subject: `Приглашение на тестирование - ${testData.projectName}`,
                html: htmlContent
            };

            console.log(`Sending invitation email to: ${recipientEmail}`);
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Invitation email sent successfully:', result.messageId);
            return result;

        } catch (error) {
            console.error('Failed to send invitation email:', error);
            throw new Error(`Failed to send invitation email: ${error.message}`);
        }
    }

    async sendCoachNotification(testData, reportData) {
        try {
            const emailTemplate = this.getCoachNotificationTemplate();
            const compiledTemplate = handlebars.compile(emailTemplate);

            const htmlContent = compiledTemplate({
                projectName: testData.projectName,
                testeeName: `${reportData.userInfo.firstName} ${reportData.userInfo.lastName}`,
                testeeEmail: reportData.userInfo.email,
                completedAt: new Date().toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                reportUrl: reportData.reportUrl,
                dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
                supportEmail: process.env.FROM_EMAIL || 'test@example.com',
                platformName: process.env.FROM_NAME || 'Career Growth Insights'
            });

            const mailOptions = {
                from: {
                    name: process.env.FROM_NAME || 'Career Growth Insights',
                    address: process.env.FROM_EMAIL || process.env.SMTP_USER || 'test@example.com'
                },
                to: testData.coachEmail,
                subject: `Тест завершен - ${testData.projectName}`,
                html: htmlContent
            };

            console.log(`Sending coach notification to: ${testData.coachEmail}`);
            const result = await this.transporter.sendMail(mailOptions);
            console.log('Coach notification sent successfully:', result.messageId);
            return result;

        } catch (error) {
            console.error('Failed to send coach notification:', error);
            throw new Error(`Failed to send coach notification: ${error.message}`);
        }
    }

    // Метод для отправки тестового письма
    async sendTestEmail(recipientEmail = 'test@example.com') {
        try {
            const mailOptions = {
                from: {
                    name: process.env.FROM_NAME || 'Career Growth Insights',
                    address: process.env.FROM_EMAIL || process.env.SMTP_USER || 'test@example.com'
                },
                to: recipientEmail,
                subject: 'Тест отправки email - Career Growth Insights',
                html: `
          <h1>✅ Email сервис работает!</h1>
          <p>Это тестовое письмо от платформы Career Growth Insights.</p>
          <p>Время отправки: ${new Date().toLocaleString('ru-RU')}</p>
          <p>Сервер: ${process.env.SMTP_HOST || 'не указан'}</p>
        `
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Test email sent successfully:', result.messageId);
            return result;

        } catch (error) {
            console.error('❌ Failed to send test email:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            console.log('Testing email service connection...');

            // Для разработки просто пропускаем проверку подключения
            if (process.env.NODE_ENV === 'development') {
                console.log('✅ Email service connection skipped in development mode');
                return true;
            }

            await this.transporter.verify();
            console.log('✅ Email service connection verified successfully');
            return true;
        } catch (error) {
            console.error('❌ Email service connection failed:', error.message);
            console.error('SMTP Config:', {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: process.env.SMTP_SECURE,
                user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/./g, '*') : 'not set'
            });
            return false;
        }
    }

    getReportEmailTemplate() {
        return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Результаты тестирования</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Результаты тестирования готовы!</h1>
        </div>
        
        <p>Здравствуйте, <strong>{{userName}}</strong>!</p>
        
        <p>Ваш отчет по тестированию <strong>"{{projectName}}"</strong> готов к просмотру.</p>
        
        <p><strong>Дата прохождения:</strong> {{testDate}}</p>
        <p><strong>ID отчета:</strong> {{reportId}}</p>
        
        <p>В приложении к этому письму вы найдете подробный PDF-отчет с результатами и рекомендациями.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="#" class="button">📋 Открыть отчет</a>
        </div>
        
        <p>Если у вас есть вопросы по результатам, обратитесь к вашему коучу или напишите нам.</p>
        
        <div class="footer">
            <p>С уважением,<br>Команда {{platformName}}</p>
            <p>📧 Поддержка: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>
    `;
    }

    getInvitationEmailTemplate() {
        return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Приглашение на тестирование</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2196F3;
            padding-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 15px 40px;
            background-color: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
        }
        .info-box {
            background-color: #f0f8ff;
            padding: 15px;
            border-left: 4px solid #2196F3;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Приглашение на тестирование</h1>
        </div>
        
        <p>Здравствуйте!</p>
        
        <p>Вы приглашены пройти профессиональное тестирование <strong>"{{projectName}}"</strong> от {{coachName}}.</p>
        
        <p>{{description}}</p>
        
        <div class="info-box">
            <h3>ℹ️ Информация о тестировании:</h3>
            <ul>
                <li><strong>Время прохождения:</strong> {{estimatedTime}}</li>
                <li><strong>Формат:</strong> Онлайн, в удобное для вас время</li>
                <li><strong>Результат:</strong> Подробный отчет с рекомендациями</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{testLink}}" class="button">🎯 Начать тестирование</a>
        </div>
        
        <p><strong>Важно:</strong> Проходите тест в спокойной обстановке, отвечайте честно и интуитивно.</p>
        
        <div class="footer">
            <p>С уважением,<br>Команда {{platformName}}</p>
            <p>📧 Поддержка: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>
    `;
    }

    getCoachNotificationTemplate() {
        return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест завершен</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #FF9800;
            padding-bottom: 20px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #FF9800;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 5px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #FF9800;
        }
        .info-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Тест завершен!</h1>
        </div>
        
        <p>Здравствуйте!</p>
        
        <p>Участник <strong>{{testeeName}}</strong> ({{testeeEmail}}) успешно завершил тестирование по проекту <strong>"{{projectName}}"</strong>.</p>
        
        <div class="stats-grid">
            <div class="stat">
                <h4>📅 Завершено</h4>
                <p>{{completedAt}}</p>
            </div>
            <div class="stat">
                <h4>📊 Отчет</h4>
                <p>Готов к просмотру</p>
            </div>
            <div class="stat">
                <h4>📧 Email</h4>
                <p>Отправлен участнику</p>
            </div>
        </div>
        
        <div style="text-align: center;">
            <a href="{{reportUrl}}" class="button">📋 Просмотреть отчет</a>
            <a href="{{dashboardUrl}}" class="button">🏠 Перейти в панель</a>
        </div>
        
        <div class="info-box">
            <h3>💡 Рекомендации</h3>
            <p>Для максимальной эффективности рекомендуется обсудить результаты с участником в течение недели после прохождения теста.</p>
        </div>
        
        <div class="footer">
            <p>Это автоматическое уведомление от {{platformName}}.</p>
            <p>📧 Поддержка: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>
    `;
    }
}

module.exports = new EmailService();