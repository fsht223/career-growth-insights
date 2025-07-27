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
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      // Дополнительные настройки для совместимости
      tls: {
        rejectUnauthorized: false // Для самоподписанных сертификатов
      },
      debug: process.env.NODE_ENV === 'development', // Логи для отладки
      logger: process.env.NODE_ENV === 'development'
    };

    console.log(`Initializing email service with host: ${smtpConfig.host}:${smtpConfig.port}`);

    this.transporter = nodemailer.createTransporter(smtpConfig);
  }

  // Новый метод для отправки приглашения на тест
  async sendTestInvitation(testData) {
    try {
      const { userEmail, testLink, projectName, coachName } = testData;

      const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Приглашение на тестирование</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Приглашение на тестирование</h1>
              <p style="color: #e8f4f8; margin: 10px 0 0 0; font-size: 14px;">Career Growth Insights</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0;">Здравствуйте!</h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;">
                Вы приглашены пройти профессиональное тестирование в рамках проекта <strong>"${projectName}"</strong>.
              </p>
              
              <!-- Test Info Box -->
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📊 О тестировании:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
                  <li><strong>Время прохождения:</strong> 15-20 минут</li>
                  <li><strong>Количество вопросов:</strong> 40</li>
                  <li><strong>Результат:</strong> персональный PDF-отчет</li>
                  <li><strong>Язык:</strong> русский</li>
                </ul>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${testLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                  🚀 Пройти тестирование
                </a>
              </div>
              
              <!-- Link Fallback -->
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404;">
                  <strong>Если кнопка не работает,</strong> скопируйте и вставьте эту ссылку в браузер:
                </p>
                <p style="margin: 10px 0 0 0; word-break: break-all;">
                  <a href="${testLink}" style="color: #667eea; text-decoration: none;">${testLink}</a>
                </p>
              </div>
              
              <!-- Features -->
              <div style="margin: 30px 0;">
                <h3 style="color: #333; margin-bottom: 15px;">✨ Особенности тестирования:</h3>
                <div style="display: table; width: 100%;">
                  <div style="display: table-row;">
                    <div style="display: table-cell; padding: 10px; width: 50%;">
                      <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 5px;">💾</div>
                        <strong style="color: #333;">Автосохранение</strong>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Прогресс сохраняется автоматически</p>
                      </div>
                    </div>
                    <div style="display: table-cell; padding: 10px; width: 50%;">
                      <div style="background: #fff0e6; padding: 15px; border-radius: 8px; text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 5px;">📋</div>
                        <strong style="color: #333;">PDF отчет</strong>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">Детальные результаты</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Important Notice -->
              <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #0c5460;">
                  <strong>💡 Важно:</strong> Ваш прогресс автоматически сохраняется каждые 30 секунд. 
                  Если вы прервете тестирование, вы сможете продолжить позже, перейдя по той же ссылке.
                </p>
              </div>
              
              ${coachName ? `
              <p style="font-size: 14px; color: #777; margin-top: 30px;">
                Приглашение отправлено: <strong>${coachName}</strong>
              </p>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; color: #777; font-size: 12px;">© 2024 ${process.env.COMPANY_NAME || 'Ditum'}</p>
              <p style="margin: 5px 0 0 0; color: #777; font-size: 12px;">
                Поддержка: <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #667eea; text-decoration: none;">${process.env.SUPPORT_EMAIL}</a>
              </p>
              <p style="margin: 5px 0 0 0; color: #777; font-size: 12px;">
                Платформа: <a href="https://ditum.kz" style="color: #667eea; text-decoration: none;">ditum.kz</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Ditum Career Testing',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
        },
        to: userEmail,
        subject: `Приглашение на тестирование - ${projectName}`,
        html: emailTemplate
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test invitation sent successfully to:', userEmail, 'MessageId:', result.messageId);
      return result;

    } catch (error) {
      console.error('❌ Failed to send test invitation to:', testData.userEmail, error);
      throw error;
    }
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
        supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
        platformName: process.env.PLATFORM_NAME || 'Ditum Career Testing'
      });

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Ditum Career Testing',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
        },
        to: userInfo.email,
        subject: `Результаты тестирования - ${testInfo.projectName}`,
        html: htmlContent,
        attachments: pdfBuffer ? [{
          filename: `Отчет_${userInfo.firstName}_${userInfo.lastName}_${reportId}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }] : []
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Test report sent successfully:', result.messageId);
      return result;

    } catch (error) {
      console.error('❌ Failed to send test report:', error);
      throw error;
    }
  }

  // Метод для отправки уведомления коучу о завершении теста
  async sendCoachNotification(notificationData) {
    try {
      const { coachEmail, userName, projectName, reportUrl, dashboardUrl } = notificationData;

      const emailTemplate = this.getCoachNotificationTemplate();
      const compiledTemplate = handlebars.compile(emailTemplate);

      const htmlContent = compiledTemplate({
        userName,
        projectName,
        reportUrl,
        dashboardUrl,
        platformName: process.env.PLATFORM_NAME || 'Ditum Career Testing',
        supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER
      });

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Ditum Career Testing',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
        },
        to: coachEmail,
        subject: `Тест завершен - ${userName} (${projectName})`,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Coach notification sent successfully:', result.messageId);
      return result;

    } catch (error) {
      console.error('❌ Failed to send coach notification:', error);
      throw error;
    }
  }

  getCoachNotificationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Тест завершен</title>
    <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: white; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 5px; }
        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
        .stat { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; margin: 0 5px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #777; font-size: 12px; }
        .info-box { background: #d1ecf1; border-left: 4px solid #bee5eb; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Тест завершен!</h1>
            <p>Участник: {{userName}}</p>
        </div>
        
        <div class="content">
            <h2>🎉 Отличные новости!</h2>
            <p>Участник <strong>{{userName}}</strong> успешно завершил тестирование в рамках проекта "<strong>{{projectName}}</strong>".</p>
            
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
            <p>© 2024 {{platformName}} | ditum.kz</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  getReportEmailTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Результаты тестирования</title>
    <style>
        .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: white; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #777; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Результаты готовы!</h1>
            <p>{{userName}}</p>
        </div>
        
        <div class="content">
            <h2>Спасибо за прохождение тестирования!</h2>
            <p>Ваши результаты по проекту "<strong>{{projectName}}</strong>" готовы для просмотра.</p>
            
            <p><strong>Дата прохождения:</strong> {{testDate}}</p>
            <p><strong>ID отчета:</strong> {{reportId}}</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="#" class="button">📋 Просмотреть отчет</a>
            </div>
            
            <p>Ваш персональный отчет содержит детальный анализ компетенций и рекомендации по развитию.</p>
        </div>
        
        <div class="footer">
            <p>С уважением, команда {{platformName}}</p>
            <p>📧 Поддержка: {{supportEmail}}</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Метод для отправки тестового письма
  async sendTestEmail(recipientEmail = 'test@example.com') {
    try {
      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Ditum Career Testing',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
        },
        to: recipientEmail,
        subject: 'Тест отправки email - Ditum Career Testing',
        html: `
          <h1>✅ Email сервис работает!</h1>
          <p>Это тестовое письмо от платформы Ditum Career Testing.</p>
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
      await this.transporter.verify();
      console.log('✅ Email service connection verified successfully');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error.message);
      console.error('SMTP Config:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER ? process.env.SMTP_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'not set'
      });
      return false;
    }
  }
}

module.exports = new EmailService();