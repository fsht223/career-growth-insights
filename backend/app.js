const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const PDFService = require('./services/improvedPDFService');
const EmailService = require('./services/emailService');


// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  skipSuccessfulRequests: true
});

// In-memory storage (replace with database in production)
let users = [
  {
    id: 1,
    email: 'coach@example.com',
    password: '$2b$10$hash', // bcrypt hash for 'password123'
    firstName: 'Test',
    lastName: 'Coach',
    role: 'coach'
  }
];

let tests = [];
let testSessions = new Map(); // For tracking user progress
let testResults = [];
let questions = [];
let goldenLines = [];
let motivationalButtons = [];

// Initialize default data
const initializeData = async () => {
  // Hash default password
  const hashedPassword = await bcrypt.hash('password123', 10);
  users[0].password = hashedPassword;

  // Initialize questions from Excel data
  questions = [
    {
      id: 1,
      text: "Какое из следующих утверждений лучше описывает вас?",
      options: [
        { id: "1a", text: "Я обеспечиваю соответствие моей работы высшим стандартам", group: "Perfectionism", points: 3 },
        { id: "1b", text: "Я делаю все необходимое для достижения моих целей", group: "Reaching Goals", points: 3 },
        { id: "1c", text: "Я придаю значение социальному взаимодействию с коллегами", group: "Social Contact", points: 3 }
      ]
    },
    {
      id: 2,
      text: "Какое из следующих утверждений лучше описывает вас?",
      options: [
        { id: "2a", text: "Я основываю свои решения на осязаемых данных", group: "Being Logical", points: 3 },
        { id: "2b", text: "Мне нравится помогать тем, кто обращается ко мне с проблемами", group: "Bringing Happiness", points: 3 },
        { id: "2c", text: "Я полагаюсь на интуицию при принятии решений", group: "Intuition", points: 3 }
      ]
    },
    {
      id: 3,
      text: "Какое из следующих утверждений лучше описывает вас?",
      options: [
        { id: "3a", text: "Конкурентная среда мотивирует меня к совершенству", group: "Success", points: 3 },
        { id: "3b", text: "Мне нравится работать с целями", group: "Reaching Goals", points: 3 },
        { id: "3c", text: "Я хотел бы, чтобы мои усилия были признаны", group: "Recognition", points: 3 }
      ]
    }
    // Add more questions up to 36, then repeat first 3 as 37-39
  ];

  // Initialize Golden Lines for different professions
  goldenLines = [
    {
      profession: "C Level",
      values: {
        "Intuition": 10.8,
        "Success": 10.0,
        "Professional Pleasure": 11.0,
        "Bringing Happiness": 11.2,
        "Perfectionism": 10.4,
        "Social Contact": 11.3,
        "Empathy": 10.7,
        "Recognition": 11.7,
        "Resilience": 11.6,
        "Respect": 12.7,
        "Efficiency": 11.5,
        "Intellectual Discovery": 13.0,
        "Team Spirit": 13.0,
        "Influence": 14.8,
        "Responsibility": 13.0,
        "Reaching Goals": 13.5,
        "Being Logical": 15.3,
        "Social Approval": 10.4
      }
    }
  ];

  // Initialize motivational buttons for question 40
  motivationalButtons = [
    "Intuition", "Success", "Professional Pleasure", "Bringing Happiness",
    "Perfectionism", "Social Contact", "Empathy", "Recognition",
    "Resilience", "Respect", "Efficiency", "Intellectual Discovery",
    "Team Spirit", "Influence", "Responsibility", "Reaching Goals"
  ];
};

// Middleware for auth
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token.' });
  }
};

// Routes

