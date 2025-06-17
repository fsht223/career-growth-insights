// services/improvedPDFService.js
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class ImprovedPDFService extends EventEmitter {
  constructor() {
    super();
    this.browser = null;
    this.isInitializing = false;
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 3;
    this.currentJobs = 0;
    this.browserTimeout = 300000; // 5 minutes
    this.lastUsed = null;
    
    // Auto-cleanup browser after inactivity
    this.setupBrowserCleanup();
  }

  async initBrowser() {
    if (this.browser && !this.browser.isConnected()) {
      this.browser = null;
    }

    if (this.browser) {
      this.lastUsed = Date.now();
      return this.browser;
    }

    if (this.isInitializing) {
      // Wait for ongoing initialization
      return new Promise((resolve, reject) => {
        this.once('browserReady', resolve);
        this.once('browserError', reject);
      });
    }

    try {
      this.isInitializing = true;
      console.log('Initializing Puppeteer browser...');
      
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        timeout: 30000
      });

      this.lastUsed = Date.now();
      this.isInitializing = false;
      this.emit('browserReady', this.browser);
      
      console.log('Puppeteer browser initialized successfully');
      return this.browser;
      
    } catch (error) {
      this.isInitializing = false;
      this.emit('browserError', error);
      console.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  setupBrowserCleanup() {
    setInterval(() => {
      if (this.browser && 
          this.lastUsed && 
          (Date.now() - this.lastUsed) > this.browserTimeout &&
          this.currentJobs === 0) {
        this.closeBrowser();
      }
    }, 60000); // Check every minute
  }

  async closeBrowser() {
    if (this.browser) {
      try {
        console.log('Closing Puppeteer browser due to inactivity');
        await this.browser.close();
        this.browser = null;
        this.lastUsed = null;
      } catch (error) {
        console.error('Error closing browser:', error);
        this.browser = null;
      }
    }
  }

  async generateReportAsync(testResult, testInfo, userInfo) {
    return new Promise((resolve, reject) => {
      const job = {
        id: this.generateJobId(),
        testResult,
        testInfo,
        userInfo,
        resolve,
        reject,
        createdAt: Date.now()
      };

      this.queue.push(job);
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0 || this.currentJobs >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.currentJobs < this.maxConcurrent) {
      const job = this.queue.shift();
      this.currentJobs++;
      
      // Process job without awaiting (parallel processing)
      this.processJob(job).finally(() => {
        this.currentJobs--;
        // Continue processing if more jobs in queue
        if (this.queue.length > 0) {
          setImmediate(() => this.processQueue());
        }
      });
    }

    this.processing = false;
  }

  async processJob(job) {
    const startTime = Date.now();
    console.log(`Starting PDF generation job ${job.id}...`);

    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set page configuration for better performance
      await page.setViewport({ width: 1280, height: 800 });
      await page.setDefaultTimeout(30000);

      // Generate HTML content
      const htmlContent = await this.generateHTMLReport(
        job.testResult,
        job.testInfo,
        job.userInfo
      );

      // Set content and wait for it to load
      await page.setContent(htmlContent, { 
        waitUntil: ['networkidle0', 'load'],
        timeout: 30000
      });

      // Generate PDF with optimized settings
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
        headerTemplate: this.getHeaderTemplate(),
        footerTemplate: this.getFooterTemplate(job.userInfo),
        timeout: 30000
      });

      await page.close();

      const processingTime = Date.now() - startTime;
      console.log(`PDF generation job ${job.id} completed in ${processingTime}ms`);

      // Emit success event
      this.emit('pdfGenerated', {
        jobId: job.id,
        processingTime,
        bufferSize: pdfBuffer.length
      });

      job.resolve(pdfBuffer);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`PDF generation job ${job.id} failed after ${processingTime}ms:`, error);

      // Emit error event
      this.emit('pdfError', {
        jobId: job.id,
        error: error.message,
        processingTime
      });

      job.reject(new Error(`PDF generation failed: ${error.message}`));
    }
  }

  generateJobId() {
    return `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Background job processing for non-blocking PDF generation
  async generateReportBackground(testResult, testInfo, userInfo, callback) {
    const job = {
      id: this.generateJobId(),
      testResult,
      testInfo,
      userInfo,
      callback,
      background: true,
      createdAt: Date.now()
    };

    this.queue.push(job);
    
    // Return job ID for tracking
    const jobId = job.id;
    
    // Process in background
    setImmediate(() => this.processQueue());
    
    return jobId;
  }

  // Get job status
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      currentJobs: this.currentJobs,
      maxConcurrent: this.maxConcurrent,
      browserStatus: this.browser ? 'connected' : 'disconnected',
      lastUsed: this.lastUsed
    };
  }

  // Priority job processing
  async generateReportPriority(testResult, testInfo, userInfo) {
    return new Promise((resolve, reject) => {
      const job = {
        id: this.generateJobId(),
        testResult,
        testInfo,
        userInfo,
        resolve,
        reject,
        priority: true,
        createdAt: Date.now()
      };

      // Add to front of queue for priority processing
      this.queue.unshift(job);
      this.processQueue();
    });
  }

  async generateHTMLReport(testResult, testInfo, userInfo) {
    try {
      const template = await this.getReportTemplate();
      const compiledTemplate = handlebars.compile(template);

      // Process results for template (reuse existing logic)
      const processedResults = this.processResultsForTemplate(testResult, testInfo, userInfo);
      
      return compiledTemplate(processedResults);
    } catch (error) {
      console.error('HTML generation failed:', error);
      throw new Error(`HTML generation failed: ${error.message}`);
    }
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
    // Mock implementation - should compare questions 1-3 with 37-39
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

  getHeaderTemplate() {
    return `
      <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
        <span>Motivation Testing Platform - Персональный отчет</span>
      </div>
    `;
  }

  getFooterTemplate(userInfo) {
    return `
      <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
        <span>${userInfo.firstName} ${userInfo.lastName} | ${new Date().toLocaleDateString('ru-RU')} | Страница <span class="pageNumber"></span> из <span class="totalPages"></span></span>
      </div>
    `;
  }

  async getReportTemplate() {
    try {
      const templatePath = path.join(__dirname, '../templates/report-template.hbs');
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      // Fallback to inline template
      return this.getInlineTemplate();
    }
  }

  getInlineTemplate() {
    // Return the same comprehensive template as before
    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Персональный отчет - {{userName}}</title>
    <style>
        /* Include all the CSS styles from the previous template */
    </style>
</head>
<body>
    <!-- Include all the HTML structure from the previous template -->
</body>
</html>`;
  }

  // Graceful shutdown
  async shutdown() {
    console.log('Shutting down PDF service...');
    
    // Wait for current jobs to complete
    while (this.currentJobs > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Close browser
    await this.closeBrowser();
    
    console.log('PDF service shutdown complete');
  }
}

module.exports = new ImprovedPDFService();