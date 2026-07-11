import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yelkwbdxncitagmnnxat.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbGt3YmR4bmNpdGFnbW5ueGF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI5NDUxMSwiZXhwIjoyMDk4ODcwNTExfQ.Sr3WP5lSmSYoe8xFCVtHAD7mu5Ytwwdv5y9DLKm-u8k";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbGt3YmR4bmNpdGFnbW5ueGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQ1MTEsImV4cCI6MjA5ODg3MDUxMX0.1NXXD_McJeXgB9eVjuXblAongjzO-nYz99hlBOfYepI";

const serviceSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const anonSupabase = createClient(SUPABASE_URL, ANON_KEY);

async function finalSetup() {
  console.log('🔧 Configuración final...\n');
  
  try {
    // 1. Ver qué hay en la tabla con service role
    console.log('1️⃣  Verificando tabla users (service role)...');
    const { data: allUsers } = await serviceSupabase
      .from('users')
      .select('*');
    
    console.log(`   Total: ${allUsers?.length}`);
    allUsers?.forEach(u => console.log(`   - ${u.id}: ${u.username} (${u.email})`));
    
    // 2. Obtener ID del admin en auth
    console.log('\n2️⃣  Obteniendo ID admin...');
    const { data: { users } } = await serviceSupabase.auth.admin.listUsers();
    const admin = users.find(u => u.email === 'admin@wernerburger.com');
    console.log('   ID:', admin.id);
    
    // 3. Actualizar registro
    console.log('\n3️⃣  Actualizando registro...');
    const { data: updated, error: updateError } = await serviceSupabase
      .from('users')
      .update({ 
        username: 'admin',
        email: 'admin@wernerburger.com'
      })
      .eq('id', admin.id)
      .select();
    
    if (updateError) {
      console.error('❌ Error:', updateError.message);
    } else {
      console.log('✅ Actualizado:', updated);
    }
    
    // 4. Verificar que existe
    console.log('\n4️⃣  Verificando (service role)...');
    const { data: verify } = await serviceSupabase
      .from('users')
      .select('*')
      .eq('username', 'admin');
    
    console.log(`   Encontrados: ${verify?.length}`);
    
    // 5. Desactivar RLS temporalmente para verificar anon access
    console.log('\n5️⃣  Probando acceso anónimo...');
    const { data: anonCheck } = await anonSupabase
      .from('users')
      .select('id, username, email')
      .eq('username', 'admin');
    
    if (anonCheck && anonCheck.length > 0) {
      console.log('✅ Anon puede ver:', anonCheck);
    } else {
      console.log('⚠️  Anon no ve el registro (RLS activo)');
      console.log('   Esto es normal - la tabla tiene RLS que restringe acceso');
    }
    
    // 6. Test completo de login
    console.log('\n6️⃣  Test de login con AuthContext...');
    
    // Primero: buscar usuario (lo que hace AuthContext.tsx)
    const { data: found, error: findError } = await anonSupabase
      .from('users')
      .select('email')
      .eq('username', 'admin')
      .single();
    
    if (findError) {
      console.error('❌ Error buscando usuario:', findError.message);
      console.log('   ⚠️  PROBLEMA: AuthContext no puede buscar por username');
      console.log('   Esto indica que la tabla tiene RLS muy restrictivo');
      console.log('\n   SOLUCIÓN: Necesitas deshabilitar RLS en la tabla users');
      console.log('   para que el login funcione correctamente.');
    } else {
      // Segundo: login
      const { data: authData, error: loginError } = await anonSupabase.auth.signInWithPassword({
        email: found.email,
        password: 'Admin123!'
      });
      
      if (loginError) {
        console.error('❌ Error de login:', loginError.message);
      } else {
        console.log('✅ Login exitoso! Usuario autenticado');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

finalSetup();
