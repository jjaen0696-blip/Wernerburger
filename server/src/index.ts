import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

const rootEnv = path.resolve(process.cwd(), '.env');
const parentEnv = path.resolve(process.cwd(), '..', '.env');
const serverEnv = path.resolve(process.cwd(), 'server', '.env');

const loadedParent = dotenv.config({ path: parentEnv, override: false });
const loadedRoot = dotenv.config({ path: rootEnv, override: true });
const loadedServer = dotenv.config({ path: serverEnv, override: true });

console.log('Loaded env parent:', parentEnv, loadedParent.error ? loadedParent.error.message : 'ok');
console.log('Loaded env root:', rootEnv, loadedRoot.error ? loadedRoot.error.message : 'ok');
console.log('Loaded env server:', serverEnv, loadedServer.error ? loadedServer.error.message : 'ok');

const app = express();
// CORS: orígenes permitidos (frontend + local dev)
const allowedOrigins = [
  'https://wernerburger.vercel.app',
  'http://localhost:5173'
];

// Temporary middleware to log incoming request origins (for CORS debugging)
app.use((req, res, next) => {
  try { console.log('Request origin:', req.headers.origin); } catch(e) {}
  next();
});

const corsOptions = {
  origin: (origin: any, callback: any) => {
    // allow non-browser requests (e.g. server-to-server) when origin is undefined
    if (!origin) return callback(null, true);
    // allow all origins when CORS_ALLOW_ALL=1 (useful for quick debugging on deploy)
    if (process.env.CORS_ALLOW_ALL === '1') return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
    console.warn('Blocked CORS origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

console.log('CORS allowed origins:', allowedOrigins);

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Test endpoint for CORS verification
app.get('/cors-test', (_req, res) => {
  res.json({ cors: 'ok' });
});
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  next(err);
});

const USE_LOCAL_SQLITE = process.env.USE_LOCAL_SQLITE === '1';

let supabase: any = null;
let localDb: any = null;

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

console.log('USE_LOCAL_SQLITE:', USE_LOCAL_SQLITE);
console.log('Supabase URL configured:', Boolean(SUPABASE_URL));
console.log('Supabase key configured:', Boolean(SUPABASE_KEY));
if (process.env.VITE_SUPABASE_URL) console.log('Using VITE_SUPABASE_URL from environment');
if (process.env.VITE_SUPABASE_KEY) console.log('Using VITE_SUPABASE_KEY from environment');
if (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) console.log('Using VITE_SUPABASE_SERVICE_ROLE_KEY from environment');

if (USE_LOCAL_SQLITE) {
  // Lazy require so server still works when not installed
  // local_db exports a simple JSON-backed database adapter
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  localDb = require('./local_db').default;
  console.log('Using local JSON DB');
} else if (SUPABASE_URL && SUPABASE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  console.log('Supabase client initialized');
} else {
  console.error('Supabase env missing or incomplete. Render must provide SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY).');
}

if (!USE_LOCAL_SQLITE && !supabase) {
  console.error('Supabase client unavailable: backend requests requiring database access will fail.');
}

// If Supabase isn't configured, return a clear 500 for DB routes to avoid uncaught exceptions
if (!USE_LOCAL_SQLITE && !supabase) {
  app.use((req, res, next) => {
    // allow basic health and cors-test endpoints through
    if (req.path === '/health' || req.path === '/cors-test') return next();
    return res.status(500).json({ error: 'Server misconfiguration: Supabase client unavailable' });
  });
}

// Middleware to verify Supabase JWT on protected routes
async function verifyAuth(req: any, res: any, next: any) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;
    if (!token) return res.status(401).json({ error: 'Authorization required' });
    // supabase v2: getUser
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' });
    req.user = data.user;
    return next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Protect admin-like routes
// Apply middleware only when supabase client is available
if (supabase) {
  app.use(['/users', '/roles', '/purchases', '/inventory', '/alerts', '/reports'], verifyAuth);
}

function normalizeRole(value?: string | null) {
  const role = String(value || '').toLowerCase();
  if (role === 'admin' || role === 'manager' || role === 'kitchen' || role === 'delivery') return role;
  return 'manager';
}

function ensureDefaultBranch() {
  if (!USE_LOCAL_SQLITE || !localDb) return;
  const rows = localDb.prepare('SELECT * FROM branches ORDER BY name').all();
  if (rows.length === 0) {
    const branchId = require('crypto').randomUUID();
    localDb.prepare('INSERT INTO branches(id, name, address, is_closed) VALUES(?,?,?,?)').run(branchId, 'Sucursal Principal', 'Centro', false);
  }
}

function ensureDefaultUser() {
  if (!USE_LOCAL_SQLITE || !localDb) return;
  const users = localDb.prepare('SELECT * FROM users ORDER BY created_at').all();
  if (users.length === 0) {
    const branch = localDb.prepare('SELECT * FROM branches ORDER BY name').all()[0];
    const userId = require('crypto').randomUUID();
    const now = new Date().toISOString();
    localDb.prepare('INSERT INTO users(id, email, username, password_hash, branch_id, role, created_at) VALUES(?,?,?,?,?,?,?)').run(userId, 'admin@werner.com', 'admin', 'admin123', branch?.id || null, 'admin', now);
  }
}

async function ensureRemoteAdminUser() {
  if (USE_LOCAL_SQLITE || !supabase) return;
  const username = 'Fisura';
  const email = 'fisura@wernerburger.com';
  const password = 'Josecod10';

  const existing = await supabase.from('app_users').select('id').eq('username', username).maybeSingle();
  if (existing?.data?.id) return;

  const { error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, role: 'admin' },
  });
  if (authError && !String(authError.message).includes('already exists')) {
    console.warn('Could not create remote auth user:', authError.message);
  }

  const { error: insertError } = await supabase.from('app_users').insert([
    { username, email, role: 'admin', password_hash: password },
  ]).select().single();

  if (insertError && !String(insertError.message).includes('duplicate')) {
    console.warn('Could not insert app_users admin row:', insertError.message);
  }
}

