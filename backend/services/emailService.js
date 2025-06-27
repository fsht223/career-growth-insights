// services/emailService.js
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    // Настройка для сервера ditum.kz
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'ditum.kz',
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true' || true, // true для SSL/TLS
      auth: {
        user: process.env.SMTP_USER || 'test@ditum.kz',
        pass: process.env.SMTP_PASSWORD
      },
      // Дополнительные настройки для совместимости
      tls: {
        rejectUnauthorized: false // Для самоподписанных сертификатов
      },
      debug: process.env.NODE_ENV === 'development', // Логи для отладки
      logger: process.env.NODE_ENV === 'development'
    };

    // Для разработки - используем Gmail настройки как fallback
    if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
      smtpConfig.host = 'smtp.gmail.com';
      smtpConfig.port = 587;
      smtpConfig.secure = false;
      smtpConfig.auth.user = 'alisher.ibraev03@gmail.com';
      smtpConfig.auth.pass = 'pyam ondy twqt pola';
    }

    console.log(`Initializing email service with host: ${smtpConfig.host}:${smtpConfig.port}`);

    this.transporter = nodemailer.createTransporter(smtpConfig);
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
        supportEmail: process.env.FROM_EMAIL || 'test@ditum.kz',
        platformName: process.env.FROM_NAME || 'Career Growth Insights'
      });

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Career Growth Insights',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER || 'test@ditum.kz'
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
        supportEmail: process.env.FROM_EMAIL || 'test@ditum.kz',
        platformName: process.env.FROM_NAME || 'Career Growth Insights'
      });

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Career Growth Insights',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER || 'test@ditum.kz'
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
        dashboardUrl: `${process.env.FRONTEND_URL || 'https://ditum.kz'}/dashboard`,
        supportEmail: process.env.FROM_EMAIL || 'test@ditum.kz',
        platformName: process.env.FROM_NAME || 'Career Growth Insights'
      });

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Career Growth Insights',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER || 'test@ditum.kz'
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
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 28px;
        }
        .content {
            margin-bottom: 30px;
        }
        .info-box {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #1e40af;
        }
        .button {
            display: inline-block;
            background: #1e40af;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .feature {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #0ea5e9;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Ваши результаты готовы!</h1>
            <p>{{platformName}} - Персональная оценка компетенций</p>
        </div>
        
        <div class="content">
            <h2>Здравствуйте, {{userName}}!</h2>
            
            <p>Спасибо за прохождение тестирования в рамках проекта <strong>{{projectName}}</strong>.</p>
            
            <div class="info-box">
                <h3>📋 Информация о тестировании</h3>
                <p><strong>Проект:</strong> {{projectName}}</p>
                <p><strong>Дата прохождения:</strong> {{testDate}}</p>
                <p><strong>ID отчета:</strong> {{reportId}}</p>
            </div>
            
            <div class="features">
                <div class="feature">
                    <h4>📈 Профиль компетенций</h4>
                    <p>Детальный анализ</p>
                </div>
                <div class="feature">
                    <h4>🎯 Мотивационные факторы</h4>
                    <p>Личные драйверы</p>
                </div>
                <div class="feature">
                    <h4>💡 Рекомендации</h4>
                    <p>План развития</p>
                </div>
                <div class="feature">
                    <h4>📊 Benchmarking</h4>
                    <p>Сравнение с эталоном</p>
                </div>
            </div>
            
            <h3>📄 Персональный отчет</h3>
            <p>Ваш детальный отчет с результатами тестирования прикреплен к этому письму. Отчет содержит:</p>
            <ul>
                <li>Профиль профессиональных компетенций</li>
                <li>Анализ мотивационных факторов</li>
                <li>Сильные стороны и области развития</li>
                <li>Персональные рекомендации</li>
                <li>План профессионального развития</li>
            </ul>
            
            <div class="info-box">
                <h3>🔒 Конфиденциальность</h3>
                <p>Ваши данные защищены и используются исключительно для составления персонального отчета. 
                Отчет предназначен исключительно для вашего личного использования и профессионального развития.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Если у вас есть вопросы по результатам тестирования, обратитесь к коучу, который предоставил вам доступ к тесту.</p>
            <p>📧 Поддержка: {{supportEmail}}</p>
            <p>© 2024 {{platformName}} | ditum.kz</p>
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
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #1e40af;
            margin: 0;
        }
        .content {
            margin-bottom: 30px;
        }
        .info-box {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #1e40af;
        }
        .button {
            display: inline-block;
            background: #1e40af;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
            text-align: center;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .feature {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #0ea5e9;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Приглашение на тестирование</h1>
            <p>{{platformName}} - Персональная оценка компетенций</p>
        </div>
        
        <div class="content">
            <h2>Здравствуйте!</h2>
            
            <p>Вы приглашены пройти профессиональное тестирование в рамках проекта <strong>{{projectName}}</strong>.</p>
            
            <p>{{description}}</p>
            
            <div class="info-box">
                <h3>📋 Детали тестирования</h3>
                <p><strong>Проект:</strong> {{projectName}}</p>
                <p><strong>Время прохождения:</strong> {{estimatedTime}}</p>
                <p><strong>Количество вопросов:</strong> 40</p>
                <p><strong>Коуч:</strong> {{coachName}}</p>
            </div>
            
            <div class="features">
                <div class="feature">
                    <h4>⏱️ {{estimatedTime}}</h4>
                    <p>Время прохождения</p>
                </div>
                <div class="feature">
                    <h4>❓ 40 вопросов</h4>
                    <p>Структурированный тест</p>
                </div>
                <div class="feature">
                    <h4>📊 Глубокий анализ</h4>
                    <p>Детальные результаты</p>
                </div>
                <div class="feature">
                    <h4>🔒 Защита данных</h4>
                    <p>Конфиденциальность</p>
                </div>
                <div class="feature">
                    <h4>📄 PDF отчет</h4>
                    <p>Персональные рекомендации</p>
                </div>
                <div class="feature">
                    <h4>💾 Сохранение прогресса</h4>
                    <p>Автоматически</p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{testLink}}" class="button">🚀 Начать тестирование</a>
            </div>
            
            <div class="info-box">
                <h3>💡 Важная информация</h3>
                <p>• Ваш прогресс автоматически сохраняется каждые 30 секунд</p>
                <p>• Вы можете прервать тест и продолжить позже по той же ссылке</p>
                <p>• После завершения вы получите детальный отчет на email</p>
                <p>• Все данные защищены и конфиденциальны</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Если у вас есть вопросы, обратитесь к вашему коучу: {{coachName}}</p>
            <p>📧 Поддержка: {{supportEmail}}</p>
            <p>© 2024 {{platformName}} | ditum.kz</p>
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
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #10b981;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #10b981;
            margin: 0;
        }
        .content {
            margin-bottom: 30px;
        }
        .info-box {
            background: #f0fdf4;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #10b981;
        }
        .button {
            display: inline-block;
            background: #1e40af;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
            font-weight: bold;
            text-align: center;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Тест завершен</h1>
            <p>Участник завершил тестирование</p>
        </div>
        
        <div class="content">
            <h2>Уведомление о завершении теста</h2>
            
            <p>Участник успешно завершил тестирование в рамках проекта <strong>{{projectName}}</strong>.</p>
            
            <div class="info-box">
                <h3>👤 Информация об участнике</h3>
                <p><strong>Имя:</strong> {{testeeName}}</p>
                <p><strong>Email:</strong> {{testeeEmail}}</p>
                <p><strong>Дата завершения:</strong> {{completedAt}}</p>
            </div>
            
            <div class="stats">
                <div class="stat">
                    <h4>📊 Отчет</h4>
                    <p>Готов к просмотру</p>
                </div>
                <div class="stat">
                    <h4>📧 Email</h4>
                    <p>Отправлен участнику</p>
                </div>
                <div class="stat">
                    <h4>🔄 Статус</h4>
                    <p>Завершен</p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{reportUrl}}" class="button">📋 Просмотреть отчет</a>
                <a href="{{dashboardUrl}}" class="button">🏠 Перейти в панель</a>
            </div>
            
            <h3>📈 Следующие шаги</h3>
            <ol>
                <li>Просмотрите детальный отчет участника</li>
                <li>Проанализируйте результаты и области развития</li>
                <li>Запланируйте сессию обратной связи</li>
                <li>Составьте план развития на основе результатов</li>
            </ol>
            
            <div class="info-box">
                <h3>💡 Рекомендации</h3>
                <p>Для максимальной эффективности рекомендуется обсудить результаты с участником в течение недели после прохождения теста, пока впечатления еще свежи.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Это автоматическое уведомление от {{platformName}}.</p>
            <p>📧 Поддержка: {{supportEmail}}</p>
            <p>© 2024 {{platformName}} | test.ditum.kz</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  async testConnection() {
    try {
      console.log('Testing email service connection...');
      await this.transporter.verify();
      console.log('✅ Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
      console.error('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER ? '***@domain.com' : 'not set'
      });
      return false;
    }
  }

  // Метод для отправки тестового письма
  async sendTestEmail(recipientEmail = 'test@example.com') {
    try {
      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Career Growth Insights',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER || 'test@ditum.kz'
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
}

module.exports = new EmailService();