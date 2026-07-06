const { Client } = require('pg');
const pass = 'JOSECOD1020020529-';
const candidates = [
  { name: 'postgres', uri: 'postgresql://postgres:' + encodeURIComponent(pass) + '@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable' },
  { name: 'postgres.yelkwbdxncitagmnnxat', uri: 'postgresql://postgres.yelkwbdxncitagmnnxat:' + encodeURIComponent(pass) + '@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable' },
  { name: 'postgresql', uri: 'postgresql://postgresql:' + encodeURIComponent(pass) + '@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable' },
  { name: 'postgres.yelkwbdxncitagmnnxat', uri: 'postgresql://postgres.yelkwbdxncitagmnnxat:' + encodeURIComponent(pass) + '@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=disable' }
];
(async () => {
  for (const candidate of candidates) {
    const client = new Client({ connectionString: candidate.uri });
    try {
      await client.connect();
      console.log(JSON.stringify({ ok: true, user: candidate.name }));
      await client.end();
      process.exit(0);
    } catch (error) {
      console.log(JSON.stringify({ ok: false, user: candidate.name, error: error.message }));
      try { await client.end(); } catch {}
    }
  }
  process.exit(1);
})();
