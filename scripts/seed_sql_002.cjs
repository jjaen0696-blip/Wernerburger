/*
  Script para seedear datos equivalentes a sql/002_seed.sql en Supabase.
  Uso:
    SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed_sql_002.cjs
*/
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  console.log('Seed de sql/002_seed.sql - comenzando');

  const branches = [
    { id: 'branch-1', name: 'Werner Burguer - Centro', address: 'Av. Principal 123' },
    { id: 'branch-2', name: 'Werner Burguer - Norte', address: 'Calle Secundaria 45' }
  ];
  const roles = [
    { id: 1, name: 'super_admin', description: 'Acceso total' },
    { id: 2, name: 'admin', description: 'Administrador de sucursal' },
    { id: 3, name: 'cocina', description: 'Usuario cocina' },
    { id: 4, name: 'delivery', description: 'Usuario delivery' },
    { id: 5, name: 'caja', description: 'Usuario caja' },
    { id: 6, name: 'inventario', description: 'Usuario inventario' }
  ];
  const permissions = [
    { id: 1, name: 'view_dashboard', description: 'Ver dashboard' },
    { id: 2, name: 'manage_inventory', description: 'Gestionar inventario' },
    { id: 3, name: 'process_sales', description: 'Procesar ventas' },
    { id: 4, name: 'manage_recipes', description: 'Gestionar recetas' },
    { id: 5, name: 'view_reports', description: 'Ver reportes' },
    { id: 6, name: 'manage_users', description: 'Gestionar usuarios' }
  ];
  const rolePermissions = [
    { role_id: 1, permission_id: 1 },
    { role_id: 1, permission_id: 2 },
    { role_id: 1, permission_id: 3 },
    { role_id: 1, permission_id: 4 },
    { role_id: 1, permission_id: 5 },
    { role_id: 1, permission_id: 6 },
    { role_id: 2, permission_id: 1 },
    { role_id: 2, permission_id: 2 },
    { role_id: 2, permission_id: 3 },
    { role_id: 2, permission_id: 4 },
    { role_id: 2, permission_id: 5 },
    { role_id: 3, permission_id: 3 },
    { role_id: 4, permission_id: 5 },
    { role_id: 5, permission_id: 3 },
    { role_id: 6, permission_id: 2 }
  ];
  const users = [
    { id: 'user-1', email: 'admin@werner.local', username: 'admin', password_hash: 'fisura-placeholder-hash' }
  ];
  const ingredients = [
    { id: 'ing-1', name: 'Pan', category: 'Panadería', unit: 'unidad' },
    { id: 'ing-2', name: 'Carne', category: 'Proteínas', unit: 'gramos' },
    { id: 'ing-3', name: 'Queso', category: 'Lácteos', unit: 'unidad' },
    { id: 'ing-4', name: 'Salsa', category: 'Condimentos', unit: 'gramos' },
    { id: 'ing-5', name: 'Lechuga', category: 'Vegetales', unit: 'gramos' },
    { id: 'ing-6', name: 'Tomate', category: 'Vegetales', unit: 'rodajas' }
  ];
  const products = [
    { id: 'prod-1', name: 'Hamburguesa Clásica', sku: 'HB-CLASSIC', price: 7.5, description: 'Pan, carne, queso, salsa y vegetales' }
  ];
  const recipes = [
    { id: 'recipe-1', product_id: 'prod-1' }
  ];
  const recipeItems = [
    { id: 'ri-1', recipe_id: 'recipe-1', ingredient_id: 'ing-1', quantity: 1, unit: 'unidad' },
    { id: 'ri-2', recipe_id: 'recipe-1', ingredient_id: 'ing-2', quantity: 150, unit: 'gramos' },
    { id: 'ri-3', recipe_id: 'recipe-1', ingredient_id: 'ing-3', quantity: 1, unit: 'unidad' },
    { id: 'ri-4', recipe_id: 'recipe-1', ingredient_id: 'ing-4', quantity: 20, unit: 'gramos' },
    { id: 'ri-5', recipe_id: 'recipe-1', ingredient_id: 'ing-5', quantity: 15, unit: 'gramos' }
  ];
  const inventory = ingredients.map((ingredient) => {
    let qty = 100;
    if (ingredient.name === 'Carne') qty = 5000;
    if (ingredient.name === 'Pan') qty = 100;
    if (ingredient.name === 'Queso') qty = 50;
    if (ingredient.name === 'Salsa') qty = 2000;
    if (ingredient.name === 'Lechuga') qty = 1000;

    return {
      branch_id: 'branch-1',
      ingredient_id: ingredient.id,
      quantity: qty,
      unit: ingredient.unit,
      min_stock: 10
    };
  });

  for (const row of branches) {
    const { error } = await supabase.from('branches').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const row of roles) {
    const { error } = await supabase.from('roles').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const row of permissions) {
    const { error } = await supabase.from('permissions').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const row of rolePermissions) {
    const { error } = await supabase.from('role_permissions').upsert(row, { onConflict: ['role_id', 'permission_id'] });
    if (error) throw error;
  }

  for (const row of users) {
    const { error } = await supabase.from('users').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const row of ingredients) {
    const { error } = await supabase.from('ingredients').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const row of products) {
    const { error } = await supabase.from('products').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const row of recipes) {
    const { error } = await supabase.from('recipes').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  for (const row of recipeItems) {
    const { error } = await supabase.from('recipe_items').upsert(row, { onConflict: 'id' });
    if (error) throw error;
  }

  const { error: invError } = await supabase.from('inventory').upsert(inventory, { onConflict: ['branch_id', 'ingredient_id'] });
  if (invError) throw invError;

  console.log('Seed sql/002_seed.sql completado.');
}

main().catch((err) => {
  console.error('Error en seed_sql_002:', err.message || err);
  process.exit(1);
});
