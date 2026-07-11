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
      .from('products')
      .select('id, name, price, description, image_url, available, display_order')
      .eq('available', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('Fetch products error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
