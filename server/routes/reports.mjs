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

router.get('/sales-summary', requireServiceClient, async (req, res) => {
  try {
    const [{ data: orders, error: orderError }, { data: branches, error: branchError }] = await Promise.all([
      req.supabase.from('orders').select('branch_id, total_amount'),
      req.supabase.from('branches').select('id, name'),
    ]);

    if (orderError) throw orderError;
    if (branchError) throw branchError;

    const branchMap = (branches || []).reduce((map, branch) => {
      map[branch.id] = branch.name;
      return map;
    }, {});

    const totals = (orders || []).reduce((map, order) => {
      const branchId = order.branch_id || 'unknown';
      const existing = map[branchId] || { branchId, branch: branchMap[branchId] || 'General', count: 0, total: 0 };
      existing.count += 1;
      existing.total += Number(order.total_amount) || 0;
      map[branchId] = existing;
      return map;
    }, {});

    res.json(Object.values(totals));
  } catch (err) {
    console.error('Fetch sales summary error', err.message || err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
