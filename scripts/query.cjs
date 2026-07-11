const { Client } = require('pg');
const url = process.argv[2];
const sql = process.argv[3];
if (!url || !sql) { console.error('USAGE: node query.cjs <DATABASE_URL> <SQL>'); process.exit(2); }
(async ()=>{
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query(sql);
    console.log('RESULT ROWS:', res.rows);
    await client.end();
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();