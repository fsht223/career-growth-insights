const pool = require('../db/pool');

const getDashboardStats = async (req, res) => {
  const client = await pool.connect();
  
  try {
    // Get statistics
    const statsResult = await client.query(
      `SELECT 
        COUNT(DISTINCT t.id) as total_tests,
        COUNT(DISTINCT tr.id) as completed_tests,
        COUNT(DISTINCT ts.id) FILTER (WHERE ts.completed = false) as active_tests,
        COUNT(DISTINCT ts.email) as total_participants
      FROM tests t
      LEFT JOIN test_sessions ts ON t.id = ts.test_id
      LEFT JOIN test_results tr ON t.id = tr.test_id
      WHERE t.coach_id = $1`,
      [req.user.id]
    );

    const stats = statsResult.rows[0];

    // Get recent activity
    const activityResult = await client.query(
      `SELECT 
        'test_created' as type,
        t.project_name as description,
        t.created_at as timestamp
      FROM tests t
      WHERE t.coach_id = $1
      UNION ALL
      SELECT 
        'test_completed' as type,
        tr.testee_name || ' completed ' || t.project_name as description,
        tr.completed_at as timestamp
      FROM test_results tr
      JOIN tests t ON tr.test_id = t.id
      WHERE t.coach_id = $1
      ORDER BY timestamp DESC
      LIMIT 10`,
      [req.user.id]
    );

    res.json({
      totalTests: parseInt(stats.total_tests) || 0,
      completedTests: parseInt(stats.completed_tests) || 0,
      activeTests: parseInt(stats.active_tests) || 0,
      totalParticipants: parseInt(stats.total_participants) || 0,
      recentActivity: activityResult.rows
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  } finally {
    client.release();
  }
};

module.exports = { getDashboardStats };