import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yelkwbdxncitagmnnxat.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbGt3YmR4bmNpdGFnbW5ueGF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI5NDUxMSwiZXhwIjoyMDk4ODcwNTExfQ.Sr3WP5lSmSYoe8xFCVtHAD7mu5Ytwwdv5y9DLKm-u8k";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixUser() {
  console.log('🔧 Reparando usuario admin...\n');
  
  try {
    // 1. Listar usuarios en auth
    console.log('1️⃣  Listando usuarios en auth...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error:', listError.message);
      return;
    }
    
    console.log(`   Encontrados ${users.length} usuarios`);
    users.forEach(u => console.log(`   - ${u.email}`));
    
    // 2. Limpiar y crear nuevo usuario
    console.log('\n2️⃣  Eliminando usuario anterior...');
    for (const user of users) {
      if (user.email?.includes('admin') || user.email?.includes('werner')) {
        const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
        if (delError) {
          console.log(`   ⚠️  No se pudo eliminar ${user.email}`);
        } else {
          console.log(`   ✅ Eliminado: ${user.email}`);
        }
      }
    }
    
    // 3. Crear usuario nuevo
    console.log('\n3️⃣  Creando usuario admin...');
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: 'admin@wernerburger.com',
      password: 'Admin123!',
      email_confirm: true,
      user_metadata: {
        username: 'admin',
        role: 'admin'
      }
    });
    
    if (createError) {
      console.error('❌ Error:', createError.message);
      return;
    }
    
    console.log('✅ Usuario creado:', authData.user?.email);
    const userId = authData.user?.id;
    
    // 4. Actualizar tabla users
    console.log('\n4️⃣  Actualizando tabla users...');
    
    // Primero eliminar usuarios old
    const { error: delTableError } = await supabase
      .from('users')
      .delete()
      .neq('id', userId);
    
    if (delTableError) {
      console.log('   ⚠️  Error al limpiar tabla:', delTableError.message);
    }
    
    // Luego insertar/actualizar el nuevo
    const { data: userData, error: upsertError } = await supabase
      .from('users')
      .upsert([{
        id: userId,
        username: 'admin',
        email: 'admin@wernerburger.com'
      }], { onConflict: 'id' })
      .select();
    
    if (upsertError) {
      console.error('❌ Error:', upsertError.message);
      return;
    }
    
    console.log('✅ Usuario actualizado en tabla:', userData);
    
    // 5. Verificar búsqueda
    console.log('\n5️⃣  Verificando búsqueda...');
    const { data: adminUsers } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin');
    
    console.log('   Usuarios encontrados:', adminUsers?.length);
    adminUsers?.forEach(u => console.log(`   - ${u.username}: ${u.email}`));
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ USUARIO PREPARADO');
    console.log('='.repeat(60));
    console.log('\n📝 Credenciales correctas:');
    console.log('   Username: admin');
    console.log('   Email: admin@wernerburger.com');
    console.log('   Password: Admin123!');
    console.log('\n🔐 Puedes hacer login en https://wernerburger.vercel.app/login\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixUser();
