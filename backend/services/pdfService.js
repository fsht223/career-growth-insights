// services/pdfService.js
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

class PDFService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async generateReport(testResult, testInfo, userInfo) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Generate HTML content
      const htmlContent = await this.generateHTMLReport(testResult, testInfo, userInfo);
      
      // Set content and generate PDF
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            <span>Motivation Testing Platform - Персональный отчет</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
            <span>${userInfo.firstName} ${userInfo.lastName} | ${new Date().toLocaleDateString('ru-RU')} | Страница <span class="pageNumber"></span> из <span class="totalPages"></span></span>
          </div>
        `
      });

      await page.close();
      return pdfBuffer;

    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF report');
    }
  }

  async generateHTMLReport(testResult, testInfo, userInfo) {
    const template = await this.getReportTemplate();
    const compiledTemplate = handlebars.compile(template);

    // Process results for template
    const processedResults = this.processResultsForTemplate(testResult, testInfo, userInfo);
    
    return compiledTemplate(processedResults);
  }

  processResultsForTemplate(testResult, testInfo, userInfo) {
    const { percentages, starredItems, goldenLine } = testResult.results;

    // Calculate profile scores (Power, Affiliation, Achievement)
    const profileScores = this.calculateProfileScores(percentages);
    
    // Get top motivators and development areas
    const topMotivators = this.getTopMotivators(percentages, 3);
    const developmentAreas = this.getDevelopmentAreas(percentages, 5);
    
    // Prepare progress bar data
    const progressBars = Object.entries(percentages)
      .filter(([key]) => key !== 'Professional Pleasure' && key !== 'Being Logical')
      .map(([key, percentage]) => ({
        name: key,
        percentage: Math.round(percentage),
        isStarred: starredItems.includes(key),
        status: this.getStatus(percentage),
        color: this.getBarColor(percentage)
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Calculate Inner/Outer motivation
    const motivationSplit = this.calculateInnerOuterMotivation(testResult);
    
    // Calculate consistency and awareness
    const consistency = this.calculateConsistency(testResult);
    const awareness = this.calculateAwareness(starredItems, percentages);
    
    // Calculate reasoning (Intuition vs Being Logical)
    const reasoning = this.calculateReasoning(testResult);

    return {
      // User information
      userName: `${userInfo.firstName} ${userInfo.lastName}`,
      userEmail: userInfo.email,
      profession: userInfo.profession,
      testDate: new Date().toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      projectName: testInfo.projectName,

      // Profile scores
      profileScores,
      
      // Main results
      progressBars,
      topMotivators,
      developmentAreas,
      
      // Summary metrics
      motivationSplit,
      consistency,
      awareness,
      reasoning,
      
      // Starred items
      starredItems,
      
      // Additional data
      goldenLine: testInfo.goldenLine,
      language: testInfo.language
    };
  }

  calculateProfileScores(percentages) {
    const powerButtons = ['Intuition', 'Success', 'Resilience', 'Respect', 'Influence'];
    const affiliationButtons = ['Bringing Happiness', 'Social Contact', 'Empathy', 'Recognition', 'Team Spirit', 'Social Approval'];
    const achievementButtons = ['Perfectionism', 'Efficiency', 'Intellectual Discovery', 'Responsibility', 'Reaching Goals'];

    const calculateAverage = (buttons) => {
      const validPercentages = buttons
        .map(button => percentages[button])
        .filter(p => p !== undefined);
      return validPercentages.length > 0 
        ? Math.round(validPercentages.reduce((sum, p) => sum + p, 0) / validPercentages.length)
        : 0;
    };

    return {
      power: calculateAverage(powerButtons),
      affiliation: calculateAverage(affiliationButtons),
      achievement: calculateAverage(achievementButtons)
    };
  }

  getTopMotivators(percentages, count) {
    return Object.entries(percentages)
      .filter(([key]) => key !== 'Professional Pleasure' && key !== 'Being Logical')
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([name, percentage]) => ({
        name,
        percentage: Math.round(percentage),
        description: this.getMotivatorDescription(name)
      }));
  }

  getDevelopmentAreas(percentages, count) {
    return Object.entries(percentages)
      .filter(([key]) => key !== 'Professional Pleasure' && key !== 'Being Logical')
      .map(([name, percentage]) => ({
        name,
        percentage: Math.round(percentage),
        deviation: Math.abs(percentage - 100)
      }))
      .filter(item => item.percentage < 90 || item.percentage > 110)
      .sort((a, b) => b.deviation - a.deviation)
      .slice(0, count)
      .map(item => ({
        name: item.name,
        percentage: item.percentage,
        type: item.percentage < 90 ? 'low' : 'high',
        description: this.getDevelopmentDescription(item.name, item.percentage < 90 ? 'low' : 'high')
      }));
  }

  calculateInnerOuterMotivation(testResult) {
    const innerButtons = ['Intuition', 'Success', 'Perfectionism', 'Resilience', 'Efficiency', 'Intellectual Discovery', 'Influence', 'Responsibility', 'Reaching Goals', 'Being Logical'];
    const outerButtons = ['Bringing Happiness', 'Social Contact', 'Empathy', 'Recognition', 'Respect', 'Team Spirit', 'Social Approval'];

    const { groupScores } = testResult.results;
    
    let innerTotal = 0;
    let outerTotal = 0;

    innerButtons.forEach(button => {
      if (groupScores[button]) innerTotal += groupScores[button];
    });

    outerButtons.forEach(button => {
      if (groupScores[button]) outerTotal += groupScores[button];
    });

    const total = innerTotal + outerTotal;
    
    return {
      inner: total > 0 ? Math.round((innerTotal / total) * 100) : 0,
      outer: total > 0 ? Math.round((outerTotal / total) * 100) : 0
    };
  }

  calculateConsistency(testResult) {
    // This would compare answers from questions 1-3 with 37-39
    // For now, return a mock value
    return Math.floor(Math.random() * 20) + 80; // 80-100%
  }

  calculateAwareness(starredItems, percentages) {
    if (starredItems.length === 0) return 0;
    
    const strongItems = starredItems.filter(item => 
      percentages[item] && percentages[item] >= 96
    ).length;
    
    return Math.round((strongItems / starredItems.length) * 100);
  }

  calculateReasoning(testResult) {
    const { groupScores } = testResult.results;
    const intuitionScore = groupScores['Intuition'] || 0;
    const logicalScore = groupScores['Being Logical'] || 0;
    const total = intuitionScore + logicalScore;

    if (total === 0) {
      return { intuition: 50, logical: 50 };
    }

    return {
      intuition: Math.round((intuitionScore / total) * 100),
      logical: Math.round((logicalScore / total) * 100)
    };
  }

  getStatus(percentage) {
    if (percentage < 90) return 'low';
    if (percentage > 110) return 'high';
    return 'normal';
  }

  getBarColor(percentage) {
    if (percentage < 90 || percentage > 110) return '#ef4444'; // red
    return '#22c55e'; // green
  }

  getMotivatorDescription(name) {
    const descriptions = {
      'Intuition': 'Вы можете принимать решения на основе интуиции и видеть общую картину',
      'Success': 'Вы готовы делать все необходимое для достижения успеха',
      'Perfectionism': 'Вы стремитесь к высоким стандартам качества в работе',
      'Bringing Happiness': 'Вы получаете удовольствие от помощи другим людям',
      'Social Contact': 'Вы цените социальное взаимодействие с коллегами',
      // Add more descriptions...
    };
    return descriptions[name] || 'Описание не доступно';
  }

  getDevelopmentDescription(name, type) {
    const descriptions = {
      'Intuition': {
        'low': 'Развитие интуитивного мышления и доверия к внутренним ощущениям',
        'high': 'Сбалансирование интуиции с аналитическим подходом'
      },
      // Add more descriptions...
    };
    return descriptions[name]?.[type] || 'Рекомендации не доступны';
  }

  async getReportTemplate() {
    try {
      const templatePath = path.join(__dirname, '../templates/report-template.hbs');
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      // Fallback to inline template if file not found
      return this.getInlineTemplate();
    }
  }

  getInlineTemplate() {
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Персональный отчет - {{userName}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px 0;
            border-bottom: 3px solid #1e40af;
        }
        
        .header h1 {
            color: #1e40af;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header .subtitle {
            color: #64748b;
            font-size: 16px;
        }
        
        .user-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        
        .section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #1e40af;
            font-size: 22px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        
        .profile-scores {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .profile-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #e2e8f0;
        }
        
        .profile-card h3 {
            color: #1e40af;
            margin-bottom: 10px;
        }
        
        .profile-score {
            font-size: 36px;
            font-weight: bold;
            color: #059669;
        }
        
        .progress-bar {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
        }
        
        .progress-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .progress-name {
            font-weight: 600;
            color: #374151;
        }
        
        .progress-percentage {
            font-weight: bold;
            font-size: 16px;
        }
        
        .progress-track {
            height: 20px;
            background: #e5e7eb;
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            border-radius: 10px;
            position: relative;
        }
        
        .progress-fill.normal {
            background: #059669;
        }
        
        .progress-fill.low, .progress-fill.high {
            background: #dc2626;
        }
        
        .benchmark-line {
            position: absolute;
            top: 0;
            left: 100%;
            width: 2px;
            height: 100%;
            background: #374151;
        }
        
        .star-icon {
            color: #fbbf24;
            margin-left: 5px;
        }
        
        .motivators-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
        }
        
        .motivator-card {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #0ea5e9;
        }
        
        .development-areas {
            background: #fef2f2;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #ef4444;
        }
        
        .summary-metrics {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                font-size: 12px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .section h2 {
                font-size: 18px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Персональный отчет по мотивационному профилю</h1>
        <div class="subtitle">{{projectName}}</div>
    </div>

    <div class="user-info">
        <h3>Информация об участнике</h3>
        <p><strong>Имя:</strong> {{userName}}</p>
        <p><strong>Email:</strong> {{userEmail}}</p>
        <p><strong>Профессия:</strong> {{profession}}</p>
        <p><strong>Дата прохождения:</strong> {{testDate}}</p>
    </div>

    <div class="section">
        <h2>What Drives You? - Профили мотивации</h2>
        <div class="profile-scores">
            <div class="profile-card">
                <h3>Power</h3>
                <div class="profile-score">{{profileScores.power}}%</div>
            </div>
            <div class="profile-card">
                <h3>Affiliation</h3>
                <div class="profile-score">{{profileScores.affiliation}}%</div>
            </div>
            <div class="profile-card">
                <h3>Achievement</h3>
                <div class="profile-score">{{profileScores.achievement}}%</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Ваши сильные мотиваторы</h2>
        <div class="motivators-grid">
            {{#each topMotivators}}
            <div class="motivator-card">
                <h4>{{name}} ({{percentage}}%)</h4>
                <p>{{description}}</p>
            </div>
            {{/each}}
        </div>
    </div>

    <div class="section page-break">
        <h2>Профиль мотивационных кнопок</h2>
        {{#each progressBars}}
        <div class="progress-bar">
            <div class="progress-header">
                <span class="progress-name">
                    {{name}}
                    {{#if isStarred}}<span class="star-icon">★</span>{{/if}}
                </span>
                <span class="progress-percentage" style="color: {{color}}">{{percentage}}%</span>
            </div>
            <div class="progress-track">
                <div class="progress-fill {{status}}" style="width: {{percentage}}%; background: {{color}}"></div>
                <div class="benchmark-line"></div>
            </div>
        </div>
        {{/each}}
    </div>

    <div class="section">
        <h2>Области для развития</h2>
        <div class="development-areas">
            {{#each developmentAreas}}
            <div style="margin-bottom: 15px;">
                <h4>{{name}} ({{percentage}}%)</h4>
                <p>{{description}}</p>
            </div>
            {{/each}}
        </div>
    </div>

    <div class="section page-break">
        <h2>Краткая сводка</h2>
        <div class="summary-metrics">
            <div class="metric-card">
                <h4>Inner/Outer Motivation</h4>
                <div class="metric-value">{{motivationSplit.inner}}% / {{motivationSplit.outer}}%</div>
                <p>Внутренняя / Внешняя мотивация</p>
            </div>
            <div class="metric-card">
                <h4>Awareness Level</h4>
                <div class="metric-value">{{awareness}}%</div>
                <p>Уровень осознанности</p>
            </div>
            <div class="metric-card">
                <h4>Consistency</h4>
                <div class="metric-value">{{consistency}}%</div>
                <p>Согласованность ответов</p>
            </div>
            <div class="metric-card">
                <h4>Reasoning</h4>
                <div class="metric-value">{{reasoning.intuition}}% / {{reasoning.logical}}%</div>
                <p>Интуиция / Логика</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Заключение</h2>
        <p>{{userName}}, ваша мотивация к достижениям, принадлежности и власти составляет {{profileScores.achievement}}%, {{profileScores.affiliation}}% и {{profileScores.power}}% соответственно.</p>
        
        <p style="margin-top: 15px;">Рекомендуется определить одну или две области развития, которые окажут наибольшее влияние на ваше лидерское развитие. У вас должен быть конкретный результат. Вы можете попросить коуча/наставника из вашей компании, например вашего руководителя, помочь вам.</p>
        
        <p style="margin-top: 15px;">Помните, наши лидерские навыки обусловлены мотивацией, и вы можете влиять на уровень своей мотивации, пробуя новые перспективы.</p>
    </div>
</body>
</html>
    `;
  }
}

module.exports = new PDFService();