/*
  Ejecuta un archivo SQL completo contra la base de datos Postgres.
  Uso:
    DATABASE_URL=postgres://user:password@host:5432/dbname node scripts/execute_sql_file.cjs
  Opcional:
    node scripts/execute_sql_file.cjs sql/002_seed.sql
*/
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
if (!databaseUrl) {
  console.error('Error: define DATABASE_URL o SUPABASE_DB_URL con la conexión Postgres.');
  process.exit(1);
}

const sqlPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : path.resolve(__dirname, '../sql/002_seed.sql');

if (!fs.existsSync(sqlPath)) {
  console.error('No se encontró el archivo SQL:', sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    console.log('Ejecutando SQL desde:', sqlPath);
    await client.query(sql);
    console.log('Ejecución completada con éxito.');
  } catch (error) {
    console.error('Error ejecutando SQL:', error.message || error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();
