const pool = require('./pool');
const fs = require('fs').promises;
const path = require('path');

async function initDatabase() {
  try {
    // Read SQL schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDatabase();