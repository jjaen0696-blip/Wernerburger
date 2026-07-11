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

// List branches
router.get('/', requireServiceClient, async (req, res) => {
  try {
    const { data, error } = await req.supabase.from('branches').select('*');
    if (error) throw error;
    res.json({ branches: data });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Create branch
router.post('/', requireServiceClient, async (req, res) => {
  try {
    const payload = req.body;
    const { data, error } = await req.supabase.from('branches').insert(payload).select().single();
    if (error) throw error;
    res.json({ branch: data });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
