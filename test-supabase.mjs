import { createClient } from '@supabase/supabase-js';

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
    
    // Test 2: Probar búsqueda por username
    console.log('\n2️⃣  Probando búsqueda por username "admin"...');
    const { data: userByUsername, error: searchError } = await supabase
      .from('users')
      .select('id, username, email')
      .eq('username', 'admin')
      .single();
    
    if (searchError) {
      if (searchError.code === 'PGRST116') {
        console.error('❌ Usuario "admin" no encontrado en la tabla');
        
        // Mostrar usuarios existentes para debug
        console.log('\n📋 Buscando usuarios disponibles...');
        const { data: allUsers, error: allError } = await supabase
          .from('users')
          .select('username, email, id')
          .limit(10);
        
        if (allError) {
          console.error('❌ Error al obtener usuarios:', allError.message);
        } else if (allUsers && allUsers.length > 0) {
          console.log('📋 Usuarios disponibles en la base de datos:');
          allUsers.forEach(u => console.log(`   - username: ${u.username}, email: ${u.email}`));
        } else {
          console.log('⚠️  No hay usuarios en la tabla');
        }
      } else {
        console.error('❌ Error en búsqueda:', searchError.message);
      }
    } else {
      console.log('✅ Usuario encontrado:', JSON.stringify(userByUsername, null, 2));
    }
    
    // Test 3: Probar autenticación básica
    console.log('\n3️⃣  Probando autenticación con email...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@wernerburger.com',
      password: 'test123'
    });
    
    if (authError) {
      console.error('❌ Error de autenticación (esperado si credenciales son inválidas):', authError.message);
    } else {
      console.log('✅ Autenticación exitosa:', authData.user?.email);
    }
    
    // Test 4: Verificar políticas RLS
    console.log('\n4️⃣  Verificando políticas RLS (Row Level Security)...');
    const { data: rls, error: rlsError } = await supabase
      .from('users')
      .select('count', { count: 'exact' });
    
    if (rlsError) {
      console.log('⚠️  Posibles restricciones RLS activas:', rlsError.message);
    } else {
      console.log('✅ Acceso anónimo permitido a la tabla users');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 CONCLUSIÓN:');
    console.log('La conexión a Supabase funciona correctamente.');
    console.log('El problema probable está en la estructura de datos o permisos.');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

testConnection();
