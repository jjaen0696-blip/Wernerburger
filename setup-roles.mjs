import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yelkwbdxncitagmnnxat.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbGt3YmR4bmNpdGFnbW5ueGF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI5NDUxMSwiZXhwIjoyMDk4ODcwNTExfQ.Sr3WP5lSmSYoe8xFCVtHAD7mu5Ytwwdv5y9DLKm-u8k";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function setupRolesAndUsers() {
  console.log('⚙️  Configurando sistema de roles y usuarios...\n');
  
  try {
    // 1. Actualizar tabla users con campos de rol
    console.log('1️⃣  Verificando estructura de tabla users...');
    console.log('   ℹ️  Asegúrate de que existan columnas role y branch_id');
    
    // 2. Obtener o crear sucursales
    console.log('\n2️⃣  Verificando sucursales...');
    const { data: branches } = await supabase
      .from('branches')
      .select('*')
      .limit(5);
    
    console.log(`   Encontradas ${branches?.length || 0} sucursales`);
    
    // 3. Actualizar usuario admin
    console.log('\n3️⃣  Actualizando usuario admin...');
    const { data: adminUser } = await supabase
      .from('users')
      .select('id, email, username')
      .eq('username', 'admin')
      .single();
    
    if (adminUser) {
      const { error: updateAdminError } = await supabase
        .from('users')
        .update({ role: 'admin', branch_id: null })
        .eq('id', adminUser.id);
      
      if (updateAdminError) {
        console.error('   ❌ Error:', updateAdminError.message);
      } else {
        console.log('   ✅ Admin actualizado');
      }
    }
    
    // 4. Crear usuario de Cocina
    console.log('\n4️⃣  Creando usuario de Cocina...');
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    let kitchenUser = authUsers.find(u => u.email === 'cocina@wernerburger.com');
    
    if (!kitchenUser) {
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'cocina@wernerburger.com',
        password: 'Cocina123!',
        email_confirm: true,
        user_metadata: {
          username: 'cocina',
          role: 'cocina'
        }
      });
      
      if (authError) {
        console.error('   ❌ Error:', authError.message);
      } else {
        kitchenUser = newAuthUser.user;
        console.log('   ✅ Usuario creado:', newAuthUser.user?.email);
      }
    } else {
      console.log('   ℹ️  Usuario ya existe');
    }
    
    // Insertar en tabla users
    if (kitchenUser) {
      const { error: insertError } = await supabase
        .from('users')
        .upsert([{
          id: kitchenUser.id,
          username: 'cocina',
          email: 'cocina@wernerburger.com',
          role: 'cocina',
          branch_id: branches?.[0]?.id || null
        }], { onConflict: 'id' });
      
      if (insertError) {
        console.error('   ❌ Error al insertar:', insertError.message);
      } else {
        console.log('   ✅ Insertado en tabla users');
      }
    }
    
    // 5. Crear usuario de Delivery
    console.log('\n5️⃣  Creando usuario de Delivery...');
    let deliveryUser = authUsers.find(u => u.email === 'delivery@wernerburger.com');
    
    if (!deliveryUser) {
      const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
        email: 'delivery@wernerburger.com',
        password: 'Delivery123!',
        email_confirm: true,
        user_metadata: {
          username: 'delivery',
          role: 'delivery'
        }
      });
      
      if (authError) {
        console.error('   ❌ Error:', authError.message);
      } else {
        deliveryUser = newAuthUser.user;
        console.log('   ✅ Usuario creado:', newAuthUser.user?.email);
      }
    } else {
      console.log('   ℹ️  Usuario ya existe');
    }
    
    // Insertar en tabla users
    if (deliveryUser) {
      const { error: insertError } = await supabase
        .from('users')
        .upsert([{
          id: deliveryUser.id,
          username: 'delivery',
          email: 'delivery@wernerburger.com',
          role: 'delivery',
          branch_id: branches?.[0]?.id || null
        }], { onConflict: 'id' });
      
      if (insertError) {
        console.error('   ❌ Error al insertar:', insertError.message);
      } else {
        console.log('   ✅ Insertado en tabla users');
      }
    }
    
    // 6. Listar usuarios finales
    console.log('\n6️⃣  Usuarios configurados:');
    const { data: allUsers } = await supabase
      .from('users')
      .select('username, email, role, branch_id');
    
    allUsers?.forEach(u => {
      console.log(`   - ${u.username}: ${u.email} (${u.role})`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✨ SISTEMA DE ROLES CONFIGURADO');
    console.log('='.repeat(60));
    console.log('\n📝 Usuarios disponibles:\n');
    console.log('   🔑 ADMIN');
    console.log('      Username: admin');
    console.log('      Password: Admin123!');
    console.log('      Acceso: Panel completo\n');
    console.log('   👨‍🍳 COCINA');
    console.log('      Username: cocina');
    console.log('      Password: Cocina123!');
    console.log('      Acceso: Interfaz de cocina\n');
    console.log('   🚚 DELIVERY');
    console.log('      Username: delivery');
    console.log('      Password: Delivery123!');
    console.log('      Acceso: Interfaz de entregas\n');
    
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : 'desconocido');
  }
}

setupRolesAndUsers();
