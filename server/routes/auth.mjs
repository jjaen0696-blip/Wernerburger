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

router.post('/lookup', requireServiceClient, async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    const { data, error } = await req.supabase
      .from('users')
      .select('email')
      .eq('username', username)
      .single();

    if (error || !data?.email) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ email: data.email });
  } catch (err) {
    console.error('Lookup user error', err.message || err);
    res.status(500).json({ error: 'Error interno al buscar usuario' });
  }
});

router.get('/role/:id', requireServiceClient, async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const { data, error } = await req.supabase
      .from('users')
      .select('role, branch_id')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ role: data.role, branchId: data.branch_id });
  } catch (err) {
    console.error('Fetch role error', err.message || err);
    res.status(500).json({ error: 'Error interno al obtener rol' });
  }
});

export default router;
