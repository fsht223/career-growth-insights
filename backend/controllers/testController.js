const { v4: uuidv4 } = require('uuid');
const pool = require('../db/pool');
const emailService = require('../services/emailService');

const createTest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const {
      projectName,
      goldenLine,
      language,
      reseller,
      coachEmail,
      testeeEmail,
      testCount,
      reportRecipient,
      description
    } = req.body;

    const testId = uuidv4();
    const link = `${process.env.FRONTEND_URL}/test/${testId}`;

    const result = await client.query(
      `INSERT INTO tests (
        id, project_name, golden_line, language, reseller, 
        coach_email, testee_email, test_count, report_recipient, 
        coach_id, link, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        testId, projectName, goldenLine, language || 'ru', reseller,
        coachEmail || req.user.email, testeeEmail, testCount || 1, 
        reportRecipient || 'coach', req.user.id, link, description
      ]
    );

    const test = result.rows[0];
    
    // Send invitation email if testeeEmail is provided
    if (testeeEmail) {
      try {
        await emailService.sendSimpleBilingualInvitation({
          testLink: link,
          recipientEmail: testeeEmail
        });
      } catch (emailErr) {
        console.error('Failed to send invitation email:', emailErr);
        // Do not fail test creation if email fails
      }
    }

    res.status(201).json({
      id: test.id,
      projectName: test.project_name,
      goldenLine: test.golden_line,
      language: test.language,
      link: test.link,
      status: test.status,
      createdAt: test.created_at
    });
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Failed to create test' });
  } finally {
    client.release();
  }
};

const getTests = async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Get tests with session counts
    const result = await client.query(
      `SELECT 
        t.*,
        COUNT(DISTINCT ts.id) FILTER (WHERE ts.completed = true) as completed_count,
        COUNT(DISTINCT ts.id) FILTER (WHERE ts.completed = false) as in_progress_count
      FROM tests t
      LEFT JOIN test_sessions ts ON t.id = ts.test_id
      WHERE t.coach_id = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    const tests = result.rows.map(test => ({
      id: test.id,
      projectName: test.project_name,
      goldenLine: test.golden_line,
      language: test.language,
      reseller: test.reseller,
      status: test.status,
      link: test.link,
      testeeEmail: test.testee_email,
      reportRecipient: test.report_recipient,
      createdAt: test.created_at,
      completedCount: parseInt(test.completed_count) || 0,
      inProgressCount: parseInt(test.in_progress_count) || 0
    }));

    res.json(tests);
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  } finally {
    client.release();
  }
};

const getTestDetails = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    const result = await client.query(
      `SELECT t.*, 
        COUNT(DISTINCT ts.id) as total_sessions,
        COUNT(DISTINCT ts.id) FILTER (WHERE ts.completed = true) as completed_sessions
      FROM tests t
      LEFT JOIN test_sessions ts ON t.id = ts.test_id
      WHERE t.id = $1 AND t.coach_id = $2
      GROUP BY t.id`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    const test = result.rows[0];
    
    // Get sessions details
    const sessionsResult = await client.query(
      `SELECT session_id, first_name, last_name, email, 
        current_question, completed, started_at, completed_at
      FROM test_sessions
      WHERE test_id = $1
      ORDER BY started_at DESC`,
      [id]
    );

    res.json({
      id: test.id,
      projectName: test.project_name,
      goldenLine: test.golden_line,
      language: test.language,
      reseller: test.reseller,
      status: test.status,
      link: test.link,
      description: test.description,
      createdAt: test.created_at,
      totalSessions: parseInt(test.total_sessions) || 0,
      completedSessions: parseInt(test.completed_sessions) || 0,
      sessions: sessionsResult.rows
    });
  } catch (error) {
    console.error('Get test details error:', error);
    res.status(500).json({ error: 'Failed to fetch test details' });
  } finally {
    client.release();
  }
};

const deleteTest = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    const result = await client.query(
      'DELETE FROM tests WHERE id = $1 AND coach_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Test not found' });
    }

    res.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Delete test error:', error);
    res.status(500).json({ error: 'Failed to delete test' });
  } finally {
    client.release();
  }
};

module.exports = { createTest, getTests, getTestDetails, deleteTest };