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

function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
}

router.post('/', requireServiceClient, async (req, res) => {
  const { branch_id, user_id, total, items, notes } = req.body;

  if (!branch_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'branch_id and items are required' });
  }

  const sanitizedItems = items.map((item) => ({
    ingredient_id: item.ingredient_id,
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unit_price) || 0,
  })).filter((item) => item.ingredient_id && item.quantity > 0);

  if (sanitizedItems.length === 0) {
    return res.status(400).json({ error: 'Valid purchase items are required' });
  }

  try {
    const purchasePayload = {
      branch_id,
      user_id: isUuid(user_id) ? user_id : null,
      total_amount: Number(total) || sanitizedItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
      status: 'received',
      notes: notes || null,
    };

    const { data: purchase, error: purchaseError } = await req.supabase
      .from('purchases')
      .insert(purchasePayload)
      .select()
      .single();

    if (purchaseError) throw purchaseError;

    const itemsWithPurchaseId = sanitizedItems.map((item) => ({
      purchase_id: purchase.id,
      ingredient_id: item.ingredient_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { data: insertedItems, error: itemsError } = await req.supabase
      .from('purchase_items')
      .insert(itemsWithPurchaseId)
      .select();

    if (itemsError) throw itemsError;

    for (const item of sanitizedItems) {
      const { data: existingInventory, error: inventoryError } = await req.supabase
        .from('inventory')
        .select('id, qty, unit')
        .eq('branch_id', branch_id)
        .eq('ingredient_id', item.ingredient_id)
        .maybeSingle();

      if (inventoryError) throw inventoryError;

      let resultingQty = item.quantity;
      let inventoryItem;

      if (existingInventory) {
        resultingQty = Number(existingInventory.qty) + item.quantity;
        const { data: updatedInventory, error: updateError } = await req.supabase
          .from('inventory')
          .update({ qty: resultingQty, unit: existingInventory.unit })
          .eq('id', existingInventory.id)
          .select()
          .single();

        if (updateError) throw updateError;
        inventoryItem = updatedInventory;
      } else {
        const { data: newInventory, error: insertError } = await req.supabase
          .from('inventory')
          .insert({
            branch_id,
            ingredient_id: item.ingredient_id,
            qty: item.quantity,
            unit: null,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        inventoryItem = newInventory;
      }

      await req.supabase.from('inventory_movements').insert({
        branch_id,
        ingredient_id: item.ingredient_id,
        change_qty: item.quantity,
        resulting_qty: resultingQty,
        reason: 'purchase',
        related_table: 'purchases',
        related_id: String(purchase.id),
        created_by: null,
      });
    }

    res.status(201).json({ purchase, items: insertedItems });
  } catch (err) {
    console.error('Create purchase error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
