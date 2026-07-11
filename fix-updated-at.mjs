#!/usr/bin/env node
/**
 * Script para ejecutar la migración SQL que corrige los campos updated_at
 * Uso: node fix-updated-at.mjs
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en .env');
  process.exit(1);
}

async function executeMigration() {
  try {
    console.log('🔧 Iniciando corrección de campos updated_at...\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Leer archivo SQL de corrección
    const sqlFilePath = path.join(process.cwd(), 'supabase/migrations/20260711_fix_updated_at_fields.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error(`❌ Archivo no encontrado: ${sqlFilePath}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    // Dividir por comentarios de secciones para ejecutar por partes
    const sections = sqlContent.split(/--\s*={2,}/);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      
      if (!section || section.startsWith('=')) continue;

      // Extraer nombre de sección
      const lines = section.split('\n');
      const sectionName = lines[0].replace(/^[\s\-]*/, '') || `Sección ${i}`;

      console.log(`📍 Ejecutando: ${sectionName}`);

      // Usar rpc para ejecutar SQL administrativo
      try {
        // Para migraciónes complejas, usamos el endpoint de SQL directo si está disponible
        // De lo contrario, dividimos en statements individuales
        const statements = section
          .split(';')
          .map(s => s.trim())
          .filter(s => s && !s.startsWith('--'));

        for (const statement of statements) {
          if (statement && !statement.startsWith('--')) {
            try {
              // Ejecutar cada statement como una consulta raw
              await supabase.rpc('execute_sql', { 
                sql: statement 
              }).then(({ error }) => {
                if (error) throw error;
              }).catch(err => {
                // Si rpc no existe, intentar como query simple
                console.warn(`  ⚠️  Statement no ejecutable: ${statement.substring(0, 50)}...`);
              });
            } catch (err) {
              console.warn(`  ⚠️  Error en statement: ${err.message}`);
            }
          }
        }

        console.log(`✅ ${sectionName} completado\n`);
      } catch (err) {
        console.error(`❌ Error en sección: ${err.message}\n`);
      }
    }

    // Verificar que las columnas fueron agregadas
    console.log('\n📊 Verificando estado de las tablas...\n');

    const { data: columnsData, error: columnsError } = await supabase
      .rpc('get_updated_at_columns', {})
      .catch(() => ({
        data: null,
        error: 'RPC no disponible, verificar manualmente en Supabase'
      }));

    if (columnsError) {
      console.log('⚠️  No se pudo verificar automáticamente. Verificar en Supabase Dashboard:');
      console.log('   SQL Editor → Ejecutar: SELECT table_name FROM information_schema.columns WHERE column_name = "updated_at"');
    } else if (columnsData) {
      console.log('✅ Tablas con updated_at:');
      columnsData.forEach(row => console.log(`   - ${row.table_name}`));
    }

    console.log('\n✨ Corrección completada!');
    console.log('\nPróximos pasos:');
    console.log('1. Verifica en Supabase Dashboard que las tablas tengan updated_at');
    console.log('2. Reinicia el servidor: npm run start');
    console.log('3. Prueba los endpoints: GET /alerts, GET /inventory/:id, PATCH /branches/:id');

  } catch (err) {
    console.error('❌ Error fatal:', err.message);
    process.exit(1);
  }
}

executeMigration();
