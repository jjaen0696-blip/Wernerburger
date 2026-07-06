-- Políticas RLS de ejemplo para Supabase
-- Asegúrate de adaptar los nombres de roles y el mapeo de auth.uid() según tu setup

-- Habilitar RLS en tablas sensibles
alter table if exists orders enable row level security;
alter table if exists inventory enable row level security;
alter table if exists purchases enable row level security;
alter table if exists purchase_items enable row level security;
alter table if exists inventory_movements enable row level security;

-- Permitir lectura pública en productos e ingredientes (ajusta si lo prefieres privado)
alter table if exists products enable row level security;
create policy "public_select_products" on products for select using (true);

alter table if exists ingredients enable row level security;
create policy "public_select_ingredients" on ingredients for select using (true);

-- Helper: verificar rol del usuario en user_roles
-- Uso: EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = auth.uid()::uuid AND r.name = 'cocina' ...)

-- ORDERS: lectura limitada a usuarios asignados a la sucursal o super_admin
create policy "orders_select_branch" on orders
  for select
  using (
    exists (
      select 1 from user_roles ur join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()::uuid
        and (
          r.name = 'super_admin'
          or ur.branch_id is null
          or ur.branch_id = orders.branch_id
        )
    )
  );

-- ORDERS: permitir updates desde cocina/admin en su sucursal (principalmente para cambiar status)
create policy "orders_update_cocina" on orders
  for update
  using (
    exists (
      select 1 from user_roles ur join roles r on r.id = ur.role_id
      where ur.user_id = auth.uid()::uuid
        and r.name in ('cocina','admin','super_admin')
        and (ur.branch_id is null or ur.branch_id = orders.branch_id)
    )
  )
  with check (
    -- Solo permitir que cambien el status a uno de los permitidos desde la interfaz de cocina
    new.status in ('pending','accepted','preparing','ready','assigned','delivering','completed','cancelled')
  );

-- INVENTORY: lectura y escritura por usuarios de inventario o admin para la sucursal
create policy "inventory_read_branch" on inventory for select using (
  exists (
    select 1 from user_roles ur join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()::uuid
      and r.name in ('inventario','admin','super_admin')
      and (ur.branch_id is null or ur.branch_id = inventory.branch_id)
  )
);

create policy "inventory_update_branch" on inventory for update using (
  exists (
    select 1 from user_roles ur join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()::uuid
      and r.name in ('inventario','admin','super_admin')
      and (ur.branch_id is null or ur.branch_id = inventory.branch_id)
  )
);

-- PURCHASES: solo usuarios de inventario/admin pueden insertar compras para su sucursal
create policy "purchases_insert_branch" on purchases for insert with check (
  exists (
    select 1 from user_roles ur join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()::uuid
      and r.name in ('inventario','admin','super_admin')
      and (ur.branch_id is null or ur.branch_id = new.branch_id)
  )
);

-- INVENTORY_MOVEMENTS: registros visibles por inventario/admin
create policy "movements_select_branch" on inventory_movements for select using (
  exists (
    select 1 from user_roles ur join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()::uuid
      and r.name in ('inventario','admin','super_admin')
      and (ur.branch_id is null or ur.branch_id = inventory_movements.branch_id)
  )
);

-- USERS: permitir que cada usuario lea su propio registro
alter table if exists users enable row level security;
create policy "users_self_select" on users for select using (auth.uid()::uuid = id);
create policy "users_insert" on users for insert with check ( auth.uid()::uuid = id );

-- Nota: estas políticas son ejemplos y deben probarse en un entorno de staging.
-- Ajusta los nombres de roles y condiciones según la estructura real de `user_roles`.
