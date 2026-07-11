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

// Diagnóstico de estado de tablas
router.get('/', requireServiceClient, async (req, res) => {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      tables: {},
      errors: [],
    };

    const tables = [
      'branches',
      'orders',
      'order_items',
      'inventory',
      'purchases',
      'purchase_items',
      'transfers',
      'transfer_items',
      'ingredients',
      'suppliers',
      'products',
      'categories',
    ];

    // Verificar estructura de cada tabla
    for (const table of tables) {
      try {
        const { data, error } = await req.supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          diagnostics.tables[table] = {
            status: 'error',
            message: error.message,
          };
          diagnostics.errors.push(`${table}: ${error.message}`);
        } else {
          diagnostics.tables[table] = {
            status: 'ok',
            hasUpdatedAt: false,
          };
        }
      } catch (err) {
        diagnostics.tables[table] = {
          status: 'error',
          message: err.message,
        };
      }
    }

    // Verificar campos específicos
    const fieldsToCheck = [
      { table: 'branches', fields: ['id', 'name', 'updated_at'] },
      { table: 'orders', fields: ['id', 'status', 'updated_at'] },
      { table: 'order_items', fields: ['id', 'order_id', 'updated_at'] },
      { table: 'inventory', fields: ['id', 'branch_id', 'ingredient_id', 'updated_at'] },
    ];

    for (const check of fieldsToCheck) {
      try {
        const { data, error } = await req.supabase
          .from(check.table)
          .select(check.fields.join(','))
          .limit(1);

        if (!error) {
          diagnostics.tables[check.table].hasUpdatedAt = check.fields.includes('updated_at');
          diagnostics.tables[check.table].fields = check.fields;
        }
      } catch (err) {
        // Ignorar errores de campos
      }
    }

    res.json(diagnostics);
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Endpoint para ejecutar correcciones (ADMIN ONLY)
router.post('/fix-updated-at', requireServiceClient, async (req, res) => {
  try {
    console.log('🔧 Ejecutando correcciones de updated_at...');

    const fixes = [];

    // 1. Agregar columnas
    const addColumnsSQL = [
      'ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
      'ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
      'ALTER TABLE IF EXISTS public.purchase_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
      'ALTER TABLE IF EXISTS public.transfer_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();',
    ];

    fixes.push({
      step: 'Agregar columnas updated_at',
      status: 'pending',
      commands: addColumnsSQL,
    });

    // 2. Recrear triggers
    const createTriggersSQL = [
      'DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;',
      'CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();',
      'DROP TRIGGER IF EXISTS trg_order_items_updated_at ON public.order_items;',
      'CREATE TRIGGER trg_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();',
      'DROP TRIGGER IF EXISTS trg_purchase_items_updated_at ON public.purchase_items;',
      'CREATE TRIGGER trg_purchase_items_updated_at BEFORE UPDATE ON public.purchase_items FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();',
      'DROP TRIGGER IF EXISTS trg_transfer_items_updated_at ON public.transfer_items;',
      'CREATE TRIGGER trg_transfer_items_updated_at BEFORE UPDATE ON public.transfer_items FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();',
    ];

    fixes.push({
      step: 'Recrear triggers',
      status: 'pending',
      commands: createTriggersSQL,
    });

    res.json({
      message: '⚠️ Las correcciones deben ejecutarse manualmente en Supabase SQL Editor',
      steps: fixes,
      instructions: [
        '1. Abre Supabase Dashboard → SQL Editor',
        '2. Ejecuta los comandos en el orden mostrado arriba',
        '3. Verifica con GET /admin/diagnostics',
      ],
    });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
