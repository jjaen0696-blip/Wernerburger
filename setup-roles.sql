-- Script SQL para configurar roles y sucursales en tabla users
-- Ejecuta esto en Supabase SQL Editor

-- 1. Agregar columnas si no existen
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS branch_id UUID;

-- 2. Actualizar usuario admin
UPDATE public.users
SET role = 'admin', branch_id = NULL
WHERE username = 'admin';

-- 3. Obtener IDs de usuarios de auth y asignar roles
UPDATE public.users
SET role = 'cocina'
WHERE username = 'cocina' AND email = 'cocina@wernerburger.com';

UPDATE public.users
SET role = 'delivery'
WHERE username = 'delivery' AND email = 'delivery@wernerburger.com';

-- 4. Asignar sucursales (obtener primera sucursal para cocina y delivery)
UPDATE public.users
SET branch_id = (
  SELECT id FROM public.branches LIMIT 1
)
WHERE username IN ('cocina', 'delivery') AND branch_id IS NULL;

-- 5. Verificar configuración
SELECT username, email, role, branch_id FROM public.users;

-- Nota: Si las columnas ya existen y dan error, eso es normal
-- Las filas deberían mostrar:
-- admin | admin@wernerburger.com | admin | NULL
-- cocina | cocina@wernerburger.com | cocina | [branch_id]
-- delivery | delivery@wernerburger.com | delivery | [branch_id]
