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
    const { data, error } = await req.supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Fetch ingredients error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.post('/', requireServiceClient, async (req, res) => {
  const { name, unit, branch_id, initial_stock = 0 } = req.body;

  if (!name || !unit) {
    return res.status(400).json({ error: 'Name and unit are required' });
  }

  try {
    const { data: ingredient, error: ingredientError } = await req.supabase
      .from('ingredients')
      .insert({ name, unit })
      .select()
      .single();

    if (ingredientError) throw ingredientError;

    if (branch_id && Number(initial_stock) > 0) {
      const { data: inventoryItem, error: inventoryError } = await req.supabase
        .from('inventory')
        .insert({
          branch_id,
          ingredient_id: ingredient.id,
          qty: Number(initial_stock),
          unit,
        })
        .select()
        .single();

      if (inventoryError) throw inventoryError;

      await req.supabase.from('inventory_movements').insert({
        branch_id,
        ingredient_id: ingredient.id,
        change_qty: Number(initial_stock),
        resulting_qty: Number(initial_stock),
        reason: 'initial stock',
        related_table: 'ingredients',
        related_id: ingredient.id,
        created_by: null,
      });
    }

    res.status(201).json(ingredient);
  } catch (err) {
    console.error('Create ingredient error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
