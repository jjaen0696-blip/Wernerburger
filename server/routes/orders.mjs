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

router.post('/', requireServiceClient, async (req, res) => {
  const {
    branch_id,
    customer_name = 'Cliente local',
    phone = null,
    customer_address = null,
    delivery_type = 'local',
    payment_method = 'efectivo',
    notes = null,
    items,
  } = req.body;

  if (!branch_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'branch_id and items are required' });
  }

  const sanitizedItems = items.map((item) => ({
    product_id: item.product_id,
    quantity: Number(item.quantity) || 1,
    unit_price: Number(item.unit_price) || 0,
    notes: item.notes || null,
  }));

  if (sanitizedItems.some((item) => !item.product_id || item.quantity <= 0 || item.unit_price < 0)) {
    return res.status(400).json({ error: 'Invalid items payload' });
  }

  try {
    const supabase = req.supabase;
    const productIds = [...new Set(sanitizedItems.map((item) => item.product_id))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);

    if (productsError) throw productsError;

    const orderItems = sanitizedItems.map((item) => {
      const product = products?.find((p) => p.id === item.product_id);
      return {
        product_name: product?.name || 'Producto desconocido',
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.quantity * item.unit_price,
        notes: item.notes,
      };
    });

    const total_amount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    const orderPayload = {
      branch_id,
      customer_name,
      customer_phone: phone,
      customer_address,
      delivery_type,
      payment_method,
      status: 'pending',
      total_amount,
      notes,
    };

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('*')
      .single();

    if (orderError) throw orderError;
    if (!orderData?.id) {
      throw new Error('Failed to create order');
    }

    const itemsWithOrderId = orderItems.map((item) => ({
      ...item,
      order_id: orderData.id,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId)
      .select('*');

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', orderData.id);
      throw itemsError;
    }

    res.status(201).json({ order: orderData, items: insertedItems });
  } catch (err) {
    console.error('Create order error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
