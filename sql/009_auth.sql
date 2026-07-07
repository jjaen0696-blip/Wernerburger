-- 009_auth.sql
-- Profiles and roles table for Supabase Auth integration

-- Profiles table ties Supabase auth users to app metadata
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  email text,
  role text NOT NULL DEFAULT 'manager',
  branch_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Roles table (optional administrative list)
CREATE TABLE IF NOT EXISTS roles (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text
);

-- Example roles
INSERT INTO roles(name, description) VALUES ('admin', 'Administrador con acceso completo') ON CONFLICT DO NOTHING;
INSERT INTO roles(name, description) VALUES ('manager', 'Encargado de sucursal') ON CONFLICT DO NOTHING;
INSERT INTO roles(name, description) VALUES ('kitchen', 'Personal de cocina') ON CONFLICT DO NOTHING;
INSERT INTO roles(name, description) VALUES ('delivery', 'Repartidor') ON CONFLICT DO NOTHING;

-- Row Level Security example for profiles
-- Enable RLS on sensitive tables and allow only owners or admins
-- Note: requires Supabase service role to create policies via SQL

-- Example: protect orders table so only users from same branch or admins can see
-- (Assuming orders table has column branch_id and created_by)
--
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "orders_read_branch_or_admin" ON orders
--   FOR SELECT USING (
--     auth.role() = 'authenticated' AND (
--       (current_setting('request.jwt.claims.role', true) = 'admin') OR
--       (current_setting('request.jwt.claims.branch_id', true) = branch_id)
--     )
--   );

-- Instructions:
-- 1) Run this SQL in Supabase SQL editor.
-- 2) Ensure Supabase Auth is enabled and that the JWT contains 'role' and 'branch_id' in the claims (use custom claims during signup or map from profiles).
