import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yelkwbdxncitagmnnxat.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllbGt3YmR4bmNpdGFnbW5ueGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyOTQ1MTEsImV4cCI6MjA5ODg3MDUxMX0.1NXXD_McJeXgB9eVjuXblAongjzO-nYz99hlBOfYepI";

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function debug() {
  console.log('🔍 Debugando tabla users...\n');
  
  try {
    // Obtener todos los usuarios
    console.log('1️⃣  Listando todos los usuarios...');
    const { data: allUsers, error: allError } = await supabase
      .from('users')
      .select('*');
    
    if (allError) {
      console.error('❌ Error:', allError.message);
      return;
    }
    
    console.log(`   Total: ${allUsers?.length} usuarios\n`);
    allUsers?.forEach(u => {
      console.log(`   ID: ${u.id}`);
      console.log(`   Username: ${u.username}`);
      console.log(`   Email: ${u.email}`);
      console.log('');
    });
    
    // Buscar adminSin .single()
    console.log('2️⃣  Buscando username="admin" (sin .single)...');
    const { data: adminUsers, error: searchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin');
    
    if (searchError) {
      console.error('❌ Error:', searchError.message);
    } else {
      console.log(`   Encontrados: ${adminUsers?.length}`);
      adminUsers?.forEach(u => console.log(`   - ${u.username}: ${u.email}`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debug();
