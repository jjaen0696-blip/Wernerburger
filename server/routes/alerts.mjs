import express from 'express';
import createServiceClient from '../lib/supabaseService.mjs';

const router = express.Router();

function requireServiceClient(req, res, next) {
  try {
    req.supabase = createServiceClient();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server misconfiguration' });
  }
}

router.get('/', requireServiceClient, async (req, res) => {
  try {
    const [
      { data: inventoryData, error: inventoryError },
      { data: branches, error: branchError },
      { data: ingredients, error: ingredientError },
    ] = await Promise.all([
      req.supabase.from('inventory').select('branch_id, ingredient_id, qty, unit, min_stock'),
      req.supabase.from('branches').select('id, name'),
      req.supabase.from('ingredients').select('id, name, min_stock'),
    ]);

    if (inventoryError) throw inventoryError;
    if (branchError) throw branchError;
    if (ingredientError) throw ingredientError;

    const branchMap = (branches || []).reduce((map, branch) => {
      map[branch.id] = branch.name;
      return map;
    }, {});

    const ingredientMap = (ingredients || []).reduce((map, ingredient) => {
      map[ingredient.id] = {
        name: ingredient.name,
        min_stock: Number(ingredient.min_stock) || 0,
      };
      return map;
    }, {});

    const alerts = (inventoryData || [])
      .map((item) => {
        const ingredient = ingredientMap[item.ingredient_id] || { name: 'Ingrediente desconocido', min_stock: Number(item.min_stock) || 0 };
        const minStock = ingredient.min_stock || Number(item.min_stock) || 0;
        return {
          branch_id: item.branch_id,
          branch: branchMap[item.branch_id] || 'Sin sucursal',
          ingredient_id: item.ingredient_id,
          ingredient_name: ingredient.name,
          qty: Number(item.qty) || 0,
          min_stock: minStock,
          unit: item.unit,
        };
      })
      .filter((item) => item.min_stock > 0 && item.qty <= item.min_stock);

    res.json(alerts);
  } catch (err) {
    console.error('Fetch alerts error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
