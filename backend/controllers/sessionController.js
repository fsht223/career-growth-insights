const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const questions = require('../data/questions');

const getTestInfo = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    const result = await client.query(
      'SELECT id, project_name, golden_line, language FROM tests WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = result.rows[0];
    
    res.json({
      id: test.id,
      projectName: test.project_name,
      language: test.language,
      profession: test.golden_line
    });
  } catch (error) {
    console.error('Get test info error:', error);
    res.status(500).json({ error: 'Failed to fetch test' });
  } finally {
    client.release();
  }
};

const registerForTest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id: testId } = req.params;
    const { firstName, lastName, email, profession } = req.body;

    // Check if test exists
    const testResult = await client.query(
      'SELECT testee_email FROM tests WHERE id = $1',
      [testId]
    );

    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = testResult.rows[0];
    
    // Check if restricted to specific email
    if (test.testee_email && test.testee_email !== email) {
      return res.status(403).json({ 
        error: 'This test is restricted to a specific email address' 
      });
    }

    // Check for existing session
    const existingSession = await client.query(
      'SELECT * FROM test_sessions WHERE test_id = $1 AND email = $2',
      [testId, email]
    );

    if (existingSession.rows.length > 0) {
      const session = existingSession.rows[0];
      
      if (session.completed) {
        return res.status(400).json({ 
          error: 'Test already completed',
          completed: true 
        });
      }

      return res.json({
        sessionId: session.session_id,
        continueFrom: session.current_question || 0,
        message: 'Continuing from previous session'
      });
    }

    // Create new session
    const sessionId = uuidv4();
    
    await client.query(
      `INSERT INTO test_sessions 
        (test_id, session_id, first_name, last_name, email, profession)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [testId, sessionId, firstName, lastName, email, profession]
    );

    res.json({ sessionId, continueFrom: 0 });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register for test' });
  } finally {
    client.release();
  }
};

const getQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Return questions (you can customize based on language)
    res.json(questions.getAllQuestions());
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

const saveAnswer = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id: testId } = req.params;
    const { sessionId, questionId, answer, motivationalSelection } = req.body;

    // Get current session
    const sessionResult = await client.query(
      'SELECT * FROM test_sessions WHERE session_id = $1 AND test_id = $2',
      [sessionId, testId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.completed) {
      return res.status(400).json({ error: 'Test already completed' });
    }

    // Update session based on question type
    if (questionId === 40) {
      // Motivational selection
      await client.query(
        `UPDATE test_sessions 
        SET motivational_selection = $1, current_question = $2, last_updated = CURRENT_TIMESTAMP
        WHERE session_id = $3`,
        [JSON.stringify(motivationalSelection), questionId, sessionId]
      );
    } else {
      // Regular question
      const currentAnswers = session.answers || {};
      currentAnswers[questionId] = answer;
      
      await client.query(
        `UPDATE test_sessions 
        SET answers = $1, current_question = $2, last_updated = CURRENT_TIMESTAMP
        WHERE session_id = $3`,
        [JSON.stringify(currentAnswers), questionId, sessionId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Save answer error:', error);
    res.status(500).json({ error: 'Failed to save answer' });
  } finally {
    client.release();
  }
};

const completeTest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id: testId } = req.params;
    const { sessionId } = req.body;

    // Get session data
    const sessionResult = await client.query(
      'SELECT * FROM test_sessions WHERE session_id = $1 AND test_id = $2',
      [sessionId, testId]
    );

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    if (session.completed) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Test already completed' });
    }

    // Get test info
    const testResult = await client.query(
      'SELECT * FROM tests WHERE id = $1',
      [testId]
    );

    const test = testResult.rows[0];

    // Calculate results
    console.log('Session answers:', session.answers);
    console.log('Test golden_line:', test.golden_line);
    const results = calculateTestResults(session, test);

    // Mark session as completed
    await client.query(
      `UPDATE test_sessions 
      SET completed = true, completed_at = CURRENT_TIMESTAMP 
      WHERE session_id = $1`,
      [sessionId]
    );

    // Save results
    const resultId = uuidv4();
    const reportUrl = `/api/reports/${resultId}`;

    await client.query(
      `INSERT INTO test_results 
        (id, test_id, session_id, testee_email, testee_name, profession, results, report_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        resultId,
        testId,
        sessionId,
        session.email,
        `${session.first_name} ${session.last_name}`,
        session.profession,
        JSON.stringify(results),
        reportUrl
      ]
    );

    await client.query('COMMIT');

    res.json({ 
      resultId,
      results,
      reportUrl,
      pdfStatus: 'generating'
    });

    // Trigger PDF generation in background
    (async () => {
      const pdfService = require('../services/pdfService');
      const fs = require('fs').promises;
      const path = require('path');
      let pdfStatus = 'generating';
      let pdfPath = null;
      let pdfError = null;
      try {
        // Prepare info for PDF
        const testInfo = {
          projectName: test.project_name,
          goldenLine: test.golden_line,
          language: test.language
        };
        const userInfo = {
          firstName: session.first_name,
          lastName: session.last_name,
          email: session.email,
          profession: session.profession
        };
        const pdfBuffer = await pdfService.generateReport({ results }, testInfo, userInfo);
        const uploadsDir = path.join(__dirname, '../uploads');
        await fs.mkdir(uploadsDir, { recursive: true });
        pdfPath = path.join(uploadsDir, `${resultId}.pdf`);
        await fs.writeFile(pdfPath, pdfBuffer);
        pdfStatus = 'ready';
        pdfError = null;
      } catch (err) {
        pdfStatus = 'failed';
        pdfError = err.message || 'Unknown PDF generation error';
        pdfPath = null;
        console.error('PDF generation error:', err);
      }
      // Update test_results with PDF status
      const client2 = await pool.connect();
      try {
        await client2.query(
          `UPDATE test_results SET pdf_status = $1, pdf_path = $2, pdf_error = $3 WHERE id = $4`,
          [pdfStatus, pdfPath, pdfError, resultId]
        );
      } finally {
        client2.release();
      }
    })();
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Test completion error:', error);
    res.status(500).json({ error: 'Failed to complete test' });
  } finally {
    client.release();
  }
};

