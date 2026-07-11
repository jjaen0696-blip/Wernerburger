const { Client } = require('pg');
const url = process.argv[2];
if (!url) {
  console.error('USAGE: node inspect_products.cjs <DATABASE_URL>');
  process.exit(2);
}
(async () => {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const cols = await client.query("SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name='products';");
    console.log('COLUMNS:', cols.rows);
    const pk = await client.query("SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS data_type FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey) WHERE i.indrelid = 'public.products'::regclass AND i.indisprimary;",
    ).catch(()=>null);
    console.log('PRIMARY KEY:', pk && pk.rows ? pk.rows : null);
    const exists = await client.query("SELECT to_regclass('public.products') AS reg");
    console.log('regclass:', exists.rows[0]);
    const tbl = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='products';");
    console.log('TABLE EXISTS:', tbl.rowCount>0);
    await client.end();
  } catch (err) {
    console.error('ERROR', err.message);
    process.exit(1);
  }
})();