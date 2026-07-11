const { Client } = require('pg');
const url = process.argv[2];
const table = process.argv[3];
if (!url || !table) {
  console.error('USAGE: node inspect_table.cjs <DATABASE_URL> <table_name>');
  process.exit(2);
}
(async () => {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const cols = await client.query("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1;", [table]);
    console.log('COLUMNS:', cols.rows);
    const pk = await client.query("SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = $1::regclass AND i.indisprimary;", ["public."+table]);
    console.log('PRIMARY KEY:', pk && pk.rows ? pk.rows : null);
    await client.end();
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();