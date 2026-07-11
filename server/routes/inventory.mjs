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

router.get('/:branchId', requireServiceClient, async (req, res) => {
  const { branchId } = req.params;
  if (!branchId) return res.status(400).json({ error: 'Branch ID is required' });

  try {
    const { data, error } = await req.supabase
      .from('inventory')
      .select('id, branch_id, ingredient_id, qty, unit, updated_at, ingredients(name, unit)')
      .eq('branch_id', branchId);

    if (error) throw error;

    const inventory = Array.isArray(data)
      ? data.map((item) => ({
          id: item.id,
          branch_id: item.branch_id,
          ingredient_id: item.ingredient_id,
          qty: Number(item.qty) || 0,
          unit: item.unit || item.ingredients?.[0]?.unit || null,
          ingredient_name: item.ingredients?.[0]?.name || null,
          updated_at: item.updated_at,
        }))
      : [];

    res.json(inventory);
  } catch (err) {
    console.error('Fetch inventory error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.post('/:branchId/adjust', requireServiceClient, async (req, res) => {
  const { branchId } = req.params;
  const { ingredient_id, change, reason, unit } = req.body;
  const changeQty = Number(change ?? 0);

  if (!branchId || !ingredient_id || Number.isNaN(changeQty)) {
    return res.status(400).json({ error: 'branchId, ingredient_id and change are required' });
  }

  try {
    const { data: existingItem, error: existingError } = await req.supabase
      .from('inventory')
      .select('id, qty, unit')
      .eq('branch_id', branchId)
      .eq('ingredient_id', ingredient_id)
      .maybeSingle();

    if (existingError) throw existingError;

    let inventoryItem;
    let resultingQty = changeQty;

    if (existingItem) {
      resultingQty = Number(existingItem.qty) + changeQty;
      const { data: updatedItem, error: updateError } = await req.supabase
        .from('inventory')
        .update({ qty: resultingQty, unit: unit || existingItem.unit })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (updateError) throw updateError;
      inventoryItem = updatedItem;
    } else {
      const { data: newItem, error: insertError } = await req.supabase
        .from('inventory')
        .insert({ branch_id: branchId, ingredient_id, qty: changeQty, unit })
        .select()
        .single();

      if (insertError) throw insertError;
      inventoryItem = newItem;
    }

    await req.supabase.from('inventory_movements').insert({
      branch_id: branchId,
      ingredient_id,
      change_qty: changeQty,
      resulting_qty: resultingQty,
      reason: reason || 'adjustment',
      related_table: 'inventory',
      related_id: inventoryItem.id?.toString() || null,
      created_by: null,
    });

    res.json(inventoryItem);
  } catch (err) {
    console.error('Adjust inventory error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
