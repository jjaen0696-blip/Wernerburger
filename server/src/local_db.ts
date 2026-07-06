import fs from 'fs';
import path from 'path';

const DB_FILE = process.env.LOCAL_JSON_DB || path.join(__dirname, '..', 'data', 'local_db.json');

function ensureDir() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir();

let state: any = { branches: [], ingredients: [], products: [], recipe_items: [], inventory: [], inventory_movements: [], orders: [], order_items: [], users: [], roles: [], user_roles: [], purchases: [], purchase_items: [] };

function load() {
  if (fs.existsSync(DB_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      console.error('Failed reading local DB, resetting', e);
      state = { branches: [], ingredients: [], products: [], recipe_items: [], inventory: [], inventory_movements: [], orders: [], order_items: [], users: [], roles: [], user_roles: [], purchases: [], purchase_items: [] };
    }
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
  }
}

function persist() {
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
}

load();

function matchQuery(sql: string) {
  const s = sql.toLowerCase();
  if (s.includes('from products')) return 'products';
  if (s.includes('from ingredients')) return 'ingredients';
  if (s.includes('from branches')) return 'branches';
  if (s.includes('from roles')) return 'roles';
  if (s.includes('from users')) return 'users';
  if (s.includes('from orders')) return 'orders';
  if (s.includes('from inventory i')) return 'inventory_with_ingredient';
  if (s.includes('from purchases where id')) return 'purchases_by_id';
  if (s.includes('from order_items where order_id')) return 'order_items_by_order';
  if (s.includes('from recipe_items where product_id')) return 'recipe_items_by_product';
  if (s.includes('from inventory where id =')) return 'inventory_by_id';
  if (s.includes('where i.qty <=')) return 'low_stock_alerts';
  return null;
}

const api = {
  prepare(sql: string) {
    const key = matchQuery(sql);
    return {
      all: (...params: any[]) => {
        if (key === 'products') return state.products.slice().sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        if (key === 'ingredients') return state.ingredients.slice().sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        if (key === 'branches') return state.branches.slice().sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        if (key === 'roles') return state.roles.slice();
        if (key === 'users') return state.users.slice();
        if (key === 'orders') return state.orders.slice().sort((a: any, b: any) => (a.created_at || '').localeCompare(b.created_at || ''));
        if (key === 'inventory_with_ingredient') return state.inventory.filter((i: any) => i.branch_id === params[0]).map((i: any) => ({ ...i, ingredient_name: (state.ingredients.find((ing: any) => ing.id === i.ingredient_id) || {}).name }));
        if (key === 'order_items_by_order') return state.order_items.filter((oi: any) => oi.order_id === params[0]);
        if (key === 'recipe_items_by_product') return state.recipe_items.filter((ri: any) => ri.product_id === params[0]);
        if (key === 'low_stock_alerts') return state.inventory.filter((i: any) => i.qty <= params[0]).map((i: any) => ({ ...i, ingredient_name: (state.ingredients.find((ing: any) => ing.id === i.ingredient_id) || {}).name }));
        return [];
      },
      get: (...params: any[]) => {
        const s = sql.toLowerCase();
        if (s.includes('where id = ?') && s.includes('from purchases')) return state.purchases.find((p: any) => p.id === params[0]);
        if (s.includes('where id = ?') && s.includes('from orders')) return state.orders.find((o: any) => o.id === params[0]);
        if (s.includes('from inventory where id = ?')) return state.inventory.find((i: any) => i.id === params[0]);
        if (s.includes('from roles where id = ?')) return state.roles.find((r: any) => r.id === params[0]);
        if (s.includes('from ingredients where id = ?')) return state.ingredients.find((item: any) => item.id === params[0]);
        return undefined;
      },
      run: (...params: any[]) => {
        const s = sql.toLowerCase();
        if (s.startsWith('insert into branches')) {
          const [id, name] = params;
          state.branches.push({ id, name });
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('insert into ingredients')) {
          const [id, name, unit, created_at] = params;
          state.ingredients.push({ id, name, unit, created_at });
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('insert into roles')) {
          const [id, name, description] = params;
          state.roles.push({ id, name, description });
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('insert into users')) {
          const [id, email, username, password_hash, created_at] = params;
          state.users.push({ id, email, username, password_hash, created_at });
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('insert into user_roles')) {
          const [id, user_id, role_id, branch_id] = params;
          state.user_roles.push({ id, user_id, role_id, branch_id });
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('insert into purchases')) {
          const [id, branch_id, user_id, total, created_at] = params;
          state.purchases.push({ id, branch_id, user_id, total, created_at });
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('insert into purchase_items')) {
          const [id, purchase_id, ingredient_id, quantity, unit_price] = params;
          state.purchase_items.push({ id, purchase_id, ingredient_id, quantity, unit_price });
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('insert into inventory')) {
          const [id, branch_id, ingredient_id, qty, unit, updated_at] = params;
          const existing = state.inventory.find((i: any) => i.id === id);
          if (existing) {
            existing.qty = existing.qty + qty;
            existing.updated_at = updated_at;
          } else {
            state.inventory.push({ id, branch_id, ingredient_id, qty, unit, updated_at });
          }
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('insert into inventory_movements')) {
          const [id, branch_id, ingredient_id, change, reason, created_at] = params;
          state.inventory_movements.push({ id, branch_id, ingredient_id, change, reason, created_at });
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('insert into orders')) {
          const [id, branch_id, status, total, created_at] = params;
          state.orders.push({ id, branch_id, status, total, created_at });
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('insert into order_items')) {
          const [id, order_id, product_id, qty] = params;
          state.order_items.push({ id, order_id, product_id, qty });
          persist();
          return { changes: 1 };
        }
        if (s.startsWith('update inventory set qty = qty -')) {
          const [decrement, updated_at, id] = params;
          const inv = state.inventory.find((i: any) => i.id === id);
          if (inv) {
            inv.qty = inv.qty - decrement;
            inv.updated_at = updated_at;
            persist();
            return { changes: 1 };
          }
          return { changes: 0 };
        }
        if (s.startsWith('update inventory set qty = qty +')) {
          const [increment, updated_at, id] = params;
          const inv = state.inventory.find((i: any) => i.id === id);
          if (inv) {
            inv.qty = inv.qty + increment;
            inv.updated_at = updated_at;
            persist();
            return { changes: 1 };
          }
          return { changes: 0 };
        }
        if (s.startsWith('update orders set status')) {
          const [status, id] = params;
          const o = state.orders.find((x: any) => x.id === id);
          if (o) {
            o.status = status;
            persist();
            return { changes: 1 };
          }
          return { changes: 0 };
        }
        return { changes: 0 };
      }
    };
  }
};

export default api;
