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

// Create a new user (Auth + users table)
router.post('/', requireServiceClient, async (req, res) => {
  const { email, password, role, branch_id, metadata } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const supabase = req.supabase;

    // Create auth user with service role
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata || {}
    });

    if (authError) throw authError;

    // Insert into application users table
    const userRecord = {
      id: authUser.id,
      email,
      role,
      branch_id: branch_id || null,
      metadata: metadata || {}
    };

    const { data, error } = await supabase.from('users').insert(userRecord).select().single();
    if (error) throw error;

    res.json({ user: data });
  } catch (err) {
    console.error('Create user error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
