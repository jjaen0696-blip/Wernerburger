import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yelkwbdxncitagmnnxat.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  console.log('🔍 Verificando configuración...\n');

  try {
    // 1. Verificar que existan las columnas
    console.log('1️⃣  Verificando columnas en tabla users...');
    const { data: columns, error: colError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (colError) {
      console.error('❌ Error:', colError.message);
      return;
    }

    if (!columns || columns.length === 0) {
      console.log('⚠️  Tabla vacía, se pueden crear usuarios');
    } else {
      const firstUser = columns[0];
      const hasRole = 'role' in firstUser;
      const hasBranchId = 'branch_id' in firstUser;

      console.log(`✅ role column: ${hasRole ? '✓' : '✗'}`);
      console.log(`✅ branch_id column: ${hasBranchId ? '✓' : '✗'}`);

      if (!hasRole || !hasBranchId) {
        console.error('\n❌ Falta ejecutar el SQL en Supabase. Columnas no existen.');
        return;
      }
    }

    // 2. Verificar usuarios en users table
    console.log('\n2️⃣  Verificando usuarios en tabla users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('username, email, role, branch_id')
      .order('username');

    if (usersError) {
      console.error('❌ Error:', usersError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️  Tabla users vacía, se van a crear los usuarios');
    } else {
      console.log(`✅ Usuarios encontrados: ${users.length}`);
      users.forEach(u => {
        console.log(`   - ${u.username}: role=${u.role || 'NULL'}, branch=${u.branch_id || 'NULL'}`);
      });
    }

    // 3. Verificar que existan ramas
    console.log('\n3️⃣  Verificando ramas (branches)...');
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name')
      .limit(5);

    if (branchError) {
      console.error('❌ Error:', branchError.message);
      return;
    }

    if (!branches || branches.length === 0) {
      console.error('❌ No hay ramas configuradas');
      return;
    }

    console.log(`✅ Ramas encontradas: ${branches.length}`);
    branches.forEach(b => {
      console.log(`   - ${b.name}`);
    });

    console.log('\n✅ ¡Configuración lista! Puedes ejecutar: node setup-roles.mjs');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

verify();
