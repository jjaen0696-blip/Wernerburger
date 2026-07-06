/*
  Script para seedear branches, ingredients, recipes, recipe_items e inventory en Supabase.
  Uso:
    SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed_inventory.js

  Requiere: npm install @supabase/supabase-js
*/
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  const menuFile = path.join(__dirname, 'menuData.json');
  const menu = JSON.parse(fs.readFileSync(menuFile, 'utf8'));

  console.log('Creando sucursal de ejemplo...');
  let { data: branch, error: errBranch } = await supabase.from('branches').insert({ name: 'Sucursal Principal', address: 'Dirección de ejemplo' }).select().single();
  if (errBranch) {
    console.error('Error creando branch', errBranch);
    process.exit(1);
  }

  const branchId = branch.id;

  console.log('Insertando proveedores de ejemplo...');
  await supabase.from('suppliers').upsert([{ name: 'Proveedor Local' }], { onConflict: 'name' });

  // Ingredientes base
  const ingredients = [
    { name: 'Pan', unit: 'unit', category: 'pan' },
    { name: 'Carne', unit: 'kg', category: 'carne' },
    { name: 'Queso', unit: 'unit', category: 'lacteo' },
    { name: 'Bacon', unit: 'unit', category: 'carne' },
    { name: 'Piña', unit: 'unit', category: 'fruta' },
    { name: 'Pollo', unit: 'kg', category: 'carne' },
    { name: 'Papas', unit: 'kg', category: 'verdura' },
    { name: 'Bebida', unit: 'unit', category: 'bebida' },
    { name: 'Arepa Masa', unit: 'unit', category: 'masa' },
    { name: 'Salchicha', unit: 'unit', category: 'carne' }
  ];

  console.log('Insertando ingredientes...');
  const { data: insertedIngredients, error: errIng } = await supabase.from('ingredients').insert(ingredients).select();
  if (errIng) {
    console.error('Error insertando ingredients', errIng);
    process.exit(1);
  }

  // Build map name -> id
  const ingRows = await supabase.from('ingredients').select('id,name');
  const ingMap = {};
  if (ingRows.data) ingRows.data.forEach(r => { ingMap[r.name] = r.id; });

  // Upsert productos (usa ids del JSON si existen)
  console.log('Upsert productos desde menuData.json...');
  for (const it of menu) {
    const payload = {
      id: it.id,
      name: it.name,
      price: it.price,
      description: it.description,
      // sku omitted, active default true
    };
    const { data: prod, error: errProd } = await supabase.from('products').upsert(payload).select().single();
    if (errProd) {
      console.error('Error upserting product', it.id, errProd);
      continue;
    }

    // Crear receta para el producto
    const { data: recipe, error: errRecipe } = await supabase.from('recipes').insert({ product_id: prod.id }).select().single();
    if (errRecipe) {
      console.error('Error creando recipe for', prod.id, errRecipe);
      continue;
    }

    // Build recipe items basados en categoría
    const items = [];
    const cat = it.category || '';
    if (cat.includes('hamburguesas')) {
      if (ingMap['Pan']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Pan'], quantity: 1, unit: 'unit' });
      if (ingMap['Carne']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Carne'], quantity: 0.25, unit: 'kg' });
      if (ingMap['Queso']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Queso'], quantity: 1, unit: 'unit' });
    } else if (cat.includes('hotdogs')) {
      if (ingMap['Pan']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Pan'], quantity: 1, unit: 'unit' });
      if (ingMap['Salchicha']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Salchicha'], quantity: 1, unit: 'unit' });
      if (it.name.toLowerCase().includes('hawaiano') && ingMap['Piña']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Piña'], quantity: 0.5, unit: 'unit' });
    } else if (cat.includes('arepas')) {
      if (ingMap['Arepa Masa']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Arepa Masa'], quantity: 1, unit: 'unit' });
      if (it.name.toLowerCase().includes('pollo') && ingMap['Pollo']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Pollo'], quantity: 0.2, unit: 'kg' });
    } else if (cat.includes('salchipapas')) {
      if (ingMap['Papas']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Papas'], quantity: 0.25, unit: 'kg' });
      if (ingMap['Salchicha']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Salchicha'], quantity: 1, unit: 'unit' });
    } else if (cat.includes('extras') || cat.includes('bebida')) {
      if (ingMap['Bebida']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Bebida'], quantity: 1, unit: 'unit' });
    } else if (cat.includes('pepitos')) {
      if (ingMap['Pan']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Pan'], quantity: 1, unit: 'unit' });
      if (ingMap['Carne']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Carne'], quantity: 0.2, unit: 'kg' });
    } else {
      // fallback: one unit of bread
      if (ingMap['Pan']) items.push({ recipe_id: recipe.id, ingredient_id: ingMap['Pan'], quantity: 1, unit: 'unit' });
    }

    if (items.length > 0) {
      const { data: ris, error: errRI } = await supabase.from('recipe_items').insert(items).select();
      if (errRI) console.error('Error insert recipe_items for', prod.id, errRI);
    }
  }

  // Insert inventory inicial para la sucursal
  console.log('Insertando inventario inicial...');
  const inventoryItems = [];
  for (const name of Object.keys(ingMap)) {
    const qty = name === 'Carne' || name === 'Pollo' ? 50 : 100;
    inventoryItems.push({ branch_id: branchId, ingredient_id: ingMap[name], quantity: qty, unit: ingredients.find(i => i.name === name)?.unit || 'unit', min_stock: 5 });
  }

  const { data: invData, error: errInv } = await supabase.from('inventory').upsert(inventoryItems, { onConflict: 'branch_id,ingredient_id' }).select();
  if (errInv) console.error('Error upserting inventory', errInv);

  console.log('Seed de inventario completado. Revisa tablas: branches, ingredients, products, recipes, recipe_items, inventory.');
}

main().catch(e => { console.error(e); process.exit(1); });
