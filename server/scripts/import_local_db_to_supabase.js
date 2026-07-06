#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltan variables de entorno. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const REST_BASE = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1';
const REST_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation'
};

async function restFindOneBy(table, column, value) {
  const qs = `${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}&select=id,${encodeURIComponent(column)}`;
  const url = `${REST_BASE}/${table}?${qs}`;
  const res = await fetch(url, { headers: REST_HEADERS });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST lookup ${table} failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data && data.length ? data[0] : null;
}

async function restInsertOne(table, payload) {
  const url = `${REST_BASE}/${table}`;
  const res = await fetch(url, { method: 'POST', headers: REST_HEADERS, body: JSON.stringify(payload) });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`REST insert ${table} failed: ${res.status} ${text}`);
    err.response = text;
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  if (!data || data.length === 0) {
    console.warn(`REST insert ${table} returned empty data`, { table, payload, data });
    return null;
  }
  return data[0];
}

async function restUpdateWhere(table, where, payload) {
  const url = `${REST_BASE}/${table}?${where}`;
  const res = await fetch(url, { method: 'PATCH', headers: REST_HEADERS, body: JSON.stringify(payload) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST update ${table} failed: ${res.status} ${text}`);
  }
  return await res.json();
}

// Composite lookup helper: params is object {col: val}
async function restFindOneByComposite(table, params) {
  // build query ignoring null/undefined params
  const entries = Object.entries(params).filter(([k, v]) => v !== null && v !== undefined);
  if (entries.length === 0) return null;
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=eq.${encodeURIComponent(v)}`).join('&') + '&select=id';
  const url = `${REST_BASE}/${table}?${qs}`;
  const res = await fetch(url, { headers: REST_HEADERS });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST lookup composite ${table} failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data && data.length ? data[0] : null;
}

async function insertOneViaSupabase(table, payload) {
  const res = await supabase.from(table).insert(payload).select();
  const { data, error } = res;
  if (error) {
    console.error('Supabase insert error:', error, { table, payload });
    throw error;
  }
  if (!data || data.length === 0) {
    console.warn('Supabase insert returned no rows', { table, payload, res });
    return null;
  }
  return data[0];
}

function readLocalDb() {
  const p = path.join(__dirname, '..', 'data', 'local_db.json');
  if (!fs.existsSync(p)) {
    console.error('No se encontró server/data/local_db.json en la ruta esperada:', p);
    process.exit(1);
  }
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function isUUID(s) { return typeof s === 'string' && uuidRegex.test(s); }

async function upsertAndReturn(table, rows, onConflict) {
  if (!rows || rows.length === 0) return [];
  console.log(`Upserting ${rows.length} rows into ${table}...`);
  const opts = {};
  if (onConflict) opts.onConflict = onConflict;
  opts.returning = 'representation';
  // Use .select() to ensure Supabase client returns inserted/updated rows
  const res = await supabase.from(table).upsert(rows, opts).select();
  const { data, error } = res;
  if (error) {
    console.error(`Error upserting ${table}:`, error);
    throw error;
  }
  if (!data || data.length === 0) {
    console.warn(`Upsert ${table} returned no rows`, { table, rows, res });
    // If the client returned no rows, but HTTP response indicates success, log it for debugging
    return [];
  }
  return data;
}

async function insertAndReturn(table, rows) {
  if (!rows || rows.length === 0) return [];
  console.log(`Inserting ${rows.length} rows into ${table}...`);
  const { data, error } = await supabase.from(table).insert(rows).select();
  if (error) console.error(`Error inserting ${table}:`, error.message || error);
  return data || [];
}

(async () => {
  try {
    const db = readLocalDb();

    const stats = {
      tables: {
        branches: { source:0, inserted:0, existing:0, omitted:0, finalMapSize:0 },
        ingredients: { source:0, inserted:0, existing:0, omitted:0, finalMapSize:0 },
        products: { source:0, inserted:0, existing:0, omitted:0, finalMapSize:0 },
        users: { source:0, inserted:0, existing:0, omitted:0, finalMapSize:0 },
        orders: { source:0, inserted:0, existing:0, omitted:0, finalMapSize:0 },
        purchases: { source:0, inserted:0, existing:0, omitted:0, finalMapSize:0 }
      },
      inserted: { recipe_items:0, inventory:0, order_items:0, purchase_items:0 },
      updated: { users:0, inventory:0 },
      skipped: { duplicates:0, missing_parent:0 },
      errors: []
    };

    function logError(table, item, err) {
      console.error(`ERR [${table}]`, err && err.message ? err.message : err, item && item.id ? `id=${item.id}` : '');
      stats.errors.push({ table, item, error: err && err.message ? err.message : String(err) });
    }

    // Maps from original ids (as in local_db.json) to new UUIDs in Supabase
    const branchMap = {}; // origId -> newId
    const productMap = {};
    const ingredientMap = {};
    const userMap = {};

    // 1) Branches: find by name or insert
    stats.tables.branches.source = db.branches ? db.branches.length : 0;
    if (db.branches && db.branches.length) {
      for (const b of db.branches) {
        try {
          const found = await restFindOneBy('branches', 'name', b.name);
          if (found) { branchMap[b.id] = found.id; stats.tables.branches.existing++; continue; }
          const ins = await restInsertOne('branches', { name: b.name, address: b.address || null, is_closed: !!b.is_closed });
          if (ins) { branchMap[b.id] = ins.id; stats.tables.branches.inserted++; }
        } catch (err) {
          logError('branches', b, err);
          stats.tables.branches.omitted++;
        }
      }
      stats.tables.branches.finalMapSize = Object.keys(branchMap).length;
    }

    // 2) Ingredients: find by name or insert
    stats.tables.ingredients.source = db.ingredients ? db.ingredients.length : 0;
    if (db.ingredients && db.ingredients.length) {
      for (const ing of db.ingredients) {
        try {
          const found = await restFindOneBy('ingredients', 'name', ing.name);
          if (found) { ingredientMap[ing.id] = found.id; stats.tables.ingredients.existing++; continue; }
          const ins = await restInsertOne('ingredients', { name: ing.name, unit: ing.unit || null });
          if (ins) { ingredientMap[ing.id] = ins.id; stats.tables.ingredients.inserted++; }
        } catch (err) {
          logError('ingredients', ing, err);
          stats.tables.ingredients.omitted++;
        }
      }
      stats.tables.ingredients.finalMapSize = Object.keys(ingredientMap).length;
    }

    // 3) Products: find by name or insert
    stats.tables.products.source = db.products ? db.products.length : 0;
    if (db.products && db.products.length) {
      for (const p of db.products) {
        try {
          const found = await restFindOneBy('products', 'name', p.name);
          if (found) { productMap[p.id] = found.id; stats.tables.products.existing++; continue; }
          const ins = await restInsertOne('products', { name: p.name, price: p.price || 0 });
          if (ins) { productMap[p.id] = ins.id; stats.tables.products.inserted++; }
        } catch (err) {
          logError('products', p, err);
          stats.tables.products.omitted++;
        }
      }
      stats.tables.products.finalMapSize = Object.keys(productMap).length;
    }

    // 4) Users: find by username or insert/update
    stats.tables.users.source = db.users ? db.users.length : 0;
    if (db.users && db.users.length) {
      for (const u of db.users) {
        try {
          const branch_id = u.branch_id && branchMap[u.branch_id] ? branchMap[u.branch_id] : null;
          const found = await restFindOneBy('app_users', 'username', u.username);
          if (found) {
            try {
              await restUpdateWhere('app_users', `username=eq.${encodeURIComponent(u.username)}`, { email: u.email || null, password_hash: u.password_hash || null, role: u.role || 'manager', branch_id });
            } catch (ue) { console.error('Error updating user', u.username, ue.message || ue); }
            userMap[u.id] = found.id;
            stats.updated.users++;
            stats.tables.users.existing++;
            continue;
          }
          const ins = await restInsertOne('app_users', { username: u.username, email: u.email || null, password_hash: u.password_hash || null, role: u.role || 'manager', branch_id });
          if (ins) { userMap[u.id] = ins.id; stats.tables.users.inserted++; }
        } catch (err) {
          logError('users', u, err);
          stats.tables.users.omitted++;
        }
      }
      stats.tables.users.finalMapSize = Object.keys(userMap).length;
    }

    // Report maps after initial parents insertion
    console.log('\nParent maps summary:');
    console.log('branches mapped:', Object.keys(branchMap).length, JSON.stringify(stats.tables.branches));
    console.log('products mapped:', Object.keys(productMap).length, JSON.stringify(stats.tables.products));
    console.log('ingredients mapped:', Object.keys(ingredientMap).length, JSON.stringify(stats.tables.ingredients));
    console.log('users mapped:', Object.keys(userMap).length, JSON.stringify(stats.tables.users));
    // show samples
    console.log('branchMap sample:', Object.entries(branchMap).slice(0,5));
    console.log('productMap sample:', Object.entries(productMap).slice(0,5));
    console.log('ingredientMap sample:', Object.entries(ingredientMap).slice(0,5));
    console.log('userMap sample:', Object.entries(userMap).slice(0,5));

    // helper to resolve id maps
    function resolve(map, origId, fallbackNameField, origArray) {
      if (!origId) return null;
      if (isUUID(origId)) return origId;
      if (map[origId]) return map[origId];
      // try to find by name in original array
      if (fallbackNameField && origArray) {
        const match = origArray.find(x => x.id === origId || x[fallbackNameField] === origId);
        if (match && match.name) {
          // not guaranteed mapped, but attempt
          const mapped = (Object.values(map).find(id => id && id === match.id));
          return mapped || null;
        }
      }
      return null;
    }

    // 5) Recipe items: map product_id and ingredient_id
    if (db.recipe_items && db.recipe_items.length) {
      for (const ri of db.recipe_items) {
        const product_id = resolve(productMap, ri.product_id, 'name', db.products);
        const ingredient_id = resolve(ingredientMap, ri.ingredient_id, 'name', db.ingredients);
        if (!product_id || !ingredient_id) { console.warn('Skipping recipe_item due missing mapping', ri); stats.skipped.missing_parent++; continue; }
        try {
          // idempotent: try find existing by product+ingredient
          const existing = await restFindOneByComposite('app_recipe_items', { product_id, ingredient_id });
          if (existing) { stats.skipped.duplicates++; continue; }
          const ins = await restInsertOne('app_recipe_items', { product_id, ingredient_id, quantity: ri.qty != null ? ri.qty : (ri.quantity != null ? ri.quantity : 0), unit: ri.unit || '' });
          if (ins) stats.inserted.recipe_items++;
        } catch (e) { logError('app_recipe_items', ri, e); }
      }
    }

    // 6) Inventory
    if (db.inventory && db.inventory.length) {
      // Deduplicate by branch+ingredient: aggregate quantities and pick unit
      console.log('Building inventory aggregation for', db.inventory.length, 'rows');
      const invMap = {};
      for (const inv of db.inventory) {
        // Strict mapping: use only mapped Supabase IDs from branchMap/ingredientMap
        const mapped_branch = branchMap[inv.branch_id] || null;
        const mapped_ingredient = ingredientMap[inv.ingredient_id] || null;
        if (!mapped_branch || !mapped_ingredient) {
          console.warn('Skipping inventory row due missing mapping', inv);
          console.warn('branchMap lookup for', inv.branch_id, branchMap[inv.branch_id], 'ingredientMap lookup for', inv.ingredient_id, ingredientMap[inv.ingredient_id]);
          stats.skipped.missing_parent++;
          continue;
        }
        const key = `${mapped_branch}::${mapped_ingredient}`;
        const qty = Number(inv.qty != null ? inv.qty : (inv.quantity != null ? inv.quantity : 0)) || 0;
        const unit = inv.unit || '';
        if (!invMap[key]) invMap[key] = { branch_id: mapped_branch, ingredient_id: mapped_ingredient, quantity: 0, unit };
        invMap[key].quantity += qty;
        if (!invMap[key].unit && unit) invMap[key].unit = unit;
      }
      const rows = Object.values(invMap);
      console.log('Inventory aggregated into', rows.length, 'unique branch+ingredient rows');
      if (rows.length) {
        try {
          // Log final payloads before upsert to confirm mapping
          console.log('Inventory upsert payload sample:', JSON.stringify(rows.slice(0, 10), null, 2));
          const upserted = await upsertAndReturn('inventory', rows, 'branch_id,ingredient_id');
          stats.inserted.inventory += (upserted && upserted.length) ? upserted.length : 0;
          if (upserted && upserted.length) console.log('Inventory upsert returned', upserted.length, 'rows');
        } catch (e) { logError('inventory', { payload: rows.slice(0,10) }, e); }
      }
    }

    // 7) Orders and order_items
    stats.tables.orders.source = db.orders ? db.orders.length : 0;
    if (db.orders && db.orders.length) {
      // Insert orders one-by-one to ensure mapping and idempotency
      const orderIdMap = {}; // orig -> new
      if (db.orders && db.orders.length) {
        for (const o of db.orders) {
          const branch_id = resolve(branchMap, o.branch_id, 'name', db.branches);
          if (!branch_id) { console.warn('Skipping order due missing branch mapping', o); console.warn('branchMap lookup for', o.branch_id, branchMap[o.branch_id]); stats.skipped.missing_parent++; continue; }
          const payload = { branch_id, status: o.status || 'pending', customer_name: o.customer_name || null, phone: o.phone || null, address: o.address || null, delivery_type: o.delivery_type || null, payment_method: o.payment_method || null, total: o.total || 0, created_at: o.created_at || null };
          try {
            // try to find existing by branch+total+created_at
            const exist = await restFindOneByComposite('orders', { branch_id, total: payload.total, created_at: payload.created_at });
            if (exist) { orderIdMap[o.id] = exist.id; stats.skipped.duplicates++; stats.tables.orders.existing++; console.log('Order exists -> mapping', o.id, '=>', exist.id); continue; }
            const inserted = await insertOneViaSupabase('orders', payload);
            if (inserted && inserted.id) { orderIdMap[o.id] = inserted.id; stats.tables.orders.inserted++; } else { stats.errors.push({ table:'orders', item:o, error:'no id after insert' }); }
          } catch (e) { console.error('Error inserting order', e.message || e); stats.errors.push({ table:'orders', item:o, error: e.message || e }); }
        }
      }
      // record final map size for orders
      stats.tables.orders.finalMapSize = Object.keys(orderIdMap).length;

      // Now insert order_items referencing only existing orders
      if (db.order_items && db.order_items.length) {
        for (const oi of db.order_items) {
          // Map product and order IDs to Supabase UUIDs
          const product_id = resolve(productMap, oi.product_id, 'name', db.products);
          if (!product_id) { console.warn('Skipping order_item missing product mapping', oi); console.warn('productMap lookup for', oi.product_id, productMap[oi.product_id]); stats.skipped.missing_parent++; continue; }
          // Strict mapping: only accept mapped order IDs (do not accept original UUIDs)
          const order_id = orderIdMap[oi.order_id] || null;
          if (!order_id) { console.warn('Skipping order_item missing order mapping', oi); console.warn('orderIdMap lookup for', oi.order_id, orderIdMap[oi.order_id]); stats.skipped.missing_parent++; continue; }
          try {
            // build payload using mapped IDs only
            const payload = { order_id, product_id, quantity: oi.qty != null ? oi.qty : 1, unit_price: oi.unit_price != null ? oi.unit_price : null };
            console.log('Order item insert payload:', JSON.stringify(payload));
            const exist = await restFindOneByComposite('app_order_items', { order_id: payload.order_id, product_id: payload.product_id });
            if (exist) { stats.skipped.duplicates++; continue; }
            const ins = await restInsertOne('app_order_items', payload);
            if (ins) stats.inserted.order_items++;
          } catch (e) { logError('app_order_items', payload, e); }
        }
      }
    }

    // 8) Purchases and purchase_items
    stats.tables.purchases.source = db.purchases ? db.purchases.length : 0;
    if (db.purchases && db.purchases.length) {
      // Insert purchases one-by-one and track mapping
      const purchaseIdMap = {};
      if (db.purchases && db.purchases.length) {
        for (const p of db.purchases) {
          const branch_id = resolve(branchMap, p.branch_id, 'name', db.branches);
          const user_id = resolve(userMap, p.user_id, 'username', db.users);
          if (!branch_id) { console.warn('Skipping purchase missing branch', p); console.warn('branchMap lookup for', p.branch_id, branchMap[p.branch_id]); stats.skipped.missing_parent++; continue; }
          const payload = { branch_id, user_id: user_id || null, total: p.total || 0, created_at: p.created_at || null };
          try {
            const exist = await restFindOneByComposite('purchases', { branch_id, total: payload.total, created_at: payload.created_at });
            if (exist) { purchaseIdMap[p.id] = exist.id; stats.skipped.duplicates++; stats.tables.purchases.existing++; console.log('Purchase exists -> mapping', p.id, '=>', exist.id); continue; }
            const inserted = await insertOneViaSupabase('purchases', payload);
            if (inserted && inserted.id) { purchaseIdMap[p.id] = inserted.id; stats.tables.purchases.inserted++; } else { stats.errors.push({ table:'purchases', item:p, error:'no id after insert' }); }
          } catch (e) { console.error('Error inserting purchase', e.message || e); stats.errors.push({ table:'purchases', item:p, error: e.message || e }); }
        }
      }
      // record final map size for purchases
      stats.tables.purchases.finalMapSize = Object.keys(purchaseIdMap).length;

      // Now insert purchase_items referencing existing purchases
      if (db.purchase_items && db.purchase_items.length) {
        for (const pi of db.purchase_items) {
          // Map ingredient and purchase IDs to Supabase UUIDs (strict: use map values only)
          const ingredient_id = ingredientMap[pi.ingredient_id] || null;
          if (!ingredient_id) { console.warn('Skipping purchase_item missing ingredient mapping', pi); console.warn('ingredientMap lookup for', pi.ingredient_id, ingredientMap[pi.ingredient_id]); stats.skipped.missing_parent++; continue; }
          const purchase_id = purchaseIdMap[pi.purchase_id] || null;
          if (!purchase_id) { console.warn('Skipping purchase_item missing purchase mapping', pi); console.warn('purchaseIdMap lookup for', pi.purchase_id, purchaseIdMap[pi.purchase_id]); stats.skipped.missing_parent++; continue; }
          try {
            // build payload using mapped IDs only
            const payload = { purchase_id, ingredient_id, quantity: pi.quantity != null ? pi.quantity : 0, unit: pi.unit || '', unit_price: pi.unit_price != null ? pi.unit_price : 0 };
            console.log('Purchase item insert payload:', JSON.stringify(payload));
            const exist = await restFindOneByComposite('app_purchase_items', { purchase_id: payload.purchase_id, ingredient_id: payload.ingredient_id });
            if (exist) { stats.skipped.duplicates++; continue; }
            const ins = await restInsertOne('app_purchase_items', payload);
            if (ins) stats.inserted.purchase_items++;
          } catch (e) { logError('app_purchase_items', payload, e); }
        }
      }
    }

    // Summary
    console.log('\nImport terminado. Resumen:');
    console.log('Parent table stats:');
    console.log(JSON.stringify(stats.tables, null, 2));
    console.log('\nChild table inserted counts:', stats.inserted);
    console.log('Updated:', stats.updated);
    console.log('Skipped summary:', stats.skipped);
    if (stats.errors && stats.errors.length) {
      console.log('\nErrores:');
      stats.errors.forEach((e, i) => console.log(i+1, e.table, e.error, e.item ? JSON.stringify(e.item) : ''));
    } else {
      console.log('\nNo se registraron errores.');
    }
  } catch (err) {
    console.error('Error en import:', err);
    process.exit(1);
  }
})();
