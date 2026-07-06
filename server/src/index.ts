import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const USE_LOCAL_SQLITE = process.env.USE_LOCAL_SQLITE === '1' || (!process.env.SUPABASE_URL && !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY);

let supabase: any = null;
let localDb: any = null;

if (USE_LOCAL_SQLITE) {
  // Lazy require so server still works when not installed
  // local_db exports a simple JSON-backed database adapter
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  localDb = require('./local_db').default;
  console.log('Using local JSON DB');
} else {
  const SUPABASE_URL = process.env.SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('Supabase env missing, falling back to local JSON DB');
  } else {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  }
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/products', async (_req, res) => {
  try {
    if (USE_LOCAL_SQLITE) {
      const rows = localDb.prepare('SELECT * FROM products ORDER BY name').all();
      return res.json(rows);
    }
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/ingredients', async (_req, res) => {
  try {
    if (USE_LOCAL_SQLITE) {
      const rows = localDb.prepare('SELECT * FROM ingredients ORDER BY name').all();
      return res.json(rows);
    }
    const { data, error } = await supabase.from('ingredients').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/branches', async (_req, res) => {
  try {
    if (USE_LOCAL_SQLITE) {
      const rows = localDb.prepare('SELECT * FROM branches ORDER BY name').all();
      return res.json(rows);
    }
    const { data, error } = await supabase.from('branches').select('*').order('name');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Users and roles endpoints (admin)
app.get('/roles', async (_req, res) => {
  try {
    if (USE_LOCAL_SQLITE) {
      const rows = localDb.prepare('SELECT * FROM roles ORDER BY id').all();
      return res.json(rows);
    }
    const { data, error } = await supabase.from('roles').select('*').order('id');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/roles', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (USE_LOCAL_SQLITE) {
      const id = require('crypto').randomUUID();
      localDb.prepare('INSERT INTO roles(id, name, description) VALUES(?,?,?)').run(id, name, description);
      const row = localDb.prepare('SELECT * FROM roles WHERE id = ?').get(id);
      return res.json(row);
    }
    const { data, error } = await supabase.from('roles').insert([{ name, description }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users', async (_req, res) => {
  try {
    if (USE_LOCAL_SQLITE) {
      const rows = localDb.prepare('SELECT * FROM users ORDER BY created_at').all();
      return res.json(rows);
    }
    const { data, error } = await supabase.from('users').select('*').order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const payload = req.body; // { email, username, password_hash }
    if (USE_LOCAL_SQLITE) {
      const id = require('crypto').randomUUID();
      const now = new Date().toISOString();
      localDb.prepare('INSERT INTO users(id, email, username, password_hash, created_at) VALUES(?,?,?,?,?)').run(id, payload.email, payload.username, payload.password_hash || null, now);
      const row = localDb.prepare('SELECT * FROM users WHERE id = ?').get(id);
      return res.json(row);
    }
    const { data, error } = await supabase.from('users').insert([payload]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users/:id/roles', async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id, branch_id } = req.body;
    if (USE_LOCAL_SQLITE) {
      const rid = require('crypto').randomUUID();
      localDb.prepare('INSERT INTO user_roles(id, user_id, role_id, branch_id) VALUES(?,?,?,?)').run(rid, id, role_id, branch_id);
      const row = localDb.prepare('SELECT * FROM user_roles WHERE id = ?').get(rid);
      return res.json(row);
    }
    const { data, error } = await supabase.from('user_roles').insert([{ user_id: id, role_id, branch_id }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/inventory/:branchId', async (req, res) => {
  try {
    const { branchId } = req.params;
    if (USE_LOCAL_SQLITE) {
      const rows = localDb.prepare('SELECT i.*, ing.name as ingredient_name FROM inventory i LEFT JOIN ingredients ing ON ing.id = i.ingredient_id WHERE branch_id = ?').all(branchId);
      return res.json(rows);
    }
    const { data, error } = await supabase.from('inventory').select('*, ingredients(*)').eq('branch_id', branchId);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/purchases', async (req, res) => {
  try {
    const payload = req.body;
    if (USE_LOCAL_SQLITE) {
      const id = require('crypto').randomUUID();
      const now = new Date().toISOString();
      localDb.prepare('INSERT INTO purchases(id, branch_id, user_id, total, created_at) VALUES(?,?,?,?,?)').run(id, payload.branch_id, payload.user_id || null, payload.total || 0, now);
      if (payload.items && Array.isArray(payload.items)) {
        const insertItem = localDb.prepare('INSERT INTO purchase_items(id, purchase_id, ingredient_id, quantity, unit_price) VALUES(?,?,?,?,?)');
        const upsertInv = localDb.prepare('INSERT INTO inventory(id, branch_id, ingredient_id, qty, unit, updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET qty = qty + excluded.qty, updated_at = excluded.updated_at');
        const insertMove = localDb.prepare('INSERT INTO inventory_movements(id, branch_id, ingredient_id, change, reason, created_at) VALUES(?,?,?,?,?)');
        for (const it of payload.items) {
          const iid = require('crypto').randomUUID();
          insertItem.run(iid, id, it.ingredient_id, it.quantity, it.unit_price || 0);
          const invId = `${payload.branch_id}::${it.ingredient_id}`;
          upsertInv.run(invId, payload.branch_id, it.ingredient_id, it.quantity, it.unit || null, now);
          const mid = require('crypto').randomUUID();
          insertMove.run(mid, payload.branch_id, it.ingredient_id, it.quantity, 'purchase', now);
        }
      }
      const row = localDb.prepare('SELECT * FROM purchases WHERE id = ?').get(id);
      return res.json(row);
    }
    const { data: purchase, error } = await supabase.from('purchases').insert([payload]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (payload.items && Array.isArray(payload.items)) {
      const items = payload.items.map((it: any) => ({ ...it, purchase_id: purchase.id }));
      await supabase.from('purchase_items').insert(items);
      for (const it of items) {
        await supabase.rpc('increment_inventory_by_purchase', { p_branch_id: purchase.branch_id, p_ingredient_id: it.ingredient_id, p_qty: it.quantity, p_unit: it.unit, p_user_id: purchase.user_id });
      }
    }
    res.json(purchase);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/orders', async (req, res) => {
  try {
    const payload = req.body;
    if (USE_LOCAL_SQLITE) {
      const id = require('crypto').randomUUID();
      const now = new Date().toISOString();
      localDb.prepare('INSERT INTO orders(id, branch_id, status, total, created_at) VALUES(?,?,?,?,?)').run(id, payload.branch_id || null, 'pending', payload.total || 0, now);
      if (payload.items && Array.isArray(payload.items)) {
        const insertItem = localDb.prepare('INSERT INTO order_items(id, order_id, product_id, qty) VALUES(?,?,?,?)');
        for (const it of payload.items) {
          insertItem.run(require('crypto').randomUUID(), id, it.product_id, it.qty || 1);
        }
      }
      // Simulate acceptance and deduction: change status and deduct recipe ingredients
      // Fetch order items and recipe requirements
      const items = localDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
      for (const oi of items) {
        const recipe = localDb.prepare('SELECT * FROM recipe_items WHERE product_id = ?').all(oi.product_id);
        for (const r of recipe) {
          const needed = r.qty * oi.qty;
          const invId = `${payload.branch_id}::${r.ingredient_id}`;
          // decrement inventory
          const inv = localDb.prepare('SELECT * FROM inventory WHERE id = ?').get(invId);
          if (!inv) {
            return res.status(400).json({ error: `Missing inventory for ingredient ${r.ingredient_id}` });
          }
          if (inv.qty < needed) {
            return res.status(400).json({ error: `Insufficient stock for ingredient ${r.ingredient_id}` });
          }
          localDb.prepare('UPDATE inventory SET qty = qty - ?, updated_at = ? WHERE id = ?').run(needed, now, invId);
          localDb.prepare('INSERT INTO inventory_movements(id, branch_id, ingredient_id, change, reason, created_at) VALUES(?,?,?,?,?,?)').run(require('crypto').randomUUID(), payload.branch_id, r.ingredient_id, -needed, 'sale', now);
        }
      }
      localDb.prepare('UPDATE orders SET status = ? WHERE id = ?').run('accepted', id);
      const orderRow = localDb.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      return res.json(orderRow);
    }
    const { data: order, error } = await supabase.from('orders').insert([payload]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    if (payload.items && Array.isArray(payload.items)) {
      const items = payload.items.map((it: any) => ({ ...it, order_id: order.id }));
      await supabase.from('order_items').insert(items);
    }
    const { error: uerr } = await supabase.from('orders').update({ status: 'accepted' }).eq('id', order.id);
    if (uerr) return res.status(500).json({ error: uerr.message });
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Alerts endpoint: obtiene alertas de inventario bajo/agotado
app.get('/alerts', async (_req, res) => {
  try {
    if (USE_LOCAL_SQLITE) {
      // Very simple low-stock alerts: qty <= threshold (assume threshold=5)
      const rows = localDb.prepare('SELECT i.*, ing.name as ingredient_name FROM inventory i LEFT JOIN ingredients ing ON ing.id = i.ingredient_id WHERE i.qty <= ?').all(5);
      return res.json(rows);
    }
    const { data, error } = await supabase.rpc('get_alerts');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Simple sales summary endpoint (ventas por sucursal en rango de fechas)
app.get('/reports/sales-summary', async (req, res) => {
  const { from, to } = req.query as any;
  // Consulta simplificada: total por sucursal entre fechas
  const query = supabase.from('orders').select('branch_id, total, created_at');
  let q = query;
  if (from) q = q.gte('created_at', from);
  if (to) q = q.lte('created_at', to);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  // Agrupar en Node (simple)
  const summary: Record<string, { branch_id: string; total: number; count: number }> = {};
  (data || []).forEach((o: any) => {
    const b = o.branch_id || 'unassigned';
    if (!summary[b]) summary[b] = { branch_id: b, total: 0, count: 0 };
    summary[b].total += parseFloat(o.total);
    summary[b].count += 1;
  });
  res.json(Object.values(summary));
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5174;
app.listen(port, () => console.log(`Server listening on ${port}`));
