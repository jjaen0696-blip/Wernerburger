import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yelkwbdxncitagmnnxat.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbGt3YmR4bmNpdGFnbW5ueGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQ1MTEsImV4cCI6MjA5ODg3MDUxMX0.1NXXD_McJeXgB9eVjuXblAongjzO-nYz99hlBOfYepI";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testLogin() {
  console.log('🧪 Probando autenticación completa...\n');
  
  try {
    // 1. Buscar usuario por username (como lo hace la app)
    console.log('1️⃣  Buscando usuario por username...');
    const { data: userRecord, error: searchError } = await supabase
      .from('users')
      .select('email')
      .eq('username', 'admin')
      .single();
    
    if (searchError) {
      console.error('❌ Error en búsqueda:', searchError.message);
      return;
    }
    
    console.log('✅ Usuario encontrado:', userRecord);
    
    // 2. Login con email obtenido
    console.log('\n2️⃣  Intentando login...');
    const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
      email: userRecord.email,
      password: 'Admin123!'
    });
    
    if (loginError) {
      console.error('❌ Error de login:', loginError.message);
      return;
    }
    
    console.log('✅ Login exitoso!');
    console.log('   User ID:', authData.user?.id);
    console.log('   Email:', authData.user?.email);
    console.log('   Token:', authData.session?.access_token?.substring(0, 30) + '...');
    
    // 3. Verificar rol
    console.log('\n3️⃣  Verificando metadata del usuario...');
    console.log('   Username (metadata):', authData.user?.user_metadata?.username);
    console.log('   Role (metadata):', authData.user?.user_metadata?.role);
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ AUTENTICACIÓN FUNCIONANDO CORRECTAMENTE');
    console.log('='.repeat(60));
    console.log('\n📝 El flujo de login es:');
    console.log('   1. Usuario ingresa: username="admin", password="Admin123!"');
    console.log('   2. Se busca en tabla users por username');
    console.log('   3. Se obtiene email: admin@wernerburger.com');
    console.log('   4. Se autentica con ese email en Supabase Auth');
    console.log('   5. ✅ Login exitoso!\n');
    
  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

testLogin();
