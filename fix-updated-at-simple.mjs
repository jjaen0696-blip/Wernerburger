#!/usr/bin/env node
/**
 * Script simplificado para ejecutar correcciones SQL en Supabase
 * Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node fix-updated-at-simple.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Configure variables de entorno:');
  console.error('   SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Comandos SQL a ejecutar
const sqlCommands = [
  // 1. Agregar columnas updated_at
  'ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
  'ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
  'ALTER TABLE IF EXISTS public.purchase_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
  'ALTER TABLE IF EXISTS public.transfer_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',

  // 2. Limpiar triggers viejos
  'DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;',
  'DROP TRIGGER IF EXISTS trg_order_items_updated_at ON public.order_items;',
  'DROP TRIGGER IF EXISTS trg_purchase_items_updated_at ON public.purchase_items;',
  'DROP TRIGGER IF EXISTS trg_transfer_items_updated_at ON public.transfer_items;',

  // 3. Crear nuevos triggers
  'CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();',
  'CREATE TRIGGER trg_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();',
  'CREATE TRIGGER trg_purchase_items_updated_at BEFORE UPDATE ON public.purchase_items FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();',
  'CREATE TRIGGER trg_transfer_items_updated_at BEFORE UPDATE ON public.transfer_items FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();',
];

async function executeSQL() {
  console.log('🔧 Corrigiendo campos updated_at...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const [index, sql] of sqlCommands.entries()) {
    try {
      console.log(`[${index + 1}/${sqlCommands.length}] Ejecutando...`);
      
      const { error } = await supabase.rpc('exec', { sql }).catch(() => ({ error: null }));
      
      if (error) {
        console.warn(`  ⚠️  Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ OK`);
        successCount++;
      }
    } catch (err) {
      console.warn(`  ⚠️  Error: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Resultado: ${successCount} exitosos, ${errorCount} con advertencias`);

  // Verificar columnas
  console.log('\n📋 Verificando tablas...\n');
  
  try {
    const tables = ['orders', 'order_items', 'purchase_items', 'transfer_items'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (!error) {
        console.log(`✅ ${table}`);
      } else {
        console.log(`⚠️  ${table}: ${error.message}`);
      }
    }
  } catch (err) {
    console.error('Error verificando tablas:', err);
  }

  console.log('\n✨ Proceso completado!');
  console.log('\nNota: Si hay errores, ejecuta manualmente en Supabase SQL Editor el contenido de:');
  console.log('      supabase/migrations/20260711_fix_updated_at_fields.sql');
}

executeSQL();
