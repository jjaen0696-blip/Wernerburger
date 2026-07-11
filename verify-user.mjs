import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL, SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const anonSupabase = createClient(SUPABASE_URL, ANON_KEY);
const serviceSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function verifyAndCreateUser() {
  console.log('🔍 Verificando usuario admin...\n');
  
  try {
    // 1. Buscar usuario en tabla users
    console.log('1️⃣  Buscando usuario en tabla users...');
    const { data: found, error: searchError } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single();
    
    if (found) {
      console.log('✅ Usuario encontrado:', found);
    } else if (searchError && searchError.code === 'PGRST116') {
      console.log('❌ Usuario no encontrado. Creando...\n');
      
      // 2. Si no existe, obtener ID del auth
      console.log('2️⃣  Buscando usuario en auth...');
      const { data: { users }, error: authError } = await serviceSupabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Error listando usuarios:', authError.message);
        return;
      }
      
      let userId = users.find(u => u.email === 'admin@wernerburger.com')?.id;
      
      if (!userId) {
        console.log('   Usuario no encontrado en auth. Creando...');
        const { data: authData, error: createError } = await serviceSupabase.auth.admin.createUser({
          email: 'admin@wernerburger.com',
          password: 'Admin123!',
          email_confirm: true,
          user_metadata: {
            username: 'admin'
          }
        });
        
        if (createError) {
          console.error('❌ Error creando usuario:', createError.message);
          return;
        }
        userId = authData.user?.id;
        console.log('✅ Usuario creado en auth:', authData.user?.email);
      } else {
        console.log('✅ Usuario encontrado en auth:', userId);
      }
      
      // 3. Insertar en tabla users
      console.log('\n3️⃣  Insertando en tabla users...');
      const { data: userData, error: insertError } = await serviceSupabase
        .from('users')
        .insert([{
          id: userId,
          username: 'admin',
          email: 'admin@wernerburger.com'
        }])
        .select();
      
      if (insertError) {
        console.error('❌ Error al insertar:', insertError.message);
        return;
      }
      
      console.log('✅ Usuario insertado en tabla users:', userData);
    }
    
    // 4. Probar login
    console.log('\n4️⃣  Probando login con usuario...');
    const { data, error } = await anonSupabase.auth.signInWithPassword({
      email: 'admin@wernerburger.com',
      password: 'Admin123!'
    });
    
    if (error) {
      console.error('❌ Error de login:', error.message);
    } else {
      console.log('✅ Login exitoso! Token:', data.session?.access_token?.substring(0, 20) + '...');
      console.log('   User ID:', data.user?.id);
    }
    
    // 5. Probar búsqueda por username (desde anon)
    console.log('\n5️⃣  Probando búsqueda por username (usuario anónimo)...');
    const { data: adminUser, error: findError } = await anonSupabase
      .from('users')
      .select('id, username, email')
      .eq('username', 'admin')
      .single();
    
    if (findError) {
      console.error('❌ Error en búsqueda:', findError.message);
    } else {
      console.log('✅ Usuario encontrado:', adminUser);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(60));
    console.log('\n📝 Credenciales:');
    console.log('   Username: admin');
    console.log('   Email: admin@wernerburger.com');
    console.log('   Password: Admin123!');
    console.log('\n🔐 Prueba el login en https://wernerburger.vercel.app/login\n');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

verifyAndCreateUser();
