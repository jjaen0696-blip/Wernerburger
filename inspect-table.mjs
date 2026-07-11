import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yelkwbdxncitagmnnxat.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbGt3YmR4bmNpdGFnbW5ueGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQ1MTEsImV4cCI6MjA5ODg3MDUxMX0.1NXXD_McJeXgB9eVjuXblAongjzO-nYz99hlBOfYepI";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectTable() {
  console.log('🔍 Inspeccionando estructura de tabla "users"...\n');
  
  try {
    // Obtener un registro vacío para ver las columnas
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('📋 Estructura de la tabla (basado en registro existente):');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️  La tabla está vacía. Intentando obtener información via SQL...');
      
      // Alternativa: intentar con una consulta vacía para ver error descriptivo
      const { data: test, error: err } = await supabase
        .from('users')
        .insert([{}])
        .select();
      
      if (err) {
        console.log('\n📋 Columnas requeridas (según error):');
        console.log('   Error:', err.message);
        console.log('\n   Esto indica que falta especificar columnas requeridas.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectTable();
