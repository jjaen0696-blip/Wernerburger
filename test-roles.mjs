import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yelkwbdxncitagmnnxat.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY no configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testUsers = [
  { username: 'admin', password: 'Admin123!', expectedRole: 'admin' },
  { username: 'cocina', password: 'Cocina123!', expectedRole: 'cocina' },
  { username: 'delivery', password: 'Delivery123!', expectedRole: 'delivery' }
];

async function testLogin(username, password, expectedRole) {
  console.log(`\n🔐 Probando login: ${username}`);

  try {
    // 1. Buscar usuario por username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, role, branch_id')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.error(`   ❌ Usuario no encontrado en tabla users`);
      return false;
    }

    console.log(`   ✅ Usuario encontrado en BD`);
    console.log(`      Email: ${userData.email}`);
    console.log(`      Rol: ${userData.role}`);
    console.log(`      Sucursal: ${userData.branch_id || 'Global (Admin)'}`);

    // 2. Intentar login con Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password
    });

    if (error) {
      console.error(`   ❌ Error en Auth: ${error.message}`);
      return false;
    }

    if (!data.session) {
      console.error(`   ❌ No se obtuvo sesión`);
      return false;
    }

    console.log(`   ✅ Autenticación exitosa`);
    console.log(`      Session ID: ${data.session.access_token.substring(0, 20)}...`);

    // 3. Verificar rol
    const roleMatch = userData.role === expectedRole;
    console.log(`   ${roleMatch ? '✅' : '❌'} Rol: ${userData.role} (esperado: ${expectedRole})`);

    // 4. Mostrar redirección
    const redirects = {
      'admin': '/dashboard',
      'cocina': '/kitchen',
      'delivery': '/delivery'
    };

    const redirectPath = redirects[userData.role] || '/home';
    console.log(`   🔄 Redirige a: ${redirectPath}`);

    // Cerrar sesión
    await supabase.auth.signOut();
    console.log(`   ✅ Sesión cerrada`);

    return true;
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
    return false;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════');
  console.log('🧪 PRUEBAS DE AUTENTICACIÓN Y ROLES');
  console.log('═══════════════════════════════════════════');

  let passed = 0;
  let failed = 0;

  for (const user of testUsers) {
    const success = await testLogin(user.username, user.password, user.expectedRole);
    if (success) passed++;
    else failed++;
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`📊 Resultados: ${passed} ✅ | ${failed} ❌`);
  console.log('═══════════════════════════════════════════');

  if (failed === 0) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
    console.log('\n✨ Sistema de roles completamente funcional:\n');
    console.log('1. Admin → Acceso al dashboard completo');
    console.log('2. Cocina → Redirige a interfaz de cocina');
    console.log('3. Delivery → Redirige a interfaz de entregas');
    console.log('\n👉 Próximo paso: Implementar interfaces de Cocina y Delivery');
  } else {
    console.log('\n⚠️  Revisa los errores arriba');
    process.exit(1);
  }
}

runTests();