// Auth Routes
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Test Management Routes
app.post('/api/tests', authenticateToken, (req, res) => {
  try {
    const {
      projectName,
      goldenLine,
      language,
      reseller,
      coachEmail,
      testeeEmail,
      testCount,
      reportRecipient
    } = req.body;

    const testId = uuidv4();
    const test = {
      id: testId,
      projectName,
      goldenLine,
      language: language || 'ru',
      reseller,
      coachEmail,
      testeeEmail,
      testCount: testCount || 1,
      reportRecipient,
      coachId: req.user.id,
      status: 'created',
      link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/test/${testId}`,
      createdAt: new Date().toISOString(),
      registeredEmails: []
    };

    tests.push(test);
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create test' });
  }
});

app.get('/api/tests', authenticateToken, (req, res) => {
  try {
    const userTests = tests.filter(test => test.coachId === req.user.id);
    res.json(userTests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

app.delete('/api/tests/:id', authenticateToken, (req, res) => {
  try {
    const testIndex = tests.findIndex(test => 
      test.id === req.params.id && test.coachId === req.user.id
    );
    
    if (testIndex === -1) {
      return res.status(404).json({ error: 'Test not found' });
    }

    tests.splice(testIndex, 1);
    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

// Test Session Routes (for customers)
app.get('/api/test/:id', (req, res) => {
  try {
    const test = tests.find(t => t.id === req.params.id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({
      id: test.id,
      projectName: test.projectName,
      language: test.language,
      profession: test.goldenLine
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test' });
  }
});

app.post('/api/test/:id/register', async (req, res) => {
  try {
    const { firstName, lastName, email, profession } = req.body;
    const testId = req.params.id;

    const test = tests.find(t => t.id === testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check if email was already used for this test
    const existingSession = testSessions.get(`${testId}_${email}`);
    if (existingSession) {
      if (existingSession.completed) {
        return res.status(400).json({ 
          error: 'Test already completed',
          completed: true 
        });
      } else {
        return res.json({
          sessionId: existingSession.sessionId,
          continueFrom: existingSession.currentQuestion || 0,
          message: 'Continuing from previous session'
        });
      }
    }

    const sessionId = uuidv4();
    const session = {
      sessionId,
      testId,
      firstName,
      lastName,
      email,
      profession,
      currentQuestion: 0,
      answers: {},
      motivationalSelection: [],
      startedAt: new Date().toISOString(),
      completed: false
    };

    testSessions.set(`${testId}_${email}`, session);
    
    // Update test registration count
    const testIndex = tests.findIndex(t => t.id === testId);
    if (testIndex !== -1) {
      tests[testIndex].registeredEmails.push(email);
    }

    res.json({ sessionId, continueFrom: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register for test' });
  }
});

app.get('/api/test/:id/questions', (req, res) => {
  try {
    const testId = req.params.id;
    const test = tests.find(t => t.id === testId);
    
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Return questions 1-36 in random order, then 37-39 (repeat of 1-3), then question 40
    let testQuestions = [...questions.slice(0, 36)];
    
    // Shuffle questions 1-36
    for (let i = testQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [testQuestions[i], testQuestions[j]] = [testQuestions[j], testQuestions[i]];
    }

    // Add repeat questions 37-39
    testQuestions.push(...questions.slice(0, 3).map((q, index) => ({
      ...q,
      id: 37 + index,
      isRepeat: true
    })));

    // Add final motivational selection question
    testQuestions.push({
      id: 40,
      text: "Выберите 5 наиболее важных для вас мотивационных факторов",
      type: "motivational_selection",
      options: motivationalButtons.map(button => ({ id: button, text: button }))
    });

    res.json(testQuestions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

app.post('/api/test/:id/answer', (req, res) => {
  try {
    const { sessionId, questionId, answer, motivationalSelection } = req.body;
    const testId = req.params.id;

    // Find session
    const sessionKey = Array.from(testSessions.keys()).find(key => 
      testSessions.get(key).sessionId === sessionId
    );

    if (!sessionKey) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = testSessions.get(sessionKey);

    if (questionId === 40) {
      // Handle motivational selection
      session.motivationalSelection = motivationalSelection;
    } else {
      // Handle regular question
      session.answers[questionId] = answer;
    }

    session.currentQuestion = questionId;
    session.lastUpdated = new Date().toISOString();

    testSessions.set(sessionKey, session);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

app.post('/api/test/:id/complete', (req, res) => {
  try {
    const { sessionId } = req.body;
    const testId = req.params.id;

    const sessionKey = Array.from(testSessions.keys()).find(key => 
      testSessions.get(key).sessionId === sessionId
    );

    if (!sessionKey) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = testSessions.get(sessionKey);
    const test = tests.find(t => t.id === testId);

    // Calculate results
    const results = calculateTestResults(session, test);

    // Mark session as completed
    session.completed = true;
    session.completedAt = new Date().toISOString();
    testSessions.set(sessionKey, session);

    // Save results
    const resultId = uuidv4();
    const testResult = {
      id: resultId,
      testId,
      sessionId,
      testeeEmail: session.email,
      testeeName: `${session.firstName} ${session.lastName}`,
      profession: session.profession,
      results,
      completedAt: session.completedAt,
      reportUrl: `/api/reports/${resultId}`
    };

    testResults.push(testResult);

    res.json({ 
      resultId,
      results,
      reportUrl: testResult.reportUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete test' });
  }
});

// Results calculation function
function calculateTestResults(session, test) {
  const goldenLine = goldenLines.find(gl => gl.profession === test.goldenLine);
  if (!goldenLine) {
    throw new Error('Golden line not found for profession');
  }

  const groupScores = {};
  
  // Initialize group scores
  Object.keys(goldenLine.values).forEach(group => {
    groupScores[group] = 0;
  });

  // Calculate scores from answers
  Object.entries(session.answers).forEach(([questionId, answer]) => {
    const question = questions.find(q => q.id === parseInt(questionId));
    if (question) {
      const firstChoice = question.options.find(opt => opt.id === answer.first);
      const secondChoice = question.options.find(opt => opt.id === answer.second);
      const thirdChoice = question.options.find(opt => 
        opt.id !== answer.first && opt.id !== answer.second
      );

      if (firstChoice) groupScores[firstChoice.group] += 3;
      if (secondChoice) groupScores[secondChoice.group] += 2;
      if (thirdChoice) groupScores[thirdChoice.group] += 1;
    }
  });

  // Calculate percentages
  const percentages = {};
  Object.entries(groupScores).forEach(([group, score]) => {
    const goldenValue = goldenLine.values[group];
    percentages[group] = goldenValue ? (score / goldenValue) * 100 : 0;
  });

  // Identify starred items (from motivational selection)
  const starredItems = session.motivationalSelection || [];

  return {
    groupScores,
    percentages,
    starredItems,
    goldenLine: goldenLine.values
  };
}

// Reports Routes
app.get('/api/reports', authenticateToken, (req, res) => {
  try {
    const coachTests = tests.filter(test => test.coachId === req.user.id);
    const coachTestIds = coachTests.map(test => test.id);
    const coachResults = testResults.filter(result => 
      coachTestIds.includes(result.testId)
    );

    res.json(coachResults);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.get('/api/reports/:id', (req, res) => {
  try {
    const result = testResults.find(r => r.id === req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


// Test completion route with async PDF generation
app.post('/api/test/:id/complete', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const testId = req.params.id;

    const sessionKey = Array.from(testSessions.keys()).find(key => 
      testSessions.get(key).sessionId === sessionId
    );

    if (!sessionKey) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = testSessions.get(sessionKey);
    const test = tests.find(t => t.id === testId);

    // Calculate results
    const results = calculateTestResults(session, test);

    // Mark session as completed
    session.completed = true;
    session.completedAt = new Date().toISOString();
    testSessions.set(sessionKey, session);

    // Save results
    const resultId = uuidv4();
    const testResult = {
      id: resultId,
      testId,
      sessionId,
      testeeEmail: session.email,
      testeeName: `${session.firstName} ${session.lastName}`,
      profession: session.profession,
      results,
      completedAt: session.completedAt,
      reportUrl: `/api/reports/${resultId}`,
      pdfStatus: 'generating' // Track PDF generation status
    };

    testResults.push(testResult);

    // Return immediate response
    res.json({ 
      resultId,
      results,
      reportUrl: testResult.reportUrl,
      pdfStatus: 'generating'
    });

    // Generate PDF asynchronously in background
    const userInfo = {
      firstName: session.firstName,
      lastName: session.lastName,
      email: session.email,
      profession: session.profession
    };

    const testInfo = {
      projectName: test.projectName,
      goldenLine: test.goldenLine,
      language: test.language
    };

    // Background PDF generation with callback
    const jobId = await PDFService.generateReportBackground(
      { results },
      testInfo,
      userInfo,
      async (error, pdfBuffer) => {
        if (error) {
          console.error('PDF generation failed:', error);
          // Update status
          const resultIndex = testResults.findIndex(r => r.id === resultId);
          if (resultIndex !== -1) {
            testResults[resultIndex].pdfStatus = 'failed';
            testResults[resultIndex].pdfError = error.message;
          }
          return;
        }

        try {
          // Save PDF to file system or cloud storage
          const pdfFilename = `report_${resultId}.pdf`;
          const pdfPath = path.join(__dirname, 'uploads', pdfFilename);
          await fs.writeFile(pdfPath, pdfBuffer);

          // Update result with PDF info
          const resultIndex = testResults.findIndex(r => r.id === resultId);
          if (resultIndex !== -1) {
            testResults[resultIndex].pdfStatus = 'ready';
            testResults[resultIndex].pdfPath = pdfPath;
            testResults[resultIndex].pdfUrl = `/api/reports/${resultId}/pdf`;
          }

          // Send email if required
          if (test.reportRecipient === 'testee' || test.reportRecipient === 'both') {
            await EmailService.sendTestReport({
              userInfo,
              testInfo,
              reportId: resultId
            }, pdfBuffer);
          }

          // Notify coach if required
          if (test.reportRecipient === 'coach' || test.reportRecipient === 'both') {
            await EmailService.sendCoachNotification(test, {
              userInfo,
              reportUrl: `${process.env.FRONTEND_URL}/dashboard`
            });
          }

          console.log(`PDF generated and processed for result ${resultId}`);
        } catch (processingError) {
          console.error('PDF processing failed:', processingError);
          const resultIndex = testResults.findIndex(r => r.id === resultId);
          if (resultIndex !== -1) {
            testResults[resultIndex].pdfStatus = 'failed';
            testResults[resultIndex].pdfError = processingError.message;
          }
        }
      }
    );

    console.log(`PDF generation job ${jobId} queued for result ${resultId}`);

  } catch (error) {
    console.error('Test completion failed:', error);
    res.status(500).json({ error: 'Failed to complete test' });
  }
});

// Check PDF generation status
app.get('/api/reports/:id/status', (req, res) => {
  try {
    const result = testResults.find(r => r.id === req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      id: result.id,
      pdfStatus: result.pdfStatus || 'generating',
      pdfUrl: result.pdfUrl,
      pdfError: result.pdfError,
      completedAt: result.completedAt
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Download PDF report
app.get('/api/reports/:id/pdf', async (req, res) => {
  try {
    const result = testResults.find(r => r.id === req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (result.pdfStatus === 'generating') {
      return res.status(202).json({ 
        message: 'PDF is still being generated',
        status: 'generating' 
      });
    }

    if (result.pdfStatus === 'failed') {
      return res.status(500).json({ 
        error: 'PDF generation failed',
        details: result.pdfError 
      });
    }

    if (!result.pdfPath || !await fs.access(result.pdfPath).then(() => true).catch(() => false)) {
      // PDF file doesn't exist, regenerate it
      return await regeneratePDF(req, res, result);
    }

    // Serve the PDF file
    const pdfBuffer = await fs.readFile(result.pdfPath);
    const filename = `Report_${result.testeeName.replace(/\s+/g, '_')}_${new Date(result.completedAt).toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF download failed:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  }
});

// Regenerate PDF if missing
async function regeneratePDF(req, res, result) {
  try {
    const test = tests.find(t => t.id === result.testId);
    const session = Array.from(testSessions.values()).find(s => s.sessionId === result.sessionId);

    if (!test || !session) {
      return res.status(404).json({ error: 'Original test data not found' });
    }

    const userInfo = {
      firstName: session.firstName,
      lastName: session.lastName,
      email: session.email,
      profession: session.profession
    };

    const testInfo = {
      projectName: test.projectName,
      goldenLine: test.goldenLine,
      language: test.language
    };

    // Generate PDF with priority (blocking)
    const pdfBuffer = await PDFService.generateReportPriority(
      result,
      testInfo,
      userInfo
    );

    // Save regenerated PDF
    const pdfPath = path.join(__dirname, 'uploads', `report_${result.id}.pdf`);
    await fs.writeFile(pdfPath, pdfBuffer);

    // Update result
    const resultIndex = testResults.findIndex(r => r.id === result.id);
    if (resultIndex !== -1) {
      testResults[resultIndex].pdfStatus = 'ready';
      testResults[resultIndex].pdfPath = pdfPath;
    }

    const filename = `Report_${result.testeeName.replace(/\s+/g, '_')}_${new Date(result.completedAt).toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);

  } catch (error) {
    console.error('PDF regeneration failed:', error);
    res.status(500).json({ error: 'Failed to regenerate PDF' });
  }
}

// Queue status endpoint for monitoring
app.get('/api/system/pdf-status', (req, res) => {
  const status = PDFService.getQueueStatus();
  res.json(status);
});

// Event listeners for PDF service
PDFService.on('pdfGenerated', (data) => {
  console.log(`PDF generated successfully: Job ${data.jobId}, ${data.processingTime}ms, ${data.bufferSize} bytes`);
});

PDFService.on('pdfError', (data) => {
  console.error(`PDF generation failed: Job ${data.jobId}, Error: ${data.error}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await PDFService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await PDFService.shutdown();
  process.exit(0);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize data and start server
initializeData().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
});

module.exports = app;