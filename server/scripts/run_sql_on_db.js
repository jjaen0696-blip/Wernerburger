#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Client } = require('pg');

const sqlPath = path.join(__dirname, 'create_app_tables.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('No se encontró', sqlPath);
  process.exit(1);
}
const sql = fs.readFileSync(sqlPath, 'utf8');

// Prefer a direct DATABASE_URL; fall back to SUPABASE vars
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL;
if (!connectionString) {
  console.error('Falta DATABASE_URL en el entorno. Define DATABASE_URL con la conexión Postgres (ej: postgres://user:pass@host:5432/db)');
  process.exit(1);
}

(async () => {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log('Conectado a la base de datos, ejecutando SQL...');
    await client.query(sql);
    console.log('SQL ejecutado correctamente.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error ejecutando SQL:', err.message || err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
})();
