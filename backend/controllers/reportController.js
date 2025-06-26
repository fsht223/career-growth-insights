const pool = require('../db/pool');
const path = require('path');
const fs = require('fs');

const getReports = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT r.*, t.project_name, t.golden_line, t.language
      FROM test_results r
      JOIN tests t ON r.test_id = t.id
      WHERE t.coach_id = $1
      ORDER BY r.completed_at DESC`,
      [req.user.id]
    );

    const reports = result.rows.map(row => ({
      id: row.id,
      testId: row.test_id,
      testeeEmail: row.testee_email,
      testeeName: row.testee_name,
      profession: row.profession,
      completedAt: row.completed_at,
      reportUrl: row.report_url,
      pdfStatus: row.pdf_status,
      projectName: row.project_name,
      goldenLine: row.golden_line,
      language: row.language
    }));

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  } finally {
    client.release();
  }
};

const getReport = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    const result = await client.query(
      'SELECT * FROM test_results WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];
    
    res.json({
      id: report.id,
      testId: report.test_id,
      testeeEmail: report.testee_email,
      testeeName: report.testee_name,
      profession: report.profession,
      results: report.results,
      completedAt: report.completed_at,
      reportUrl: report.report_url,
      pdfStatus: report.pdf_status
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  } finally {
    client.release();
  }
};

const getReportStatus = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    const result = await client.query(
      'SELECT id, pdf_status, pdf_error, completed_at FROM test_results WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];
    
    res.json({
      id: report.id,
      pdfStatus: report.pdf_status || 'generating',
      pdfUrl: report.pdf_status === 'ready' ? `/api/reports/${id}/pdf` : null,
      pdfError: report.pdf_error,
      completedAt: report.completed_at
    });
  } catch (error) {
    console.error('Get report status error:', error);
    res.status(500).json({ error: 'Failed to check status' });
  } finally {
    client.release();
  }
};

const downloadPDF = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    const result = await client.query(
      'SELECT pdf_status, pdf_path, testee_name, completed_at FROM test_results WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = result.rows[0];

    if (report.pdf_status === 'generating') {
      return res.status(202).json({ 
        message: 'PDF is still being generated',
        status: 'generating' 
      });
    }

    if (report.pdf_status === 'failed') {
      return res.status(500).json({ 
        error: 'PDF generation failed',
        details: report.pdf_error 
      });
    }

    if (report.pdf_status === 'ready' && report.pdf_path) {
      // Stream the PDF file
      const filePath = report.pdf_path;
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'PDF file not found' });
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report.testee_name || 'report'}_${new Date(report.completed_at).toISOString().split('T')[0]}.pdf"`);
      const fileStream = fs.createReadStream(filePath);
      return fileStream.pipe(res);
    }

    // Fallback
    res.status(404).json({ error: 'PDF not available' });
  } catch (error) {
    console.error('PDF download error:', error);
    res.status(500).json({ error: 'Failed to download PDF' });
  } finally {
    client.release();
  }
};

module.exports = { getReports, getReport, getReportStatus, downloadPDF };