const ALL_BUTTONS = [
  "Intuition", "Success", "Professional Pleasure", "Bringing Happiness",
  "Perfectionism", "Social Contact", "Empathy", "Recognition",
  "Resilience", "Respect", "Efficiency", "Intellectual Discovery",
  "Team Spirit", "Influence", "Responsibility", "Reaching Goals",
  "Being Logical", "Social Approval"
];

const getDefaultGoldenLine = () => {
  // Fallback values (average or typical values from your data)
  return {
    "Intuition": 11,
    "Success": 11,
    "Professional Pleasure": 11,
    "Bringing Happiness": 11,
    "Perfectionism": 11,
    "Social Contact": 11,
    "Empathy": 11,
    "Recognition": 11,
    "Resilience": 11,
    "Respect": 11,
    "Efficiency": 11,
    "Intellectual Discovery": 11,
    "Team Spirit": 11,
    "Influence": 11,
    "Responsibility": 11,
    "Reaching Goals": 11,
    "Being Logical": 11,
    "Social Approval": 11
  };
};

// Profile mappings
const PROFILE_GROUPS = {
  Power: ["Intuition", "Success", "Resilience", "Respect", "Influence"],
  Affiliation: ["Professional Pleasure", "Bringing Happiness", "Social Contact", "Empathy", "Team Spirit", "Recognition", "Social Approval"],
  Achievement: ["Perfectionism", "Reaching Goals", "Responsibility", "Value", "Efficiency", "Intellectual Discovery", "Being Logical"]
};
const INNER_MOTIVATION = ["Intuition", "Professional Pleasure", "Bringing Happiness", "Empathy", "Resilience", "Intellectual Discovery", "Team Spirit"];
const OUTER_MOTIVATION = ["Perfectionism", "Success", "Reaching Goals", "Recognition", "Social Contact", "Influence", "Responsibility", "Value", "Respect", "Efficiency", "Being Logical", "Social Approval"];

