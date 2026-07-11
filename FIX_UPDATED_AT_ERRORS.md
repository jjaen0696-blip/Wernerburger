# 🔧 INSTRUCCIONES DE CORRECCIÓN - Error updated_at

## Problema Identificado
Error: `record "new" has no field "updated_at"` en endpoints:
- `PATCH /branches/:id` (500)
- `GET /alerts` (500)
- `GET /inventory/:id` (500)

**Causa raíz**: Tablas sin campo `updated_at` o triggers mal configurados

## Solución Rápida

### ✅ MÉTODO 1: Ejecución Manual (Recomendado)

1. **Abre Supabase Dashboard**
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto
   - Abre: SQL Editor (lado izquierdo)

2. **Ejecuta cada comando en orden:**

```sql
-- 1. Agregar columnas updated_at
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE IF EXISTS public.purchase_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE IF EXISTS public.transfer_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
```

3. **Limpiar triggers viejos:**

```sql
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS trg_order_items_updated_at ON public.order_items;
DROP TRIGGER IF EXISTS trg_purchase_items_updated_at ON public.purchase_items;
DROP TRIGGER IF EXISTS trg_transfer_items_updated_at ON public.transfer_items;
```

4. **Crear nuevos triggers:**

```sql
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_order_items_updated_at BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_purchase_items_updated_at BEFORE UPDATE ON public.purchase_items FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
CREATE TRIGGER trg_transfer_items_updated_at BEFORE UPDATE ON public.transfer_items FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
```

### ✅ MÉTODO 2: Usando endpoint de diagnósticos

```bash
# 1. Inicia el servidor
npm run start

# 2. En otra terminal, verifica el estado
curl http://localhost:3000/admin/diagnostics

# Esto te mostrará qué tablas tienen problemas
```

### ✅ MÉTODO 3: Script Automático

```bash
# Desde la terminal en la carpeta del proyecto:
npm run fix:updated-at
```

O manualmente:

```bash
SUPABASE_URL=tu_url SUPABASE_SERVICE_ROLE_KEY=tu_key node fix-updated-at-simple.mjs
```

Reemplaza con tus valores de Supabase (Settings → API)

## ✅ PASO 2: Verificar que se ejecutó correctamente

### Opción A: Usando el endpoint

```bash
curl http://localhost:3000/admin/diagnostics
```

Debería mostrar que todas las tablas tienen `updated_at`:
```json
{
  "tables": {
    "branches": { "status": "ok", "hasUpdatedAt": true },
    "orders": { "status": "ok", "hasUpdatedAt": true },
    "order_items": { "status": "ok", "hasUpdatedAt": true },
    "inventory": { "status": "ok", "hasUpdatedAt": true },
    ...
  }
}
```

### Opción B: Verificar en Supabase SQL Editor

```sql
-- Ejecutar en Supabase SQL Editor
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'updated_at'
ORDER BY table_name;
```

### ✅ PASO 3: Probar los endpoints después de la corrección

```bash
# Test endpoint /alerts
curl http://localhost:3000/alerts

# Test endpoint /inventory/:branchId
curl http://localhost:3000/inventory/bbca66cc-240a-4447-a79f-6c05dbff1e59

# Test PATCH /branches/:id
curl -X PATCH http://localhost:3000/branches/test-id \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: tu_admin_key" \
  -d '{"name": "Test Branch"}'
```

Si todos retornan datos sin errores 500, ¡la corrección funcionó! 🎉

## 📋 Resumen de cambios realizados

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/20260711_fix_updated_at_fields.sql` | NUEVO - Migración SQL de corrección |
| `fix-updated-at-simple.mjs` | NUEVO - Script para ejecutar correcciones |
| `fix-updated-at.mjs` | NUEVO - Script avanzado (alternativa) |
| `server/routes/diagnostics.mjs` | NUEVO - Endpoint para diagnósticos |
| `server/index.mjs` | Agregado endpoint `/admin/diagnostics` |
| `package.json` | Scripts: `fix:updated-at`, `db:migrate` |
| `FIX_UPDATED_AT_ERRORS.md` | NUEVO - Este archivo |

## 🚀 Próximos pasos

1. ✅ Ejecuta UNA de las 3 opciones del Método arriba
2. ✅ Verifica con `curl http://localhost:3000/admin/diagnostics`
3. ✅ Prueba los endpoints
4. ✅ Reinicia el servidor si es necesario
5. ✅ Redeploy a Render si los cambios se hicieron en remote

## 🆘 Si aún hay errores

1. Verifica que SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY sean correctos
2. Revisa los logs del servidor: `npm run start`
3. Ejecuta manualmente los comandos SQL en Supabase SQL Editor
4. Contacta con soporte si el problema persiste

### ✅ PASO 2: Verificar en Supabase

Después de ejecutar, verifica en Supabase SQL Editor:

```sql
-- Verificar que todas las tablas tienen updated_at
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'updated_at'
ORDER BY table_name;
```

Deberías ver:
- branches ✓
- categories ✓
- ingredients ✓
- inventory ✓
- order_items ✓
- orders ✓
- products ✓
- purchases ✓
- purchase_items ✓
- suppliers ✓
- transfers ✓
- transfer_items ✓

### ✅ PASO 3: Probar endpoints

Después de la corrección, los endpoints deberían funcionar:
```bash
# Test /branches
curl -X GET https://wernerburger.onrender.com/branches

# Test /alerts
curl -X GET https://wernerburger.onrender.com/alerts

# Test /inventory
curl -X GET https://wernerburger.onrender.com/inventory/bbca66cc-240a-4447-a79f-6c05dbff1e59
```

## Archivos modificados
- `supabase/migrations/20260711_fix_updated_at_fields.sql` (NUEVO)

## Cambios realizados
1. ✅ Agregadas columnas `updated_at` a 4 tablas
2. ✅ Recreados triggers de `updated_at` 
3. ✅ Limpiados y recreados triggers de auditoría
4. ✅ Excluida tabla `users` (auth) de triggers

## Próximos pasos
- [ ] Ejecutar SQL en Supabase
- [ ] Verificar que tablas tienen `updated_at`
- [ ] Probar PATCH /branches
- [ ] Probar GET /alerts
- [ ] Probar GET /inventory
