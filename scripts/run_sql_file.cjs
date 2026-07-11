const { Client } = require('pg');
const fs = require('fs');

const [, , filePath, dbUrl] = process.argv;
if (!filePath || !dbUrl) {
  console.error('Usage: node run_sql_file.cjs <sql-file> <database_url>');
  process.exit(2);
}

let sql;
try {
  sql = fs.readFileSync(filePath, 'utf8');
} catch (err) {
  console.error('Could not read SQL file:', err.message);
  process.exit(2);
}

(async () => {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('MIGRATION_OK');
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    console.error('MIGRATION_ERROR', err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
