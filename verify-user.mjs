import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yelkwbdxncitagmnnxat.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbGt3YmR4bmNpdGFnbW5ueGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQ1MTEsImV4cCI6MjA5ODg3MDUxMX0.1NXXD_McJeXgB9eVjuXblAongjzO-nYz99hlBOfYepI";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbGt3YmR4bmNpdGFnbW5ueGF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI5NDUxMSwiZXhwIjoyMDk4ODcwNTExfQ.Sr3WP5lSmSYoe8xFCVtHAD7mu5Ytwwdv5y9DLKm-u8k";

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
