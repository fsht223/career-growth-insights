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

    // Trigger PDF generation in background (if PDF service is available)
    // This would be handled by your PDF service
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Test completion error:', error);
    res.status(500).json({ error: 'Failed to complete test' });
  } finally {
    client.release();
  }
};

// Helper function to calculate results
const calculateTestResults = (session, test) => {
  const goldenLines = require('../data/goldenLines');
  const goldenLine = goldenLines.find(gl => gl.profession === test.golden_line);
  
  if (!goldenLine) {
    console.warn('Golden line not found for profession:', test.golden_line);
    return {
      groupScores: {},
      percentages: {},
      starredItems: session.motivational_selection || [],
      goldenLine: {}
    };
  }

  const groupScores = {};
  
  // Initialize group scores
  Object.keys(goldenLine.values).forEach(group => {
    groupScores[group] = 0;
  });

  // Calculate scores from answers
  const answers = session.answers || {};
  
  Object.entries(answers).forEach(([questionId, answer]) => {
    const question = questions.getQuestionById(parseInt(questionId));
    if (question && answer && typeof answer === 'object') {
      const firstChoice = question.options.find(opt => opt.id === answer.first);
      const secondChoice = question.options.find(opt => opt.id === answer.second);
      const thirdChoice = question.options.find(opt => 
        opt.id !== answer.first && opt.id !== answer.second
      );

      if (firstChoice && groupScores.hasOwnProperty(firstChoice.group)) {
        groupScores[firstChoice.group] += 3;
      }
      if (secondChoice && groupScores.hasOwnProperty(secondChoice.group)) {
        groupScores[secondChoice.group] += 2;
      }
      if (thirdChoice && groupScores.hasOwnProperty(thirdChoice.group)) {
        groupScores[thirdChoice.group] += 1;
      }
    }
  });

  // Calculate percentages
  const percentages = {};
  Object.entries(groupScores).forEach(([group, score]) => {
    const goldenValue = goldenLine.values[group];
    percentages[group] = goldenValue ? (score / goldenValue) * 100 : 0;
  });

  return {
    groupScores,
    percentages,
    starredItems: session.motivational_selection || [],
    goldenLine: goldenLine.values
  };
};

module.exports = { 
  getTestInfo, 
  registerForTest, 
  getQuestions, 
  saveAnswer, 
  completeTest 
};