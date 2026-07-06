#!/usr/bin/env node
/*
Aplica migraciones y seed SQL a la base de datos PostgreSQL/Supabase.
Uso:
  DATABASE_URL=postgres://user:password@host:5432/dbname node scripts/apply_sql_files.cjs
  DATABASE_URL=... node scripts/apply_sql_files.cjs --skip-seed
*/
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!databaseUrl) {
  console.error('Error: define DATABASE_URL o SUPABASE_DB_URL con la conexión Postgres.');
  process.exit(1);
}

const skipSeed = process.argv.includes('--skip-seed');
const defaultFiles = [
  'sql/001_schema.sql',
  'sql/003_triggers.sql',
  'sql/004_inventory_rpc.sql',
  'sql/005_purchase_trigger.sql',
  'sql/006_alerts.sql',
  'sql/008_rls.sql'
];

const files = skipSeed
  ? defaultFiles
  : [...defaultFiles, 'sql/002_seed.sql'];

async function main() {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    for (const relativePath of files) {
      const absolutePath = path.resolve(process.cwd(), relativePath);
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`No se encontró el archivo SQL: ${relativePath}`);
      }
      const sql = fs.readFileSync(absolutePath, 'utf8');
      console.log(`Aplicando ${relativePath}...`);
      await client.query(sql);
      console.log(`✓ ${relativePath}`);
    }
    console.log('Esquema y seed aplicados correctamente.');
  } catch (error) {
    console.error('Error aplicando SQL:', error.message || error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
