const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Probando conexión a Supabase...\n');
console.log('URL:', SUPABASE_URL ? '✓ Configurada' : '✗ NO configurada');
console.log('KEY:', SUPABASE_KEY ? '✓ Configurada' : '✗ NO configurada');
console.log('');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  try {
    // Test 1: Verificar que podemos conectar
    console.log('1️⃣  Probando conexión básica...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error al consultar tabla "users":', usersError.message);
      console.log('   → La tabla "users" podría no existir o no tener permisos de lectura');
    } else {
      console.log('✅ Tabla "users" existe y es accesible');
      if (users && users.length > 0) {
        console.log('   Registro de ejemplo:', JSON.stringify(users[0], null, 2));
      } else {
        console.log('   ⚠️  La tabla está vacía (sin usuarios)');
      }
    }
    
    // Test 2: Ver si existen otras tablas relevantes
    console.log('\n2️⃣  Buscando tablas de autenticación...');
    
    // Intentar acceder a auth.users (tabla del sistema)
    try {
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email')
        .limit(1);
      
      if (authError) {
        console.log('⚠️  No se puede acceder a auth.users directamente (normal - tabla del sistema)');
      } else {
        console.log('✅ auth.users es accesible:', authUsers?.length || 0, 'registros');
      }
    } catch (e) {
      console.log('⚠️  No se puede acceder a auth.users (esperado)');
    }
    
    // Test 3: Probar búsqueda por username
    console.log('\n3️⃣  Probando búsqueda por username...');
    const { data: userByUsername, error: searchError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('username', 'admin')
      .single();
    
    if (searchError) {
      if (searchError.code === 'PGRST116') {
        console.error('❌ Usuario "admin" no encontrado en la tabla');
        
        // Mostrar usuarios existentes para debug
        const { data: allUsers } = await supabase
          .from('users')
          .select('username')
          .limit(10);
        
        if (allUsers && allUsers.length > 0) {
          console.log('📋 Usuarios disponibles en la base de datos:');
          allUsers.forEach(u => console.log('   -', u.username));
        }
      } else {
        console.error('❌ Error en búsqueda:', searchError.message);
      }
    } else {
      console.log('✅ Usuario encontrado:', userByUsername);
    }
    
    // Test 4: Verificar estructura de la tabla users
    console.log('\n4️⃣  Estructura de la tabla "users"...');
    const { data: schema, error: schemaError } = await supabase
      .from('users')
      .select('*')
      .limit(0);
    
    if (!schemaError && schema) {
      console.log('✅ Columnas disponibles: N/A desde esta consulta');
    } else if (schemaError) {
      console.log('⚠️  No se pudo obtener información de esquema');
    }
    
    // Test 5: Probar acceso anónimo vs autenticado
    console.log('\n5️⃣  Verificando políticas RLS (Row Level Security)...');
    const { data: rls, error: rlsError } = await supabase
      .from('users')
      .select('count', { count: 'exact' });
    
    if (rlsError) {
      console.log('⚠️  Posibles restricciones RLS activas:', rlsError.message);
    } else {
      console.log('✅ Acceso anónimo permitido a la tabla users');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 Resumen de pruebas completado\n');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

testConnection();