ensureDefaultBranch();
ensureDefaultUser();
void ensureRemoteAdminUser();

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

app.post('/ingredients', async (req, res) => {
  try {
    const payload = req.body || {};
    const name = String(payload.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    if (USE_LOCAL_SQLITE) {
      const id = require('crypto').randomUUID();
      const now = new Date().toISOString();
      localDb.prepare('INSERT INTO ingredients(id, name, unit, created_at) VALUES(?,?,?,?)').run(id, name, payload.unit || 'unidad', now);
      const initialStock = Number(payload.initial_stock || 0);
      if (payload.branch_id && initialStock > 0) {
        const invId = `${payload.branch_id}::${id}`;
        localDb.prepare('INSERT INTO inventory(id, branch_id, ingredient_id, qty, unit, updated_at) VALUES(?,?,?,?,?,?)').run(invId, payload.branch_id, id, initialStock, payload.unit || 'unidad', now);
        localDb.prepare('INSERT INTO inventory_movements(id, branch_id, ingredient_id, change, reason, created_at) VALUES(?,?,?,?,?,?)').run(require('crypto').randomUUID(), payload.branch_id, id, initialStock, 'initial', now);
      }
      const row = localDb.prepare('SELECT * FROM ingredients WHERE id = ?').get(id);
      return res.json(row);
    }
    const { data, error } = await supabase.from('ingredients').insert([{ name, unit: payload.unit || 'unidad' }]).select().single();
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

app.post('/branches', async (req, res) => {
  try {
    const payload = req.body || {};
    const name = String(payload.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    if (USE_LOCAL_SQLITE) {
      const id = require('crypto').randomUUID();
      localDb.prepare('INSERT INTO branches(id, name, address, is_closed) VALUES(?,?,?,?)').run(id, name, payload.address || '', Boolean(payload.is_closed));
      const row = localDb.prepare('SELECT * FROM branches WHERE id = ?').get(id);
      return res.json(row);
    }
    const { data, error } = await supabase.from('branches').insert([{ name, address: payload.address || '', is_closed: Boolean(payload.is_closed) }]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/branches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    if (USE_LOCAL_SQLITE) {
      const existing = localDb.prepare('SELECT * FROM branches WHERE id = ?').get(id);
      if (!existing) return res.status(404).json({ error: 'Sucursal no encontrada' });
      const name = String(payload.name || existing.name || '').trim();
      const address = String(payload.address ?? existing.address ?? '');
      const isClosed = Boolean(payload.is_closed ?? existing.is_closed);
      localDb.prepare('UPDATE branches SET name = ?, address = ?, is_closed = ? WHERE id = ?').run(name, address, isClosed, id);
      const row = localDb.prepare('SELECT * FROM branches WHERE id = ?').get(id);
      return res.json(row);
    }
    const { data, error } = await supabase.from('branches').update({ name: payload.name, address: payload.address, is_closed: payload.is_closed }).eq('id', id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint removed — authentication not handled by this app build

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
    const { data, error } = await supabase.from('app_users').select('*').order('created_at');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const payload = req.body || {};
    if (USE_LOCAL_SQLITE) {
      const id = require('crypto').randomUUID();
      const now = new Date().toISOString();
      const password = payload.password || payload.password_hash || null;
      const role = normalizeRole(payload.role);
      localDb.prepare('INSERT INTO users(id, email, username, password_hash, branch_id, role, created_at) VALUES(?,?,?,?,?,?,?)').run(id, payload.email || null, payload.username, password, payload.branch_id || null, role, now);
      const row = localDb.prepare('SELECT * FROM users WHERE id = ?').get(id);
      return res.json(row);
    }
    const { data, error } = await supabase.from('app_users').insert([{ ...payload, role: normalizeRole(payload.role), password_hash: payload.password || payload.password_hash || null }]).select().single();
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

app.post('/inventory/:branchId/adjust', async (req, res) => {
  try {
    const { branchId } = req.params;
    const payload = req.body || {};
    const change = Number(payload.change || 0);
    const ingredientId = payload.ingredient_id;
    if (!ingredientId) return res.status(400).json({ error: 'Selecciona un ingrediente' });
    if (USE_LOCAL_SQLITE) {
      const now = new Date().toISOString();
      const invId = `${branchId}::${ingredientId}`;
      const existing = localDb.prepare('SELECT * FROM inventory WHERE id = ?').get(invId);
      if (existing) {
        localDb.prepare('UPDATE inventory SET qty = qty + ?, updated_at = ? WHERE id = ?').run(change, now, invId);
      } else {
        localDb.prepare('INSERT INTO inventory(id, branch_id, ingredient_id, qty, unit, updated_at) VALUES(?,?,?,?,?,?)').run(invId, branchId, ingredientId, change, payload.unit || 'unidad', now);
      }
      localDb.prepare('INSERT INTO inventory_movements(id, branch_id, ingredient_id, change, reason, created_at) VALUES(?,?,?,?,?,?)').run(require('crypto').randomUUID(), branchId, ingredientId, change, payload.reason || 'ajuste', now);
      const row = localDb.prepare('SELECT * FROM inventory WHERE id = ?').get(invId);
      return res.json(row);
    }
    const { data, error } = await supabase.from('inventory').upsert([{ branch_id: branchId, ingredient_id: ingredientId, qty: change }], { onConflict: 'branch_id,ingredient_id' }).select().single();
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
  try {
    if (USE_LOCAL_SQLITE) {
      const rows = localDb.prepare('SELECT * FROM orders ORDER BY created_at').all();
      const summary: Record<string, { branch_id: string; total: number; count: number }> = {};
      (rows || []).forEach((o: any) => {
        const b = o.branch_id || 'unassigned';
        if (!summary[b]) summary[b] = { branch_id: b, total: 0, count: 0 };
        summary[b].total += parseFloat(o.total || 0);
        summary[b].count += 1;
      });
      return res.json(Object.values(summary));
    }
    const { from, to } = req.query as any;
    const query = supabase.from('orders').select('branch_id, total, created_at');
    let q = query;
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    const summary: Record<string, { branch_id: string; total: number; count: number }> = {};
    (data || []).forEach((o: any) => {
      const b = o.branch_id || 'unassigned';
      if (!summary[b]) summary[b] = { branch_id: b, total: 0, count: 0 };
      summary[b].total += parseFloat(o.total);
      summary[b].count += 1;
    });
    res.json(Object.values(summary));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5174;
console.log("SERVER STARTED WITH CORS CONFIG");
app.listen(port, () => console.log(`Server listening on ${port}`));
