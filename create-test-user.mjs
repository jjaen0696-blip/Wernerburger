import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createTestUser() {
  console.log('📝 Creando usuario de prueba en Supabase...\n');
  
  try {
    // 1. Crear usuario en auth
    console.log('1️⃣  Creando usuario en autenticación...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@wernerburger.com',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        username: 'admin',
        role: 'admin'
      }
    });
    
    if (authError) {
      console.error('❌ Error en auth:', authError.message);
      return;
    }
    
    console.log('✅ Usuario creado en auth:', authData.user?.email);
    const userId = authData.user?.id;
    
    // 2. Insertar usuario en tabla users
    console.log('\n2️⃣  Insertando en tabla users...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        username: 'admin',
        email: 'admin@wernerburger.com',
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (userError) {
      console.error('❌ Error al insertar usuario:', userError.message);
      // Intentar sin el ID para ver si postgres lo genera
      console.log('\n   Intentando sin ID (postgre lo genera)...');
      
      const { data: userData2, error: userError2 } = await supabase
        .from('users')
        .insert([{
          username: 'admin',
          email: 'admin@wernerburger.com'
        }])
        .select();
      
      if (userError2) {
        console.error('❌ Error:', userError2.message);
        return;
      }
      console.log('✅ Usuario insertado:', userData2);
    } else {
      console.log('✅ Usuario insertado en tabla users:', userData);
    }
    
    // 3. Verificar que se puede buscar
    console.log('\n3️⃣  Verificando búsqueda por username...');
    const { data: found, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (searchError) {
      console.error('❌ Error en búsqueda:', searchError.message);
      return;
    }
    
    console.log('✅ Usuario encontrado:', found);
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ USUARIO CREADO EXITOSAMENTE');
    console.log('='.repeat(60));
    console.log('\n📝 Credenciales de prueba:');
    console.log('   Username: admin');
    console.log('   Email: admin@wernerburger.com');
    console.log('   Password: Admin123!');
    console.log('\n🔐 Prueba el login en https://wernerburger.vercel.app/login\n');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

createTestUser();
