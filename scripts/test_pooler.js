const { Client } = require('pg');
const pass = 'JOSECOD1020020529-';
const projectRef = 'yelkwbdxncitagmnnxat';
const candidates = [
  { label: 'transaction-pooler-6543', uri: `postgresql://postgres.${projectRef}:${encodeURIComponent(pass)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require` },
  { label: 'session-pooler-5432', uri: `postgresql://postgres.${projectRef}:${encodeURIComponent(pass)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require` },
  { label: 'transaction-pooler-6543-no-user', uri: `postgresql://postgres:${encodeURIComponent(pass)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require` },
  { label: 'session-pooler-5432-no-user', uri: `postgresql://postgres:${encodeURIComponent(pass)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require` },
];
(async () => {
  for (const candidate of candidates) {
    const client = new Client({ connectionString: candidate.uri, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const result = await client.query('select current_database(), current_user');
      console.log(JSON.stringify({ ok: true, candidate: candidate.label, row: result.rows[0] }));
      await client.end();
      process.exit(0);
    } catch (error) {
      console.log(JSON.stringify({ ok: false, candidate: candidate.label, error: error.message }));
      try { await client.end(); } catch {}
    }
  }
  process.exit(1);
})();
