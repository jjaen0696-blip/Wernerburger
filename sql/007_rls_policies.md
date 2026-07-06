Guía y políticas RLS de ejemplo para Supabase

Este archivo no se ejecuta directamente. Contiene ejemplos y recomendaciones para configurar RLS y mapeo de roles con Supabase Auth.

1) Recomendación de flujo:
 - Usar Supabase Auth para gestionar usuarios.
 - Mantener la tabla `users` (local) para metadatos y mapear `auth.uid()` a `users.id`.
 - Añadir un claim personalizado `role` para cada usuario en JWT (o mapear desde `user_roles`).

2) Ejemplo de política para permitir que usuarios con role='cocina' actualicen `orders` status:

-- Habilitar RLS
-- alter table orders enable row level security;

-- Política (ejemplo)
-- create policy "cocina-update-orders" on orders
-- for update
-- using ( auth.role() = 'authenticated' )
-- with check ( exists (select 1 from user_roles ur where ur.user_id = auth.uid() and ur.role_id = (select id from roles where name='cocina') and (ur.branch_id = orders.branch_id or ur.branch_id is null) ) );

3) Política para lectura general en productos e ingredientes (cualquiera autenticado):
-- alter table products enable row level security;
-- create policy "public-read" on products for select using ( true );

4) Nota: Supabase permite agregar metadata JWT con `supabase.auth.admin.update_user_by_id` y `app_metadata`.

5) Antes de aplicar políticas, asegúrate de probar con usuarios de ejemplo y revisar `auth.uid()` y claims disponibles.