const calculateTestResults = (session, test) => {
  const goldenLines = require('../data/goldenLines');
  let goldenLine = goldenLines.find(gl => gl.profession === test.golden_line);
  if (!goldenLine) {
    console.warn('Golden line not found for profession:', test.golden_line);
    goldenLine = { values: getDefaultGoldenLine() };
  }

  // Initialize scores for all buttons
  const groupScores = {};
  ALL_BUTTONS.forEach(btn => { groupScores[btn] = 0; });

  // Calculate scores from answers (questions 1-39)
  const answers = session.answers || {};
  for (let qId = 1; qId <= 39; qId++) {
    const question = require('../data/questions').getQuestionById(qId);
    if (!question || !question.options || question.options.length !== 3) continue;
    const answer = answers[qId];
    if (answer && answer.first && answer.second) {
      // Assign 3 to first, 2 to second, 1 to the remaining
      question.options.forEach(opt => {
        if (groupScores.hasOwnProperty(opt.group)) {
          if (opt.id === answer.first) groupScores[opt.group] += 3;
          else if (opt.id === answer.second) groupScores[opt.group] += 2;
          else groupScores[opt.group] += 1;
        }
      });
    } else {
      // If answer is missing or incomplete, assign 1 to all three
      question.options.forEach(opt => {
        if (groupScores.hasOwnProperty(opt.group)) {
          groupScores[opt.group] += 1;
        }
      });
    }
  }

  // Debug: print sum of all button scores and number of answered questions
  const totalScore = Object.values(groupScores).reduce((a, b) => a + b, 0);
  const answeredQuestions = Object.keys(answers).filter(q => parseInt(q) >= 1 && parseInt(q) <= 39).length;
  console.log('DEBUG: Total button score:', totalScore, '| Answered questions:', answeredQuestions);

  // Calculate percentages for each button
  const percentages = {};
  ALL_BUTTONS.forEach(btn => {
    const goldenValue = goldenLine.values[btn] || 1;
    percentages[btn] = goldenValue ? (groupScores[btn] / goldenValue) * 100 : 0;
  });

  // Starred items from Q40
  let starredItems = [];
  if (session.motivational_selection && Array.isArray(session.motivational_selection)) {
    starredItems = session.motivational_selection;
  }

  // Profile averages
  const profileAverages = {};
  Object.entries(PROFILE_GROUPS).forEach(([profile, btns]) => {
    const vals = btns.map(btn => percentages[btn] || 0);
    profileAverages[profile] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });

  // Consistency (Q1-3 vs Q37-39)
  const consistencyPairs = [
    [1, 37], [2, 38], [3, 39]
  ];
  const consistencyScores = [];
  consistencyPairs.forEach(([qA, qB]) => {
    const ansA = answers[qA];
    const ansB = answers[qB];
    if (ansA && ansB) {
      const qAObj = require('../data/questions').getQuestionById(qA);
      const qBObj = require('../data/questions').getQuestionById(qB);
      [0, 1, 2].forEach(idx => {
        const btnA = qAObj.options[idx].group;
        const btnB = qBObj.options[idx].group;
        // Score for each button in both questions
        let scoreA = 0, scoreB = 0;
        if (ansA.first === qAObj.options[idx].id) scoreA = 3;
        else if (ansA.second === qAObj.options[idx].id) scoreA = 2;
        else scoreA = 1;
        if (ansB.first === qBObj.options[idx].id) scoreB = 3;
        else if (ansB.second === qBObj.options[idx].id) scoreB = 2;
        else scoreB = 1;
        if (btnA === btnB) {
          const minV = Math.min(scoreA, scoreB);
          const maxV = Math.max(scoreA, scoreB);
          if (maxV > 0) {
            consistencyScores.push((minV / maxV) * 100);
          }
        }
      });
    }
  });
  const consistency = consistencyScores.length ? consistencyScores.reduce((a, b) => a + b, 0) / consistencyScores.length : 0;

  // Awareness Level
  let awarenessLevel = 0;
  if (starredItems.length === 5) {
    let count = 0;
    starredItems.forEach(btn => {
      if ((percentages[btn] || 0) >= 96) count++;
    });
    awarenessLevel = count * 20;
  }

  // Inner/Outer Motivation
  const totalPoints = Object.values(groupScores).reduce((a, b) => a + b, 0) || 1;
  const innerPoints = INNER_MOTIVATION.map(btn => groupScores[btn] || 0).reduce((a, b) => a + b, 0);
  const outerPoints = OUTER_MOTIVATION.map(btn => groupScores[btn] || 0).reduce((a, b) => a + b, 0);
  const innerOuter = {
    inner: (innerPoints / totalPoints) * 100,
    outer: (outerPoints / totalPoints) * 100
  };

  // Reasoning
  const intuition = groupScores["Intuition"] || 0;
  const beingLogical = groupScores["Being Logical"] || 0;
  const sumReasoning = intuition + beingLogical || 1;
  const reasoning = {
    intuition: (intuition / sumReasoning) * 100,
    beingLogical: (beingLogical / sumReasoning) * 100
  };

  // Strengths, Boosters, Development Areas (structure only)
  const strengths = ALL_BUTTONS.filter(btn => (percentages[btn] || 0) >= 100);
  const boosters = strengths; // For now, same as strengths
  // Top 5 buttons with largest deviation from 100%
  const deviations = ALL_BUTTONS.map(btn => ({ btn, dev: Math.abs((percentages[btn] || 0) - 100) }));
  deviations.sort((a, b) => b.dev - a.dev);
  const developmentAreas = deviations.slice(0, 5).map(d => ({ btn: d.btn, percent: percentages[d.btn] }));

  return {
    groupScores,
    percentages,
    starredItems,
    goldenLine: goldenLine.values,
    profileAverages,
    consistency,
    awarenessLevel,
    innerOuter,
    reasoning,
    strengths,
    boosters,
    developmentAreas
  };
};

module.exports = { 
  getTestInfo, 
  registerForTest, 
  getQuestions, 
  saveAnswer, 
  completeTest 
};