/*
# Fase 1 — Roles (perfiles) + base de seguridad multi-sucursal

## Qué hace
1. Tabla `profiles` (1:1 con auth.users): rol ('admin' | 'encargado') y `location_id`.
2. Auto-aprovisionamiento: trigger en auth.users crea el profile al registrarse + backfill de los existentes.
3. Bootstrap del admin actual (correo del panel de cocina).
4. Funciones helper de seguridad: `is_admin()`, `current_location_id()` (SECURITY DEFINER, sin recursión RLS).
5. RLS en `profiles` y políticas de escritura de `locations` para el admin (gestión de sucursales).
6. RPC `admin_set_user_role(email, role, location_id)` para asignar roles desde el panel.
7. Realtime en `locations` y `profiles`.

## Seguridad / compatibilidad
- Todo es ADITIVO. No se elimina ni altera ninguna tabla/dato existente.
- Las políticas previas de `locations` (lectura pública de activas) se conservan.
- Idempotente: se puede ejecutar varias veces sin error.
*/

-- ============================================================
-- 1) Tabla de perfiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text,
  role        text NOT NULL DEFAULT 'encargado' CHECK (role IN ('admin','encargado')),
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_location_id ON public.profiles(location_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- updated_at automático (reusa set_updated_at() creado en la migración base)
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2) Auto-aprovisionamiento de perfiles desde auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill de usuarios ya existentes
INSERT INTO public.profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3) Bootstrap: el correo administrador del panel queda como 'admin'
-- ============================================================
UPDATE public.profiles p
SET role = 'admin'
FROM auth.users u
WHERE u.id = p.id
  AND lower(u.email) = lower('baex10@icloud.com');

-- ============================================================
-- 4) Funciones helper de seguridad (SECURITY DEFINER -> evitan recursión RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_location_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT location_id FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_location_id() TO anon, authenticated;

-- ============================================================
-- 5) RLS de profiles
-- ============================================================
-- Cada usuario ve su propio perfil; el admin ve todos.
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- Solo el admin modifica roles/sucursal de los perfiles.
DROP POLICY IF EXISTS "profiles_admin_write" ON public.profiles;
CREATE POLICY "profiles_admin_write" ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 6) Políticas de escritura de locations para el admin (gestión de sucursales)
--    (se conserva "anon_select_locations": lectura pública de activas)
-- ============================================================
DROP POLICY IF EXISTS "locations_admin_all" ON public.locations;
CREATE POLICY "locations_admin_all" ON public.locations FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- 7) RPC para asignar rol/sucursal a un usuario por correo (solo admin)
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  p_email       text,
  p_role        text,
  p_location_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  IF p_role NOT IN ('admin','encargado') THEN
    RAISE EXCEPTION 'Rol inválido: %', p_role;
  END IF;

  UPDATE public.profiles p
  SET role = p_role,
      location_id = CASE WHEN p_role = 'admin' THEN NULL ELSE p_location_id END
  FROM auth.users u
  WHERE u.id = p.id AND lower(u.email) = lower(p_email);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', p_email;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_user_role(text, text, uuid) TO authenticated;

-- Lista de usuarios + rol + sucursal (solo admin) para el panel
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (id uuid, email text, role text, location_id uuid, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.email, p.role, p.location_id, p.created_at
  FROM public.profiles p
  WHERE public.is_admin()
  ORDER BY p.created_at;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- ============================================================
-- 8) Realtime
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
