import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error('Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in environment');
  process.exit(1);
}

const serviceSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const anonSupabase = createClient(SUPABASE_URL, ANON_KEY);

async function setup() {
  console.log('⚙️  Configurando usuario admin...\n');
  
  try {
    // 1. Obtener ID del usuario admin en auth
    console.log('1️⃣  Obteniendo ID del usuario admin en auth...');
    const { data: { users }, error: listError } = await serviceSupabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error:', listError.message);
      return;
    }
    
    const adminUser = users.find(u => u.email === 'admin@wernerburger.com');
    if (!adminUser) {
      console.error('❌ Usuario admin no encontrado en auth');
      return;
    }
    
    console.log('✅ Usuario encontrado:', adminUser.email);
    console.log('   ID:', adminUser.id);
    
    // 2. Insertar en tabla users
    console.log('\n2️⃣  Insertando en tabla users...');
    const { data: inserted, error: insertError } = await serviceSupabase
      .from('users')
      .insert([{
        id: adminUser.id,
        username: 'admin',
        email: 'admin@wernerburger.com'
      }])
      .select();
    
    if (insertError) {
      console.error('❌ Error:', insertError.message);
      return;
    }
    
    console.log('✅ Insertado:', inserted);
    
    // 3. Verificar con service role
    console.log('\n3️⃣  Verificando con service role...');
    const { data: verified } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('username', 'admin');
    
    console.log(`   Encontrados: ${verified?.length}`);
    
    // 4. Verificar con anon key (como la app)
    console.log('\n4️⃣  Verificando con anon key (como la app)...');
    const { data: anonData, error: anonError } = await anonSupabase
      .from('users')
      .select('*')
      .eq('username', 'admin');
    
    if (anonError) {
      console.error('⚠️  Error con anon:', anonError.message);
      console.log('   Esto es porque hay RLS activo y solo ve su propio usuario');
    } else {
      console.log(`   Encontrados: ${anonData?.length}`);
    }
    
    // 5. Hacer login y verificar si ve su propio registro
    console.log('\n5️⃣  Haciendo login para verificar acceso RLS...');
    const { data: authData, error: loginError } = await anonSupabase.auth.signInWithPassword({
      email: 'admin@wernerburger.com',
      password: 'Admin123!'
    });
    
    if (loginError) {
      console.error('❌ Error de login:', loginError.message);
      return;
    }
    
    console.log('✅ Login exitoso');
    
    // Crear cliente autenticado
    const authSupabase = createClient(SUPABASE_URL, ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session?.access_token}`
        }
      }
    });
    
    // Buscar como usuario autenticado
    const { data: authUserData } = await authSupabase
      .from('users')
      .select('*')
      .eq('username', 'admin');
    
    console.log(`   Como usuario autenticado ve: ${authUserData?.length} registros`);
    authUserData?.forEach(u => console.log(`   - ${u.username}: ${u.email}`));
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ SETUP COMPLETADO');
    console.log('='.repeat(60));
    console.log('\n📝 Credenciales:');
    console.log('   Username: admin');
    console.log('   Password: Admin123!');
    console.log('\n🔐 Puedes hacer login en https://wernerburger.vercel.app/login\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setup();
