// services/emailService.js
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
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
        reportId
      });

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Платформа тестирования',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
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

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Report email sent successfully:', result.messageId);
      return result;

    } catch (error) {
      console.error('Failed to send report email:', error);
      throw new Error('Failed to send email with report');
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
        estimatedTime: '15-20 минут'
      });

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Платформа тестирования',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
        },
        to: recipientEmail,
        subject: `Приглашение на тестирование - ${testData.projectName}`,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Invitation email sent successfully:', result.messageId);
      return result;

    } catch (error) {
      console.error('Failed to send invitation email:', error);
      throw new Error('Failed to send invitation email');
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
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
      });

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'Платформа тестирования',
          address: process.env.FROM_EMAIL || process.env.SMTP_USER
        },
        to: testData.coachEmail,
        subject: `Тест завершен - ${testData.projectName}`,
        html: htmlContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Coach notification sent successfully:', result.messageId);
      return result;

    } catch (error) {
      console.error('Failed to send coach notification:', error);
      throw new Error('Failed to send coach notification');
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
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        .attachment-info {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #0ea5e9;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Результаты тестирования</h1>
            <p>Ваш персональный отчет готов</p>
        </div>
        
        <div class="content">
            <h2>Здравствуйте, {{userName}}!</h2>
            
            <p>Спасибо за участие в тестировании <strong>{{projectName}}</strong>. Ваш персональный отчет готов и содержит детальный анализ ваших профессиональных компетенций и мотивационных факторов.</p>
            
            <div class="info-box">
                <h3>📋 Информация о тестировании</h3>
                <p><strong>Проект:</strong> {{projectName}}</p>
                <p><strong>Дата прохождения:</strong> {{testDate}}</p>
                <p><strong>ID отчета:</strong> {{reportId}}</p>
            </div>
            
            <div class="attachment-info">
                <h3>📎 Вложение</h3>
                <p>К этому письму прикреплен PDF-файл с вашим персональным отчетом. Отчет содержит:</p>
                <ul>
                    <li>Профиль мотивационных факторов</li>
                    <li>Анализ сильных сторон</li>
                    <li>Рекомендации по развитию</li>
                    <li>Детальную визуализацию результатов</li>
                    <li>Персональные выводы и заключение</li>
                </ul>
            </div>
            
            <h3>🎯 Что дальше?</h3>
            <p>Рекомендуем:</p>
            <ol>
                <li>Внимательно изучить отчет</li>
                <li>Обратить особое внимание на области развития</li>
                <li>Обсудить результаты с вашим коучем или руководителем</li>
                <li>Составить план личного развития на основе рекомендаций</li>
            </ol>
            
            <div class="info-box">
                <h3>🔒 Конфиденциальность</h3>
                <p>Ваши результаты строго конфиденциальны. Отчет предназначен исключительно для вашего личного использования и профессионального развития.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Если у вас есть вопросы по результатам тестирования, обратитесь к коучу, который предоставил вам доступ к тесту.</p>
            <p>© 2024 Платформа тестирования профессиональных компетенций</p>
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
            <p>Оценка профессиональных компетенций</p>
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
                <p><strong>Организатор:</strong> {{coachName}}</p>
            </div>
            
            <div class="features">
                <div class="feature">
                    <h4>⏱️ Быстро</h4>
                    <p>15-20 минут</p>
                </div>
                <div class="feature">
                    <h4>🔒 Безопасно</h4>
                    <p>GDPR соответствие</p>
                </div>
                <div class="feature">
                    <h4>💾 Автосохранение</h4>
                    <p>Прогресс сохраняется</p>
                </div>
                <div class="feature">
                    <h4>📊 Детальный отчет</h4>
                    <p>PDF с результатами</p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="{{testLink}}" class="button">🚀 Начать тестирование</a>
            </div>
            
            <div class="info-box">
                <h3>ℹ️ Важная информация</h3>
                <ul>
                    <li>Тест можно проходить только один раз</li>
                    <li>Прогресс автоматически сохраняется</li>
                    <li>После завершения вы получите персональный отчет</li>
                    <li>Результаты строго конфиденциальны</li>
                </ul>
            </div>
            
            <h3>❓ Есть вопросы?</h3>
            <p>Если у вас возникли вопросы о тестировании, обратитесь к {{coachName}}, который организовал это тестирование.</p>
        </div>
        
        <div class="footer">
            <p>Это письмо отправлено автоматически. Пожалуйста, не отвечайте на него.</p>
            <p>© 2024 Платформа тестирования профессиональных компетенций</p>
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
            border-bottom: 3px solid #059669;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #059669;
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
            border-left: 4px solid #059669;
        }
        .button {
            display: inline-block;
            background: #1e40af;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 5px;
            font-weight: bold;
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
            <p>Это автоматическое уведомление от платформы тестирования.</p>
            <p>© 2024 Платформа тестирования профессиональных компетенций</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();