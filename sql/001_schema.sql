-- Schema inicial para Supabase (Postgres)
-- Crea tablas principales: sucursales, usuarios, roles, permisos, ingredientes, productos, recetas, inventarios, compras, movimientos, pedidos

-- Extensiones necesarias
create extension if not exists "pgcrypto";

-- Sucursales
create table branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz default now()
);

-- Roles y permisos
create table roles (
  id serial primary key,
  name text not null unique,
  description text
);

create table permissions (
  id serial primary key,
  name text not null unique,
  description text
);

create table role_permissions (
  role_id int references roles(id) on delete cascade,
  permission_id int references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Usuarios (para administración; usar Supabase Auth en producción)
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  username text,
  password_hash text,
  created_at timestamptz default now()
);

create table user_roles (
  user_id uuid references users(id) on delete cascade,
  role_id int references roles(id) on delete cascade,
  branch_id uuid references branches(id) on delete set null,
  primary key (user_id, role_id, branch_id)
);

-- Proveedores
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  created_at timestamptz default now()
);

-- Ingredientes (materia prima)
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  unit text not null,
  created_at timestamptz default now()
);

-- Productos vendibles
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  price numeric(10,2) not null default 0,
  description text,
  active boolean default true,
  created_at timestamptz default now()
);

-- Recetas: lista de ingredientes por producto
create table recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now()
);

create table recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete restrict,
  quantity numeric not null,
  unit text not null
);

-- Inventario por sucursal
create table inventory (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  quantity numeric not null default 0,
  unit text not null,
  min_stock numeric default 0,
  updated_at timestamptz default now(),
  unique (branch_id, ingredient_id)
);

-- Historial de movimientos de inventario (inmutable)
create type movement_type as enum('purchase','sale','adjustment','waste','transfer_out','transfer_in');

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  change_qty numeric not null,
  unit text not null,
  type movement_type not null,
  reference_id text,
  user_id uuid references users(id) on delete set null,
  created_at timestamptz default now()
);

-- Compras (ingresos al inventario)
create table purchases (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  user_id uuid references users(id) on delete set null,
  total numeric not null default 0,
  notes text,
  created_at timestamptz default now()
);

create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid references purchases(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete cascade,
  quantity numeric not null,
  unit text not null,
  unit_price numeric not null
);

-- Pedidos y ventas
create type delivery_type as enum('local','delivery');
create type payment_method as enum('efectivo','yappy','card','other');
create type order_status as enum('pending','accepted','preparing','ready','assigned','delivering','completed','cancelled');

create table orders (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid references branches(id) on delete set null,
  customer_name text,
  phone text,
  address text,
  delivery_type delivery_type not null default 'local',
  payment_method payment_method not null default 'efectivo',
  status order_status not null default 'pending',
  total numeric not null default 0,
  user_id uuid references users(id) on delete set null,
  created_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete restrict,
  quantity int not null,
  unit_price numeric not null
);

-- Delivery assignment
create table deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  driver_id uuid references users(id) on delete set null,
  status order_status,
  assigned_at timestamptz,
  delivered_at timestamptz
);

-- View: disponibilidad de producto según inventario y receta
create view product_availability as
select p.id as product_id, p.name as product_name, p.active,
  case when exists (
    select 1 from recipe_items ri
    join inventory inv on inv.ingredient_id = ri.ingredient_id
    where ri.recipe_id = r.id
      and inv.branch_id is not null
      and inv.quantity < ri.quantity
  ) then false else true end as available
from products p
left join recipes r on r.product_id = p.id;

-- Procedimiento para procesar deducción de inventario al confirmar pedido
create or replace function process_order_deduction(p_order_id uuid) returns void as $$
declare
  rec record;
  ri record;
  inv_qty numeric;
begin
  for rec in select * from order_items where order_id = p_order_id loop
    for ri in select * from recipe_items where recipe_id = (
      select id from recipes where product_id = rec.product_id limit 1
    ) loop
      select quantity into inv_qty from inventory where branch_id = (select branch_id from orders where id = p_order_id) and ingredient_id = ri.ingredient_id for update;
      if inv_qty is null then
        raise exception 'Ingrediente % no encontrado en inventario para esta sucursal', ri.ingredient_id;
      end if;
      if inv_qty < ri.quantity * rec.quantity then
        raise exception 'Stock insuficiente para ingrediente %', ri.ingredient_id;
      end if;
      update inventory set quantity = quantity - (ri.quantity * rec.quantity), updated_at = now() where branch_id = (select branch_id from orders where id = p_order_id) and ingredient_id = ri.ingredient_id;
      insert into inventory_movements (branch_id, ingredient_id, change_qty, unit, type, reference_id, user_id) values (
        (select branch_id from orders where id = p_order_id), ri.ingredient_id, - (ri.quantity * rec.quantity), ri.unit, 'sale', p_order_id::text, (select user_id from orders where id = p_order_id)
      );
    end loop;
  end loop;
  -- marcar pedido como accepted->preparing o similar fuera de esta función según flujo
end;
$$ language plpgsql;
